'use client';
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Tarjeta, Grupo } from '@/types';

// State
interface BoardState {
  tarjetas: Tarjeta[];
  grupos: Grupo[];
  columnas: Record<number, Tarjeta[]>;  // columna_id -> tarjetas
  dragState: { cardId: string | null; sourceColumna: number | null };
  loading: boolean;
  error: string | null;
}

// Actions
type BoardAction =
  | { type: 'SET_TARJETAS'; payload: Tarjeta[] }
  | { type: 'SET_GRUPOS'; payload: Grupo[] }
  | { type: 'ADD_TARJETA'; payload: Tarjeta }
  | { type: 'UPDATE_TARJETA'; payload: Tarjeta }
  | { type: 'DELETE_TARJETA'; payload: string }
  | { type: 'MOVE_TARJETA'; payload: { tarjetaId: string; newColumna: number } }
  | { type: 'SET_DRAG'; payload: { cardId: string | null; sourceColumna: number | null } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GRUPOS_TARJETAS'; payload: { grupos: Grupo[]; tarjetas: Tarjeta[] } };  // After clustering

const initialState: BoardState = {
  tarjetas: [],
  grupos: [],
  columnas: { 1: [], 2: [], 3: [], 4: [] },
  dragState: { cardId: null, sourceColumna: null },
  loading: true,
  error: null,
};

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_TARJETAS': {
      const tarjetas = action.payload;
      const columnas: Record<number, Tarjeta[]> = { 1: [], 2: [], 3: [], 4: [] };
      for (const t of tarjetas) {
        if (columnas[t.columna_id]) {
          columnas[t.columna_id].push(t);
        }
      }
      return { ...state, tarjetas, columnas, loading: false };
    }
    case 'ADD_TARJETA': {
      const t = action.payload;
      const columnas = { ...state.columnas };
      columnas[t.columna_id] = [...(columnas[t.columna_id] || []), t];
      return { ...state, tarjetas: [...state.tarjetas, t], columnas };
    }
    case 'UPDATE_TARJETA': {
      const updated = action.payload;
      const tarjetas = state.tarjetas.map(t => t.id === updated.id ? updated : t);
      const columnas: Record<number, Tarjeta[]> = { 1: [], 2: [], 3: [], 4: [] };
      for (const t of tarjetas) {
        if (columnas[t.columna_id]) {
          columnas[t.columna_id].push(t);
        }
      }
      return { ...state, tarjetas, columnas };
    }
    case 'DELETE_TARJETA': {
      const tarjetas = state.tarjetas.filter(t => t.id !== action.payload);
      const columnas: Record<number, Tarjeta[]> = { 1: [], 2: [], 3: [], 4: [] };
      for (const t of tarjetas) {
        if (columnas[t.columna_id]) {
          columnas[t.columna_id].push(t);
        }
      }
      return { ...state, tarjetas, columnas };
    }
    case 'MOVE_TARJETA': {
      const { tarjetaId, newColumna } = action.payload;
      const tarjetas = state.tarjetas.map(t =>
        t.id === tarjetaId ? { ...t, columna_id: newColumna } : t
      );
      const columnas: Record<number, Tarjeta[]> = { 1: [], 2: [], 3: [], 4: [] };
      for (const t of tarjetas) {
        if (columnas[t.columna_id]) {
          columnas[t.columna_id].push(t);
        }
      }
      return { ...state, tarjetas, columnas };
    }
    case 'SET_GRUPOS':
      return { ...state, grupos: action.payload };
    case 'SET_GRUPOS_TARJETAS':
      return {
        ...state,
        grupos: action.payload.grupos,
        tarjetas: action.payload.tarjetas,
        columnas: rebuildColumnas(action.payload.tarjetas),
      };
    case 'SET_DRAG':
      return { ...state, dragState: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

function rebuildColumnas(tarjetas: Tarjeta[]): Record<number, Tarjeta[]> {
  const columnas: Record<number, Tarjeta[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const t of tarjetas) {
    if (columnas[t.columna_id]) {
      columnas[t.columna_id].push(t);
    }
  }
  return columnas;
}

// Context
interface BoardContextType {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
  setTarjetas: (tarjetas: Tarjeta[]) => void;
  setGrupos: (grupos: Grupo[]) => void;
  addTarjeta: (tarjeta: Tarjeta) => void;
  updateTarjeta: (tarjeta: Tarjeta) => void;
  deleteTarjeta: (id: string) => void;
  moveTarjeta: (tarjetaId: string, newColumna: number) => void;
  setDrag: (cardId: string | null, sourceColumna: number | null) => void;
}

const BoardContext = createContext<BoardContextType | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  const setTarjetas = useCallback((tarjetas: Tarjeta[]) => dispatch({ type: 'SET_TARJETAS', payload: tarjetas }), []);
  const setGrupos = useCallback((grupos: Grupo[]) => dispatch({ type: 'SET_GRUPOS', payload: grupos }), []);
  const addTarjeta = useCallback((tarjeta: Tarjeta) => dispatch({ type: 'ADD_TARJETA', payload: tarjeta }), []);
  const updateTarjeta = useCallback((tarjeta: Tarjeta) => dispatch({ type: 'UPDATE_TARJETA', payload: tarjeta }), []);
  const deleteTarjeta = useCallback((id: string) => dispatch({ type: 'DELETE_TARJETA', payload: id }), []);
  const moveTarjeta = useCallback((tarjetaId: string, newColumna: number) => dispatch({ type: 'MOVE_TARJETA', payload: { tarjetaId, newColumna } }), []);
  const setDrag = useCallback((cardId: string | null, sourceColumna: number | null) => dispatch({ type: 'SET_DRAG', payload: { cardId, sourceColumna } }), []);

  return (
    <BoardContext.Provider value={{ state, dispatch, setTarjetas, setGrupos, addTarjeta, updateTarjeta, deleteTarjeta, moveTarjeta, setDrag }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard(): BoardContextType {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within BoardProvider');
  return context;
}
