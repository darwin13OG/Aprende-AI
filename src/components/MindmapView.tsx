import React, { useState, useRef, useEffect } from 'react';
import { MindmapData } from '../types.ts';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  FileDown,
  Brain,
  HelpCircle,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Sparkles,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';

interface MindmapViewProps {
  mindmap: MindmapData;
  topicTitle: string;
  author?: string;
  fuentesCount?: number;
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingMouse, setIsDraggingMouse] = useState<boolean>(false);
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('central');
  const [selectedDetailIdx, setSelectedDetailIdx] = useState<number | null>(null);
  const [copiedDetailIdx, setCopiedDetailIdx] = useState<number | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [exportNotice, setExportNotice] = useState(false);

  // Track if mouse click was a drag or simple click
  const dragDistanceRef = useRef<number>(0);

  // Mobile Touch Gestures Ref
  const touchStateRef = useRef<{
    isPanning: boolean;
    isPinching: boolean;
    startX: number;
    startY: number;
    startDist: number;
    startZoom: number;
  }>({
    isPanning: false,
    isPinching: false,
    startX: 0,
    startY: 0,
    startDist: 0,
    startZoom: 1,
  });

  if (!mindmap || !mindmap.subnodos || mindmap.subnodos.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0b1528] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
          <Brain className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Sin mapa mental generado</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Sube tus fuentes en la pestaña Entorno para estructurar el mapa conceptual con IA.
        </p>
      </div>
    );
  }

  const subnodos = mindmap.subnodos || [];

  // Spacious coordinate canvas configuration
  const viewBoxWidth = 1000;
  const viewBoxHeight = 680;
  const centerPos = { x: 500, y: 340 };
  const rx = 300;
  const ry = 210;

  // Toggle expansion of branches that have details
  const toggleNodeExpansion = (nodeId: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const nodesWithBranches = subnodos.filter((s) => s.detalles && s.detalles.length > 0);

  const handleToggleAll = () => {
    if (expandedNodes.size >= nodesWithBranches.length && nodesWithBranches.length > 0) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set(
        nodesWithBranches.map((s, idx) => s.id || `node-${subnodos.indexOf(s)}`)
      );
      setExpandedNodes(allIds);
    }
  };

  // Compute node positions with collision prevention
  const nodePositions = subnodos.map((node, index) => {
    const id = node.id || `node-${index}`;
    const angle = (index * (2 * Math.PI)) / Math.max(subnodos.length, 1) - Math.PI / 2;
    const x = centerPos.x + rx * Math.cos(angle);
    const y = centerPos.y + ry * Math.sin(angle);
    const hasBranches = Boolean(node.detalles && node.detalles.length > 0);
    const isExpanded = hasBranches && expandedNodes.has(id);

    const childBranches = (node.detalles || []).map((det, childIdx) => {
      const childCount = node.detalles.length;
      const angleOffset = (childIdx - (childCount - 1) / 2) * 0.22;
      const childAngle = angle + angleOffset;
      const dist = 100;
      const cx = x + dist * Math.cos(childAngle) * 1.15;
      const cy = y + dist * Math.sin(childAngle);
      return {
        idx: childIdx,
        text: det,
        x: cx,
        y: cy,
      };
    });

    return {
      id,
      node,
      angle,
      x,
      y,
      hasBranches,
      isExpanded,
      childBranches,
    };
  });

  const selectedSubnode = subnodos.find((n, idx) => (n.id || `node-${idx}`) === selectedNodeId);

  const selectedNode =
    selectedNodeId === 'central'
      ? {
          titulo: mindmap.nodoPrincipal,
          categoria: 'NODO PRINCIPAL',
          descripcion:
            'Eje central estructurador del contenido. Desde aquí se ramifican y conectan los conceptos clave, mecanismos y principios fundamentales extraídos de tus fuentes de estudio.',
          detalles:
            subnodos.length > 0
              ? subnodos.map(
                  (s) =>
                    `${s.titulo}${s.categoria ? ` — [${s.categoria}]` : ''}${
                      s.descripcion ? `: ${s.descripcion}` : ''
                    }`
                )
              : [
                  'Eje temático estructurador del conocimiento.',
                  'Integra y sintetiza los pilares fundamentales extraídos de tus fuentes.',
                ],
          videoMin: '10:00',
          quizzesCount: 4,
          tags: ['Eje Central', `${subnodos.length} Ramas`],
        }
      : selectedSubnode || subnodos[0];

  // PC Mouse Handlers: Only drag when left button is pressed
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragDistanceRef.current = 0;
    setIsDraggingMouse(true);
    setMouseStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMouse) return;
    const newX = e.clientX - mouseStart.x;
    const newY = e.clientY - mouseStart.y;
    dragDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDraggingMouse(false);
  };

  // PC Wheel Handler: Only zoom if Ctrl/Cmd is held (like Figma/Google Maps), otherwise allow natural page scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomStep = e.deltaY < 0 ? 0.12 : -0.12;
      setZoomLevel((prev) => Math.min(2.5, Math.max(0.4, Number((prev + zoomStep).toFixed(2)))));
    }
  };

  // Mobile Touch Handlers: 1 finger Pan, 2 fingers Pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStateRef.current.isPanning = true;
      touchStateRef.current.isPinching = false;
      touchStateRef.current.startX = e.touches[0].clientX - panOffset.x;
      touchStateRef.current.startY = e.touches[0].clientY - panOffset.y;
    } else if (e.touches.length === 2) {
      touchStateRef.current.isPanning = false;
      touchStateRef.current.isPinching = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current.startDist = dist;
      touchStateRef.current.startZoom = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStateRef.current.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStateRef.current.startDist > 0) {
        const factor = currentDist / touchStateRef.current.startDist;
        const newZoom = touchStateRef.current.startZoom * factor;
        setZoomLevel(Math.min(2.5, Math.max(0.4, Number(newZoom.toFixed(2)))));
      }
    } else if (touchStateRef.current.isPanning && e.touches.length === 1) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      setPanOffset({
        x: currentX - touchStateRef.current.startX,
        y: currentY - touchStateRef.current.startY,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.isPanning = false;
    touchStateRef.current.isPinching = false;
  };

  // Zoom control triggers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.4));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

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
    <div
      className={`w-full mx-auto px-2 sm:px-4 pb-24 space-y-3 select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#060c18] p-4 sm:p-6 overflow-y-auto flex flex-col'
          : 'max-w-5xl pt-1 animate-fadeIn'
      }`}
    >
      {/* Top Header: Clean title and navigation tools */}
      <div className="flex items-center justify-between gap-3 text-left">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">
            {mindmap.nodoPrincipal || topicTitle}
          </h2>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {nodesWithBranches.length > 0 && (
            <button
              onClick={handleToggleAll}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title={
                expandedNodes.size >= nodesWithBranches.length
                  ? 'Contraer ramas'
                  : 'Desglosar todas las ramas'
              }
            >
              {expandedNodes.size >= nodesWithBranches.length ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Contraer</span>
                </>
              ) : (
                <>
                  <FolderTree className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desglosar</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-[#081329] border border-cyan-500/30 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition active:scale-95"
            title="Centrar mapa"
            aria-label="Centrar mapa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[#081329] border border-cyan-500/30 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition active:scale-95"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Spacious Interactive Graph Canvas */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full rounded-2xl bg-[#081122] border border-cyan-500/30 overflow-hidden shadow-[0_0_35px_rgba(0,102,255,0.22)] ${
          isDraggingMouse ? 'cursor-grabbing' : 'cursor-grab'
        } ${isFullscreen ? 'flex-1 min-h-[520px]' : 'h-[500px] sm:h-[580px]'}`}
      >
        {/* Background Dot Matrix Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#00d2ff 1px, transparent 1px), radial-gradient(#0066ff 1px, #081122 1px)',
            backgroundSize: '28px 28px',
            backgroundPosition: `${panOffset.x % 28}px ${panOffset.y % 28}px`,
          }}
        />

        {/* Floating Zoom Controls (+ / - / %) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-[#070d1a]/90 border border-cyan-500/30 p-1.5 rounded-xl backdrop-blur-md shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 transition active:scale-90"
            title="Acercar"
            aria-label="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 transition active:scale-90"
            title="Alejar"
            aria-label="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono text-center text-cyan-400/90 py-0.5 border-t border-cyan-500/20">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>

        {/* Interactive SVG Rendering */}
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full pointer-events-auto"
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

          {/* Canvas Transform Wrapper Group */}
          <g
            transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
            style={{
              transformOrigin: `${centerPos.x}px ${centerPos.y}px`,
              transition: isDraggingMouse ? 'none' : 'transform 0.12s ease-out',
            }}
          >
            {/* Connecting lines from Central Node to Subnodes */}
            {nodePositions.map((pos) => {
              const isConnectedSelected =
                selectedNodeId === 'central' || selectedNodeId === pos.id;
              return (
                <g key={`edge-${pos.id}`}>
                  <path
                    d={`M ${centerPos.x} ${centerPos.y} Q ${(centerPos.x + pos.x) / 2} ${
                      (centerPos.y + pos.y) / 2 + (pos.y > centerPos.y ? 15 : -15)
                    } ${pos.x} ${pos.y}`}
                    fill="none"
                    stroke={isConnectedSelected ? '#00d2ff' : 'rgba(0,102,255,0.45)'}
                    strokeWidth={isConnectedSelected ? '2.5' : '1.5'}
                    strokeDasharray={isConnectedSelected ? 'none' : '4,4'}
                    filter={isConnectedSelected ? 'url(#glow)' : undefined}
                  />
                  {isConnectedSelected && (
                    <circle r="3" fill="#ffffff">
                      <animateMotion
                        path={`M ${centerPos.x} ${centerPos.y} Q ${(centerPos.x + pos.x) / 2} ${
                          (centerPos.y + pos.y) / 2 + (pos.y > centerPos.y ? 15 : -15)
                        } ${pos.x} ${pos.y}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Child Branches for nodes where AI generated details */}
            {nodePositions.map((pos) => {
              if (!pos.isExpanded) return null;
              return (
                <g key={`expanded-group-${pos.id}`}>
                  {pos.childBranches.map((child) => {
                    const isDetailActive =
                      selectedNodeId === pos.id && selectedDetailIdx === child.idx;
                    return (
                      <g key={`child-${pos.id}-${child.idx}`}>
                        <path
                          d={`M ${pos.x} ${pos.y} Q ${(pos.x + child.x) / 2} ${(pos.y + child.y) / 2} ${
                            child.x
                          } ${child.y}`}
                          fill="none"
                          stroke={isDetailActive ? '#00d2ff' : '#0066ff'}
                          strokeWidth={isDetailActive ? '2' : '1.2'}
                          strokeDasharray="2,2"
                        />
                        <g
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(pos.id);
                            setSelectedDetailIdx(child.idx);
                          }}
                        >
                          <rect
                            x={child.x - 65}
                            y={child.y - 14}
                            width="130"
                            height="28"
                            rx="8"
                            fill={isDetailActive ? '#0066ff' : '#040b18'}
                            stroke={isDetailActive ? '#00d2ff' : 'rgba(0, 210, 255, 0.4)'}
                            strokeWidth={isDetailActive ? '1.8' : '1'}
                            filter={isDetailActive ? 'url(#glow)' : undefined}
                            className="transition-colors hover:brightness-125"
                          />
                          <circle
                            cx={child.x - 52}
                            cy={child.y}
                            r="3"
                            fill={isDetailActive ? '#ffffff' : '#00d2ff'}
                          />
                          <text
                            x={child.x - 42}
                            y={child.y + 4}
                            fill={isDetailActive ? '#ffffff' : '#b3c5ff'}
                            fontSize="9.5"
                            fontWeight="500"
                          >
                            {child.text.length > 18
                              ? child.text.substring(0, 16) + '...'
                              : child.text}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Central Node */}
            <g
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId('central');
                setSelectedDetailIdx(null);
              }}
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
                className="transition-colors hover:brightness-110"
              />
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
                NODO PRINCIPAL
              </text>
              <text
                x={centerPos.x - 52}
                y={centerPos.y + 14}
                fill="#ffffff"
                fontSize="12.5"
                fontWeight="bold"
              >
                {mindmap.nodoPrincipal.length > 20
                  ? mindmap.nodoPrincipal.substring(0, 18) + '...'
                  : mindmap.nodoPrincipal}
              </text>
            </g>

            {/* Subnodes */}
            {nodePositions.map((pos) => {
              const isSelected = selectedNodeId === pos.id;
              return (
                <g
                  key={pos.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(pos.id);
                    setSelectedDetailIdx(null);
                  }}
                >
                  {/* Node Background */}
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
                    className="transition-colors hover:brightness-110"
                  />

                  {/* Accessible tooltip for PC desktop hovering */}
                  <title>{`${pos.node.titulo}${pos.node.categoria ? ` (${pos.node.categoria})` : ''}\n${pos.node.descripcion || (pos.node.detalles || []).join('\n• ')}`}</title>

                  {/* Subnode Title */}
                  <text
                    x={pos.hasBranches ? pos.x - 72 : pos.x - 70}
                    y={pos.y + 5}
                    fill={isSelected ? '#ffffff' : '#dae2fd'}
                    fontSize="11.5"
                    fontWeight="600"
                  >
                    {pos.node.titulo.length > (pos.hasBranches ? 15 : 18)
                      ? pos.node.titulo.substring(0, pos.hasBranches ? 13 : 16) + '...'
                      : pos.node.titulo}
                  </text>

                  {/* AI Branch Expansion Button (+ / −): Only displayed if AI assigned branches */}
                  {pos.hasBranches && (
                    <g
                      onClick={(e) => toggleNodeExpansion(pos.id, e)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={pos.x + 48}
                        y={pos.y - 12}
                        width="26"
                        height="24"
                        rx="8"
                        fill={pos.isExpanded ? '#00d2ff' : '#060e20'}
                        stroke="#00d2ff"
                        strokeWidth="1"
                        className="transition-colors hover:brightness-125"
                      />
                      <text
                        x={pos.x + 61}
                        y={pos.y + 4}
                        fill={pos.isExpanded ? '#070d1a' : '#00d2ff'}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pos.isExpanded ? '−' : '+'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="rounded-2xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/30 p-5 space-y-4 shadow-md text-left animate-fadeIn">
          {/* Node Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-500/40 text-blue-600 dark:text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                    {selectedNode.categoria || 'RAMA DE CONOCIMIENTO'}
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

            {selectedNodeId !== 'central' && selectedNode.detalles && selectedNode.detalles.length > 0 && (
              <button
                onClick={() => toggleNodeExpansion(selectedNodeId)}
                className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition active:scale-95 flex-shrink-0"
              >
                {expandedNodes.has(selectedNodeId) ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Ocultar desglose</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Desglosar rama</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Informative Explanation / Deep Concept Synthesis */}
          {selectedNode.descripcion && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#071226] border border-blue-200 dark:border-cyan-500/30 text-xs sm:text-sm text-slate-800 dark:text-cyan-100 leading-relaxed flex items-start gap-2.5 shadow-sm">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
                  Fundamento y Síntesis del Concepto
                </span>
                <p className="leading-relaxed">{selectedNode.descripcion}</p>
              </div>
            </div>
          )}

          {/* Concepts details list with meaningful content */}
          <div className="space-y-2 pt-1">
            {selectedNode.detalles && selectedNode.detalles.length > 0 ? (
              <>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Puntos clave y sub-ramas ({selectedNode.detalles.length}):</span>
                  {selectedDetailIdx !== null && (
                    <button
                      onClick={() => setSelectedDetailIdx(null)}
                      className="text-[10px] text-blue-500 dark:text-cyan-400 hover:underline"
                    >
                      Ver todos
                    </button>
                  )}
                </div>

                <div className="grid gap-2">
                  {selectedNode.detalles.map((det, idx) => {
                    const isSelected = selectedDetailIdx === idx;
                    const isCopied = copiedDetailIdx === idx;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDetailIdx(idx)}
                        className={`group p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-cyan-950/60 border-blue-500 dark:border-cyan-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-[#070d1a] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed text-slate-800 dark:text-slate-200 flex-1">
                          {det}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(det);
                            setCopiedDetailIdx(idx);
                            setTimeout(() => setCopiedDetailIdx(null), 2000);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-500 dark:hover:text-cyan-300 transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
                          title="Copiar información"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                Esta sección representa un concepto clave directo derivado de tus fuentes de estudio sin requerir sub-ramas adicionales.
              </div>
            )}
          </div>

          {/* Associated Quizzes Button */}
          <button
            onClick={onGoToQuiz}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm font-bold text-white shadow-sm flex items-center justify-between transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>Resolver Quizzes de este concepto</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-700/80 text-[11px] font-mono">
              {selectedNode.quizzesCount || 3} preguntas
            </span>
          </button>

          {/* Export & Share Action Buttons */}
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
