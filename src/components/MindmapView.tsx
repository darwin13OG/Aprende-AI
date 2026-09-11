import React, { useState, useRef } from 'react';
import { MindmapData, MindmapSubnode, ActiveTab } from '../types.ts';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Play,
  Share2,
  FileDown,
  Brain,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface MindmapViewProps {
  mindmap: MindmapData;
  topicTitle: string;
  author?: string;
  onGoToQuiz: () => void;
  onShareNode: (nodeTitle: string) => void;
}

export const MindmapView: React.FC<MindmapViewProps> = ({
  mindmap,
  topicTitle,
  author = '@AprendeAI',
  onGoToQuiz,
  onShareNode,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('central');
  const [exportNotice, setExportNotice] = useState(false);

  if (!mindmap || !mindmap.subnodos || mindmap.subnodos.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0b1528] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
          <Brain className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Sin mapa mental generado</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Este entorno aún no tiene un mapa mental interactivo generado. Sube tus fuentes en la pestaña Entorno para estructurarlo con IA.
        </p>
      </div>
    );
  }

  const subnodos = mindmap.subnodos || [];
  const totalNodesCount = 1 + subnodos.length + subnodos.reduce((acc, n) => acc + (n.detalles?.length || 0), 0);

  // Layout calculations for interactive SVG graph
  const centerPos = { x: 300, y: 220 };
  const radius = 145;

  // Calculate coordinates for surrounding subnodes around the central node
  const nodePositions = subnodos.map((node, index) => {
    const angle = (index * (2 * Math.PI)) / Math.max(subnodos.length, 1) - Math.PI / 2;
    return {
      id: node.id || `node-${index}`,
      node,
      x: centerPos.x + radius * Math.cos(angle) * 1.35,
      y: centerPos.y + radius * Math.sin(angle) * 0.85,
    };
  });

  const selectedNode =
    selectedNodeId === 'central'
      ? {
          titulo: mindmap.nodoPrincipal,
          categoria: 'NODO CENTRAL',
          detalles: [
            'Eje conductor del micro-aprendizaje.',
            'Conecta arquitecturas, entrenamiento y aplicaciones modernas.',
          ],
          videoMin: '8:20',
          quizzesCount: 3,
          tags: ['Fundamento', 'Ecosistema'],
        }
      : subnodos.find((n, idx) => (n.id || `node-${idx}`) === selectedNodeId) || subnodos[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setZoomLevel(1);

  const handleExport = () => {
    const dataStr = JSON.stringify(mindmap, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${topicTitle.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-4 space-y-4 animate-fadeIn select-none">
      {/* Exploration Header & Badges */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Modo Exploración</span>
        </div>
        <span className="text-slate-400 font-mono text-xs">{author}</span>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-cyan-300 font-bold">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>{totalNodesCount} Nodos</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-left space-y-0.5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Ecosistema de {mindmap.nodoPrincipal || topicTitle}
        </h2>
      </div>

      {/* Interactive Vector Graph Canvas Box */}
      <div className="relative w-full h-[330px] sm:h-[350px] rounded-2xl bg-[#0b1528] border border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(0,102,255,0.2)]">
        {/* Subtle Cyber Matrix Dot Grid */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#00d2ff 1px, transparent 1px), radial-gradient(#0066ff 1px, #0b1528 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        {/* Floating Top Hint Pill */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070d1a]/85 border border-cyan-500/30 backdrop-blur-sm text-[11px] text-cyan-300 font-medium shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Toca un nodo para inspeccionar</span>
        </div>

        {/* Floating Pan/Zoom Controls on the right */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-[#070d1a]/85 border border-cyan-500/30 p-1 rounded-xl backdrop-blur-sm shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 transition"
            title="Acercar"
            aria-label="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 transition"
            title="Alejar"
            aria-label="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 transition"
            title="Restablecer vista"
            aria-label="Restablecer vista"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive SVG Rendering */}
        <svg
          viewBox="0 0 600 440"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00d2ff" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Glowing Connecting Splines / Bezier Curves */}
          {nodePositions.map((pos) => {
            const isConnectedSelected =
              selectedNodeId === 'central' || selectedNodeId === pos.id;
            return (
              <g key={`edge-${pos.id}`}>
                {/* Background glow line */}
                <path
                  d={`M ${centerPos.x} ${centerPos.y} Q ${(centerPos.x + pos.x) / 2} ${(centerPos.y + pos.y) / 2 + (pos.y > centerPos.y ? 20 : -20)} ${pos.x} ${pos.y}`}
                  fill="none"
                  stroke={isConnectedSelected ? '#00d2ff' : 'rgba(0,102,255,0.4)'}
                  strokeWidth={isConnectedSelected ? '3' : '1.5'}
                  strokeDasharray={isConnectedSelected ? 'none' : '4,4'}
                  filter={isConnectedSelected ? 'url(#glow)' : undefined}
                />
                {/* Moving signal pulse particle */}
                {isConnectedSelected && (
                  <circle r="3" fill="#ffffff">
                    <animateMotion
                      path={`M ${centerPos.x} ${centerPos.y} Q ${(centerPos.x + pos.x) / 2} ${(centerPos.y + pos.y) / 2 + (pos.y > centerPos.y ? 20 : -20)} ${pos.x} ${pos.y}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Central Node */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedNodeId('central')}
          >
            <rect
              x={centerPos.x - 110}
              y={centerPos.y - 32}
              width="220"
              height="64"
              rx="16"
              fill={selectedNodeId === 'central' ? '#0066ff' : '#08142b'}
              stroke="#00d2ff"
              strokeWidth={selectedNodeId === 'central' ? '2.5' : '1.5'}
              filter={selectedNodeId === 'central' ? 'url(#glow)' : undefined}
            />
            {/* Brain Icon Square inside Node */}
            <rect
              x={centerPos.x - 98}
              y={centerPos.y - 18}
              width="36"
              height="36"
              rx="10"
              fill="#060e20"
              stroke="#00d2ff"
              strokeWidth="1"
            />
            <text
              x={centerPos.x - 80}
              y={centerPos.y + 5}
              fill="#00d2ff"
              fontSize="16"
              textAnchor="middle"
            >
              🧠
            </text>
            <text
              x={centerPos.x - 52}
              y={centerPos.y - 6}
              fill="#b3c5ff"
              fontSize="10"
              fontWeight="bold"
              letterSpacing="0.05em"
            >
              NODO CENTRAL
            </text>
            <text
              x={centerPos.x - 52}
              y={centerPos.y + 14}
              fill="#ffffff"
              fontSize="13"
              fontWeight="bold"
            >
              {mindmap.nodoPrincipal.length > 18
                ? mindmap.nodoPrincipal.substring(0, 16) + '...'
                : mindmap.nodoPrincipal}
            </text>
          </g>

          {/* Subnodes */}
          {nodePositions.map((pos) => {
            const isSelected = selectedNodeId === pos.id;
            return (
              <g
                key={pos.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => setSelectedNodeId(pos.id)}
              >
                <rect
                  x={pos.x - 85}
                  y={pos.y - 24}
                  width="170"
                  height="48"
                  rx="14"
                  fill={isSelected ? '#0066ff' : '#08142b'}
                  stroke={isSelected ? '#00d2ff' : 'rgba(0, 210, 255, 0.35)'}
                  strokeWidth={isSelected ? '2' : '1'}
                  filter={isSelected ? 'url(#glow)' : undefined}
                />
                <text
                  x={pos.x - 70}
                  y={pos.y + 5}
                  fill={isSelected ? '#ffffff' : '#dae2fd'}
                  fontSize="12"
                  fontWeight="600"
                >
                  {pos.node.titulo.length > 16
                    ? pos.node.titulo.substring(0, 14) + '...'
                    : pos.node.titulo}
                </text>
                {/* Counter pill */}
                <rect
                  x={pos.x + 50}
                  y={pos.y - 12}
                  width="22"
                  height="22"
                  rx="7"
                  fill="#060e20"
                  stroke="#00d2ff"
                  strokeWidth="0.8"
                />
                <text
                  x={pos.x + 61}
                  y={pos.y + 3}
                  fill="#00d2ff"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {pos.node.detalles?.length || 2}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="rounded-2xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/30 p-5 space-y-4 shadow-md text-left animate-fadeIn">
          {/* Node Category & Title Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-500/40 text-blue-600 dark:text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                    {selectedNode.categoria || 'ARQUITECTURA CONCEPTUAL'}
                  </span>
                  {selectedNode.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-blue-950/80 border border-slate-200 dark:border-blue-400/30 text-[10px] font-semibold text-slate-600 dark:text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedNode.titulo}
                </h3>
              </div>
            </div>
          </div>

          {/* Details / Summary Points */}
          <div className="space-y-2">
            {selectedNode.detalles?.map((det, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{det}</span>
              </div>
            ))}
          </div>

          {/* Associated Quizzes Button */}
          <button
            onClick={onGoToQuiz}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm font-bold text-white shadow-sm flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>Resolver Quizzes asociados</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-700/80 text-[11px] font-mono">
              {selectedNode.quizzesCount || 3} preguntas
            </span>
          </button>

          {/* Export & Share Secondary Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleExport}
              className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-500/30 hover:border-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition"
            >
              <FileDown className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>{exportNotice ? '¡Descargado!' : 'Exportar JSON'}</span>
            </button>
            <button
              onClick={() => onShareNode(selectedNode.titulo)}
              className="py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-500/30 hover:border-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Compartir Rama</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
