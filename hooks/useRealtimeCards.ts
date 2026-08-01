'use client';
import { useEffect, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Tarjeta } from '@/types';
import { useBoard } from '@/contexts/BoardContext';

export function useRealtimeCards(salaId: string) {
  const { state, setTarjetas, setGrupos, addTarjeta, updateTarjeta, deleteTarjeta } =
    useBoard();
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null);
  const salaIdRef = useRef(salaId);

  useEffect(() => {
    salaIdRef.current = salaId;
    const supabase = getSupabaseBrowserClient();

    // Initial fetch of tarjetas + grupos
    async function fetchInitial() {
      try {
        const tarjetasRes = await fetch(`/api/salas/${salaId}/tarjetas`);
        const tarjetasData = await tarjetasRes.json();
        const payload = Array.isArray(tarjetasData) ? tarjetasData : tarjetasData?.tarjetas;
        setTarjetas(Array.isArray(payload) ? payload : []);

        // Fetch grupos separately
        try {
          const { data: grupos } = await supabase
            .from('grupos')
            .select('*')
            .eq('sala_id', salaId);
          if (grupos) setGrupos(grupos);
        } catch {
          // grupos table may not exist yet
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    }

    fetchInitial();

    // Subscribe to Realtime changes on tarjetas table
    const supabaseClient = getSupabaseBrowserClient();
    const channel = supabaseClient
      .channel(`sala-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tarjetas',
          filter: `sala_id=eq.${salaId}`,
        },
        (payload) => {
          const newCard = payload.new as Tarjeta;
          addTarjeta(newCard);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tarjetas',
          filter: `sala_id=eq.${salaId}`,
        },
        (payload) => {
          const updatedCard = payload.new as Tarjeta;
          updateTarjeta(updatedCard);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tarjetas',
          filter: `sala_id=eq.${salaId}`,
        },
        (payload) => {
          const oldCard = payload.old as Tarjeta;
          deleteTarjeta(oldCard.id);
        },
      )
      // Subscribe to grupos table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grupos',
          filter: `sala_id=eq.${salaId}`,
        },
        () => {
          // Re-fetch all grupos on any change (INSERT/UPDATE/DELETE)
          const client = getSupabaseBrowserClient();
          client
            .from('grupos')
            .select('*')
            .eq('sala_id', salaId)
            .then(
              ({ data }) => { if (data) setGrupos(data); },
              () => {}
            );
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected for sala:', salaId);
        }
      });

    channel.on('system', { event: '*' }, (event) => {
      if (typeof event === 'string') {
        console.log('System event:', event);
      }
    });

    channelRef.current = channel;

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [salaId, setTarjetas, setGrupos, addTarjeta, updateTarjeta, deleteTarjeta]);

  return {
    tarjetas: state.tarjetas,
    grupos: state.grupos,
    columnas: state.columnas,
    loading: state.loading,
    error: state.error,
  };
}
