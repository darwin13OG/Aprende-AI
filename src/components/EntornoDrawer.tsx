import React, { useState } from 'react';
import { Entorno } from '../types.ts';
import {
  FolderPlus,
  Folder,
  Check,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Key,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Save,
} from 'lucide-react';

interface EntornoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entornos: Entorno[];
  activeEntornoId: string;
  onSelectEntorno: (id: string) => void;
  onCreateEntorno: () => void;
  onRenameEntorno: (id: string, newName: string) => void;
  onDeleteEntorno: (id: string) => void;
  userApiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

export const EntornoDrawer: React.FC<EntornoDrawerProps> = ({
  isOpen,
  onClose,
  entornos,
  activeEntornoId,
  onSelectEntorno,
  onCreateEntorno,
  onRenameEntorno,
  onDeleteEntorno,
  userApiKey = '',
  onSaveApiKey,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [tempApiKey, setTempApiKey] = useState(userApiKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleStartEdit = (entorno: Entorno, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(entorno.id);
    setEditName(entorno.nombre);
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editName.trim()) {
      onRenameEntorno(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (entornos.length <= 1) {
      alert('Debes mantener al menos un entorno.');
      return;
    }
    onDeleteEntorno(id);
  };

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey?.(tempApiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop with smooth opacity fade */}
      <div
        className={`fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Slide-out Drawer with smooth transform */}
      <div
        className={`relative z-10 w-full max-w-xs sm:max-w-sm h-full bg-white dark:bg-[#070d1a] border-r border-slate-200 dark:border-cyan-500/20 p-4 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-cyan-950/70 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Gestor de Entornos</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Espacios de estudio independientes</p>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition active:scale-95"
              aria-label="Cerrar panel"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action: + Nuevo Entorno */}
        <div className="py-3">
          <button
            onClick={() => {
              onCreateEntorno();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-[0.98]"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Nuevo Entorno</span>
          </button>
        </div>

        {/* Entornos List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
            Tus Entornos ({entornos.length})
          </div>

          {entornos.map((entorno) => {
            const isActive = entorno.id === activeEntornoId;
            const isEditing = editingId === entorno.id;

            return (
              <div
                key={entorno.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectEntorno(entorno.id);
                    onClose();
                  }
                }}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-cyan-950/50 border-blue-400 dark:border-cyan-400/60 shadow-sm dark:shadow-[0_0_12px_rgba(0,210,255,0.15)] text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-[#0b1528] border-slate-200 dark:border-cyan-500/15 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-cyan-500/35 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveEdit(entorno.id, e)}
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 rounded bg-white dark:bg-[#070d1a] border border-blue-400 dark:border-cyan-400 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded bg-blue-600 dark:bg-cyan-600 text-white hover:bg-blue-500"
                      title="Guardar nombre"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate flex-1">
                      <Folder
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">{entorno.nombre}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 animate-pulse flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>
                            {entorno.hasGenerated
                              ? '✓ Generado con IA'
                              : `${entorno.fuentes.length} fuentes`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (Rename, Delete) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                      <button
                        onClick={(e) => handleStartEdit(entorno, e)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-200 dark:hover:bg-cyan-950 transition"
                        title="Cambiar nombre del entorno"
                        aria-label="Cambiar nombre"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {entornos.length > 1 && (
                        <button
                          onClick={(e) => handleDelete(entorno.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 transition"
                          title="Eliminar entorno"
                          aria-label="Eliminar entorno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* API Key Configuration Section (For model saturation fallback) */}
        <div className="pt-3 border-t border-slate-200 dark:border-cyan-500/20">
          <button
            onClick={() => setShowKeyInput((prev) => !prev)}
            className="w-full flex items-center justify-between text-left p-2 rounded-xl bg-slate-100 dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 transition"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Clave API Gemini {userApiKey ? '✓ Configurada' : '(Opcional)'}</span>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${showKeyInput ? 'rotate-90' : ''}`}
            />
          </button>

          {showKeyInput && (
            <form onSubmit={handleSaveCustomKey} className="mt-2 space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#060b14] border border-slate-200 dark:border-slate-800 text-xs animate-fadeIn">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                El sistema rota automáticamente entre modelos Gemini Flash. Si todos se saturan por alta demanda, se utilizará tu clave personal sin límites:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0d172a] border border-slate-300 dark:border-cyan-500/30 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Guardar
                </button>
              </div>
              {savedSuccess && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Clave guardada correctamente
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
          Aprende AI • Multi-Entornos & Fallback Inteligente
        </div>
      </div>
    </div>
  );
};
