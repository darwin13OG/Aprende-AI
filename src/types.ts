export interface QuizQuestion {
  pregunta: string;
  opciones: string[];
  correcta: number; // 0-indexed: 0, 1, 2, 3
  explicacion: string;
  xp?: number;
  videoRef?: {
    label: string;
    timestamp: string;
  };
}

export interface Flashcard {
  concepto: string;
  definicion: string;
  subtitulo?: string;
  formula?: string;
  ejemplo?: string;
  srsState?: 'dificil' | 'bien' | 'facil';
}

export interface MindmapSubnode {
  id?: string;
  titulo: string;
  categoria?: string;
  detalles: string[];
  videoMin?: string;
  quizzesCount?: number;
  tags?: string[];
}

export interface MindmapData {
  nodoPrincipal: string;
  subnodos: MindmapSubnode[];
}

export interface Fuente {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'imagen' | 'texto' | 'web' | 'youtube';
  url?: string;
  tamano?: string;
  estado?: 'Cargado' | 'Analizado' | 'Extrayendo' | 'Procesado' | 'OCR extraído' | string;
  base64?: string;
  mimeType?: string;
  extractedText?: string;
  fecha?: string;
}

export interface LearningExperience {
  id: string;
  tema: string;
  subtitulo?: string;
  autor?: string;
  version?: string;
  createdAt: string;
  fuentes: Fuente[];
  stats?: {
    quizViews?: number;
    cardViews?: number;
    mapViews?: number;
  };
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  mindmap: MindmapData;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  sourcesCited?: string[];
}

export interface Entorno {
  id: string;
  nombre: string;
  createdAt: string;
  hasGenerated: boolean;
  fuentes: Fuente[];
  promptText?: string;
  topic?: string;
  experience?: LearningExperience;
  chatMessages?: ChatMessage[];
}

export type ActiveTab = 'entorno' | 'creador' | 'quiz' | 'cards' | 'map';

export interface GeneratePayload {
  promptText?: string;
  topic?: string;
  fileBase64?: string;
  fileMimeType?: string;
  fileName?: string;
  sources?: Fuente[];
}

