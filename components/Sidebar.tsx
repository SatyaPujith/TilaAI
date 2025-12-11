import React, { useRef, useState } from 'react';
import { Terminal, Upload, File, Trash2, Code2, Map, Trophy, Users, BookOpen, Sparkles, LayoutGrid, LogOut, Download, PanelLeftClose, PanelLeft } from 'lucide-react';
import { StudyFile, ViewState, User } from '../types';

interface SidebarProps {
  files: StudyFile[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  user: User | null;
  onLogout: () => void;
  onGenerateSyllabus: () => void;
  onShowProfile: () => void;
  onBackToDashboard: () => void;
  onDownloadProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, onUpload, onRemoveFile, viewState, setViewState, user, onLogout, onGenerateSyllabus, onShowProfile, onBackToDashboard, onDownloadProject
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const navItemClass = (active: boolean) => 
    `flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all cursor-pointer rounded-lg mb-0.5 ${
      active 
        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
    }`;

  const collapsedNavClass = (active: boolean) =>
    `w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
      active 
        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
        : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
    }`;

  return (
    <div className={`h-full bg-black border-r border-zinc-800/50 flex flex-col flex-shrink-0 transition-all duration-200 ${isCollapsed ? 'w-12' : 'w-52'}`}>
      {/* Header */}
      <div className={`h-12 flex items-center border-b border-zinc-800/50 ${isCollapsed ? 'justify-center px-1' : 'justify-between px-3'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">TILA AI</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className={`py-3 ${isCollapsed ? 'px-1.5' : 'px-2'}`}>
        {isCollapsed ? (
          // Collapsed - Icons only
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setViewState(ViewState.IDE)} className={collapsedNavClass(viewState === ViewState.IDE)} title="IDE & Tutor">
              <Code2 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewState(ViewState.CHALLENGES)} className={collapsedNavClass(viewState === ViewState.CHALLENGES)} title="Challenges">
              <Trophy className="w-4 h-4" />
            </button>
            <button onClick={() => setViewState(ViewState.ROADMAP)} className={collapsedNavClass(viewState === ViewState.ROADMAP)} title="Roadmap">
              <Map className="w-4 h-4" />
            </button>
            <button onClick={() => setViewState(ViewState.SNIPPETS)} className={collapsedNavClass(viewState === ViewState.SNIPPETS)} title="Snippets">
              <BookOpen className="w-4 h-4" />
            </button>
            <button onClick={() => setViewState(ViewState.COMMUNITY)} className={collapsedNavClass(viewState === ViewState.COMMUNITY)} title="Community">
              <Users className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Expanded - Full labels
          <>
            <p className="px-2 text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Workspace</p>
            <div onClick={() => setViewState(ViewState.IDE)} className={navItemClass(viewState === ViewState.IDE)}>
              <Code2 className="w-3.5 h-3.5" />
              <span>IDE & Tutor</span>
            </div>
            <div onClick={() => setViewState(ViewState.CHALLENGES)} className={navItemClass(viewState === ViewState.CHALLENGES)}>
              <Trophy className="w-3.5 h-3.5" />
              <span>Challenges</span>
            </div>
            <div onClick={() => setViewState(ViewState.ROADMAP)} className={navItemClass(viewState === ViewState.ROADMAP)}>
              <Map className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </div>

            <p className="px-2 text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 mt-3">Library</p>
            <div onClick={() => setViewState(ViewState.SNIPPETS)} className={navItemClass(viewState === ViewState.SNIPPETS)}>
              <BookOpen className="w-3.5 h-3.5" />
              <span>Snippets</span>
            </div>
            <div onClick={() => setViewState(ViewState.COMMUNITY)} className={navItemClass(viewState === ViewState.COMMUNITY)}>
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
            </div>
          </>
        )}
      </div>

      {/* Syllabus Section - Only when expanded */}
      {!isCollapsed && (
        <div className="flex-1 px-2 py-2 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1.5 px-2">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Syllabus</p>
            <div className="flex gap-1">
              <button onClick={onGenerateSyllabus} title="Generate with AI" className="text-violet-400 hover:text-white transition-colors flex items-center justify-center w-5 h-5 rounded bg-violet-900/20 hover:bg-violet-900/40">
                <Sparkles className="w-2.5 h-2.5" />
              </button>
              <button onClick={triggerUpload} title="Upload File" className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center w-5 h-5 rounded bg-zinc-900 hover:bg-zinc-800">
                <Upload className="w-2.5 h-2.5" />
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={onUpload} className="hidden" accept=".txt,.pdf,.md,.png,.jpg,.py,.js,.ts,.cpp" multiple />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar">
            {files.length === 0 ? (
              <p className="text-[10px] text-zinc-600 text-center py-2">No files</p>
            ) : (
              files.map(file => (
                <div key={file.id} className="group flex items-center justify-between px-2 py-1.5 hover:bg-zinc-900/50 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <File className={`w-3 h-3 flex-shrink-0 ${file.isVirtual ? 'text-violet-500' : 'text-zinc-500'}`} />
                    <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">{file.name}</span>
                  </div>
                  <button onClick={() => onRemoveFile(file.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <button onClick={onDownloadProject} className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white text-[10px] font-medium transition-colors">
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      )}

      {/* Spacer for collapsed */}
      {isCollapsed && <div className="flex-1" />}

      {/* Footer */}
      <div className={`border-t border-zinc-800/50 ${isCollapsed ? 'p-1.5' : 'p-2'}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button onClick={onBackToDashboard} className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900" title="Dashboard">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={onShowProfile} className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white" title="Profile">
              <span className="font-mono font-bold text-[9px]">{user?.name?.charAt(0) || 'U'}</span>
            </button>
          </div>
        ) : (
          <>
            <button onClick={onBackToDashboard} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 text-xs mb-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <div onClick={onShowProfile} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900 cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white text-[10px] font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-white truncate max-w-[80px]">{user?.name}</span>
                  <span className="text-[9px] text-zinc-600">{user?.rank}</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-zinc-600 hover:text-white">
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
