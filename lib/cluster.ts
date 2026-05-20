const AI_API_URL = process.env.ZEN_API_URL || 'https://openrouter.ai/api/v1';
const AI_API_KEY = process.env.ZEN_API_KEY || '';
const MODEL = process.env.ZEN_MODEL || 'openrouter/free';

const SYSTEM_PROMPT = `Eres un asistente que agrupa tarjetas de retrospectiva Scrum por similitud SEMÁNTICA.
Recibes tarjetas con id y contenido. Tu tarea es DETECTAR el tema subyacente de cada tarjeta y agrupar las que hablen de lo MISMO aunque usen palabras diferentes.

Ejemplo: "Buen trabajo en equipo" y "Continuar trabajando juntos" → mismo tema "Trabajo en equipo"
Ejemplo: "Mejorar la comunicación" y "Faltó información entre áreas" → mismo tema "Comunicación"
Ejemplo: "Faltaron herramientas" y "Necesitamos mejor software" → mismo tema "Herramientas"

Responde SOLO con un JSON válido con esta estructura EXACTA:
{
  "grupos": [
    {
      "nombre_grupo": "Trabajo en equipo",
      "tarjetas": ["id1", "id2"]
    }
  ]
}

Reglas:
- Usa SIEMPRE "nombre_grupo" como clave
- "tarjetas" debe ser un array de SOLO los IDs (strings), NO objetos
- Agrupa AUN si solo hay 2 tarjetas que coinciden en tema
- NO agrupes tarjetas con temas diferentes
- Las tarjetas que no coincidan con ningún grupo, déjalas sueltas (no las incluyas)
- Crea hasta 5 grupos como máximo
- Nombres cortos: 2-4 palabras, descriptivos del tema común
- Prioriza detectar el tema REAL por encima de las palabras exactas`;

export interface ClusterInput {
  id: string;
  contenido: string;
}

export interface ClusterGroup {
  nombre_grupo: string;
  tarjetas: string[];
}

export interface ClusterOutput {
  grupos: ClusterGroup[];
}

export async function clusterCards(tarjetas: ClusterInput[]): Promise<ClusterOutput> {
  if (tarjetas.length === 0) {
    throw new Error('No hay tarjetas para agrupar');
  }

  const userPrompt = JSON.stringify(tarjetas, null, 2);

  // OpenRouter requires HTTP-Referer for free model access
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`,
  };
  if (AI_API_URL.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  const response = await fetch(`${AI_API_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API error (${response.status}): ${response.statusText} — ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const finishReason = data.choices?.[0]?.finish_reason;

  if (!content) {
    const error = data.error?.message || data.error || '';
    throw new Error(
      `Respuesta vacía del proveedor AI (finish_reason: ${finishReason || 'N/A'})${error ? ` — ${error}` : ''}`
    );
  }

  // Try to parse JSON from response
  try {
    // The model might wrap JSON in markdown code blocks
    const jsonStr = content.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (!isValidClusterResponse(parsed)) {
      console.error('[cluster] Invalid AI response:', JSON.stringify(parsed, null, 2));
      throw new Error('Respuesta con formato inválido');
    }

    const grupos = normalizeGrupos(parsed.grupos);
    return { grupos };
  } catch (parseError) {
    throw new Error(`Error al parsear respuesta de IA: ${parseError instanceof Error ? parseError.message : 'parse error'}`);
  }
}

function isValidClusterResponse(data: any): data is ClusterOutput {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.grupos)) return false;

  return data.grupos.every((g: any) => {
    // Accept name from any of these keys
    const name = g.nombre_grupo ?? g.categoria ?? g.nombre ?? g.name;
    if (typeof name !== 'string' || name.trim().length === 0) return false;
    if (!Array.isArray(g.tarjetas) || g.tarjetas.length === 0) return false;
    // Accept both string IDs and objects with id property
    return g.tarjetas.every((t: any) => typeof t === 'string' || (t && typeof t.id === 'string'));
  });
}

function normalizeGrupos(grupos: any[]): ClusterGroup[] {
  return grupos.map(g => {
    const nombre_grupo = g.nombre_grupo ?? g.categoria ?? g.nombre ?? g.name ?? 'Sin nombre';
    const tarjetas = g.tarjetas.map((t: any) => typeof t === 'string' ? t : t.id);
    return { nombre_grupo, tarjetas };
  });
}
