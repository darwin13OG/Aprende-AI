import LZString from 'lz-string';
import { LearningExperience, QuizQuestion, Flashcard, MindmapData } from '../types.ts';

export type ShareType = 'all' | 'quiz' | 'cards' | 'map';

export interface SharedPayload {
  id?: string;
  type: ShareType;
  tema: string;
  autor?: string;
  socialRed?: string; // e.g. 'YouTube', 'Instagram', 'TikTok', 'X', 'GitHub', 'Web'
  socialUrl?: string; // e.g. 'https://youtube.com/@dalzatec'
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  mindmap?: MindmapData;
  createdAt?: string;
}

export function formatSocialUrl(platform: string, handleOrUrl: string): string {
  if (!handleOrUrl || !handleOrUrl.trim()) return '';
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, '');
  switch (platform.toLowerCase()) {
    case 'youtube':
      return `https://www.youtube.com/@${clean}`;
    case 'instagram':
      return `https://www.instagram.com/${clean}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${clean}`;
    case 'x':
    case 'twitter':
      return `https://x.com/${clean}`;
    case 'github':
      return `https://github.com/${clean}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${clean}`;
    case 'web':
    default:
      return `https://${trimmed}`;
  }
}

/**
 * Strips away any chat, raw files, or source materials.
 * Extracts ONLY the requested educational content.
 */
export function buildSanitizedSharePayload(
  experience: LearningExperience,
  type: ShareType,
  autor?: string,
  socialRed?: string,
  socialUrl?: string
): SharedPayload {
  const shortId = `s-${Math.random().toString(36).substring(2, 8)}`;
  const effectiveAutor = autor || experience.autor || '@creador';
  const computedUrl = socialRed && socialUrl ? formatSocialUrl(socialRed, socialUrl) : (socialUrl || '');

  const base: SharedPayload = {
    id: shortId,
    type,
    tema: experience.tema || 'Tema de Estudio',
    autor: effectiveAutor.startsWith('@') ? effectiveAutor : `@${effectiveAutor}`,
    socialRed: socialRed || undefined,
    socialUrl: computedUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  if (type === 'all') {
    base.quiz = experience.quiz || [];
    base.flashcards = experience.flashcards || [];
    base.mindmap = experience.mindmap;
  } else if (type === 'quiz') {
    base.quiz = experience.quiz || [];
  } else if (type === 'cards') {
    base.flashcards = experience.flashcards || [];
  } else if (type === 'map') {
    base.mindmap = experience.mindmap;
  }

  // Cache in localStorage for immediate local access
  try {
    localStorage.setItem(`aprende_share_${shortId}`, JSON.stringify(base));
  } catch (e) {
    // Ignore storage quota limits
  }

  // Also sync to server in background
  try {
    fetch('/api/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...base, id: shortId }),
    }).catch(() => {});
  } catch (e) {
    // Silent fail in client-only
  }

  return base;
}

/**
 * Generates a clean, short, normal URL for sharing.
 * E.g.: https://aprende-ai.pages.dev/#share?id=s-a7b2
 */
export function generateShareUrl(
  payload: SharedPayload,
  domain = 'https://aprende-ai.pages.dev'
): string {
  const shareId = payload.id || `s-${Math.random().toString(36).substring(2, 8)}`;
  
  // Clean, short normal URL format
  return `${domain}/#share?id=${shareId}`;
}

/**
 * Generates a self-contained portable link (for cross-device sharing without server)
 * using minified keys to keep it remarkably compact.
 */
export function generateCompactPortableUrl(
  payload: SharedPayload,
  domain = 'https://aprende-ai.pages.dev'
): string {
  try {
    // Minify JSON structure for 70%+ smaller size
    const mini = {
      i: payload.id,
      t: payload.type,
      m: payload.tema,
      u: payload.autor,
      sr: payload.socialRed,
      su: payload.socialUrl,
      q: payload.quiz?.map((q) => [q.pregunta, q.opciones, q.correcta, q.explicacion]),
      f: payload.flashcards?.map((f) => [f.concepto, f.definicion, f.subtitulo || '']),
      mp: payload.mindmap
        ? [
            payload.mindmap.nodoPrincipal,
            payload.mindmap.subnodos.map((s) => [s.titulo, s.categoria || '', s.detalles]),
          ]
        : null,
    };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(mini));
    return `${domain}/#share?d=${compressed}`;
  } catch {
    const jsonStr = JSON.stringify(payload);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return `${domain}/#share?d=${compressed}`;
  }
}

/**
 * Decodes the shared payload from URL hash or query string.
 */
export function parseSharedPayloadFromUrl(): SharedPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const hash = window.location.hash;
    if (!hash.includes('share') && !hash.includes('#/estudio')) return null;

    const queryString = hash.split('?')[1] || window.location.search.replace(/^\?/, '');
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);
    const id = params.get('id');
    const compressedData = params.get('d');

    // 1. Try resolving by short ID from localStorage
    if (id) {
      const cached = localStorage.getItem(`aprende_share_${id}`);
      if (cached) {
        return JSON.parse(cached) as SharedPayload;
      }
    }

    // 2. Try decompressing data if provided in URL
    if (compressedData) {
      const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        // Check if minified format
        if (parsed.m && (parsed.q || parsed.f || parsed.mp)) {
          const reconstructed: SharedPayload = {
            id: parsed.i,
            type: parsed.t,
            tema: parsed.m,
            autor: parsed.u || parsed.autor || '@creador',
            socialRed: parsed.sr || parsed.socialRed,
            socialUrl: parsed.su || parsed.socialUrl,
            quiz: parsed.q?.map((q: any) => ({
              pregunta: q[0],
              opciones: q[1],
              correcta: q[2],
              explicacion: q[3],
            })),
            flashcards: parsed.f?.map((f: any) => ({
              concepto: f[0],
              definicion: f[1],
              subtitulo: f[2],
            })),
            mindmap: parsed.mp
              ? {
                  nodoPrincipal: parsed.mp[0],
                  subnodos: parsed.mp[1]?.map((s: any) => ({
                    titulo: s[0],
                    categoria: s[1],
                    detalles: s[2],
                  })),
                }
              : undefined,
          };
          return reconstructed;
        }
        return parsed as SharedPayload;
      }
    }
  } catch (err) {
    console.error('Error decoding shared payload:', err);
  }

  return null;
}

/**
 * Asynchronously fetch from server if accessed by short ID across devices
 */
export async function fetchSharedPayloadById(id: string): Promise<SharedPayload | null> {
  try {
    const res = await fetch(`/api/experiences/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.experience) {
        return data.experience as SharedPayload;
      }
    }
  } catch (err) {
    console.error('Error fetching shared payload by id:', err);
  }
  return null;
}
