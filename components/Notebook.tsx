import React, { useState } from 'react';
import { CodeSnippet, ProgrammingLanguage } from '../types';
import { Search, Trash, Code, Copy, X, Plus, Check, Eye, Play, MessageSquare, Trophy, ExternalLink } from 'lucide-react';

interface SnippetsProps {
  snippets: CodeSnippet[];
  onDelete: (id: string) => void;
  onAddToEditor?: (snippet: CodeSnippet) => void;
  onAskTutor?: (snippet: CodeSnippet) => void;
  onGenerateChallenges?: (snippet: CodeSnippet) => void;
}

// Snippet Detail Modal
const SnippetModal: React.FC<{
  snippet: CodeSnippet;
  onClose: () => void;
  onAddToEditor?: (snippet: CodeSnippet) => void;
  onAskTutor?: (snippet: CodeSnippet) => void;
  onGenerateChallenges?: (snippet: CodeSnippet) => void;
  onDelete: (id: string) => void;
}> = ({ snippet, onClose, onAddToEditor, onAskTutor, onGenerateChallenges, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToEditor = () => {
    if (onAddToEditor) {
      onAddToEditor(snippet);
      onClose();
    }
  };

  const handleAskTutor = () => {
    if (onAskTutor) {
      onAskTutor(snippet);
      onClose();
    }
  };

  const handleGenerateChallenges = () => {
    if (onGenerateChallenges) {
      onGenerateChallenges(snippet);
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete(snippet.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Code className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{snippet.title || 'Untitled Snippet'}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs text-zinc-400 uppercase font-bold">{snippet.language}</span>
                <span className="text-xs text-zinc-500">{new Date(snippet.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 font-mono">{snippet.language}</span>
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-sm font-mono text-zinc-300 overflow-x-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">{snippet.code}</pre>
          </div>

          {/* Explanation */}
          {snippet.explanation && (
            <div className="mt-4 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Explanation</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">{snippet.explanation}</p>
            </div>
          )}

          {/* Tags */}
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {snippet.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-[11px] font-bold uppercase tracking-wide">
              <Trash className="w-3.5 h-3.5" /> Delete
            </button>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-[11px] font-bold uppercase tracking-wide">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              {onAskTutor && (
                <button onClick={handleAskTutor} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-[11px] font-bold border border-blue-500/30 uppercase tracking-wide">
                  <MessageSquare className="w-3.5 h-3.5" /> Ask Tutor
                </button>
              )}
              {onGenerateChallenges && (
                <button onClick={handleGenerateChallenges} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg transition-colors text-[11px] font-bold border border-amber-500/30 uppercase tracking-wide">
                  <Trophy className="w-3.5 h-3.5" /> Challenges
                </button>
              )}
              {onAddToEditor && (
                <button onClick={handleAddToEditor} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors text-[11px] font-bold shadow-lg shadow-violet-900/20 hover:shadow-violet-600/30 uppercase tracking-wide">
                  <Play className="w-3.5 h-3.5" /> Send to Editor
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SnippetsLibrary: React.FC<SnippetsProps> = ({ snippets, onDelete, onAddToEditor, onAskTutor, onGenerateChallenges }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title?.toLowerCase().includes(searchQuery.toLowerCase()) || snippet.code?.toLowerCase().includes(searchQuery.toLowerCase()) || snippet.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage = filterLanguage === 'all' || snippet.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  const languages = [...new Set(snippets.map(s => s.language))];

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 md:p-12 custom-scrollbar font-sans z-10 relative bg-black">
      {/* Snippet Detail Modal */}
      {selectedSnippet && (
        <SnippetModal 
          snippet={selectedSnippet} 
          onClose={() => setSelectedSnippet(null)}
          onAddToEditor={onAddToEditor}
          onAskTutor={onAskTutor}
          onGenerateChallenges={onGenerateChallenges}
          onDelete={onDelete}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-white/5 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Code Snippets</h1>
            <p className="text-zinc-500 text-sm">Your library of algorithms, solutions, and saved logic. Click any snippet to view details.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500 cursor-pointer">
              <option value="all">All Languages</option>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 w-64">
              <Search className="w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Search snippets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none text-white placeholder-zinc-600 focus:outline-none text-sm w-full" />
            </div>
          </div>
        </div>

        {/* Empty State */}
        {snippets.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Code className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Snippets Yet</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">Save code snippets from the editor by clicking the Save icon or completing challenges.</p>
          </div>
        )}

        {/* No Results */}
        {snippets.length > 0 && filteredSnippets.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
            <p className="text-zinc-500 text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Snippets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnippets.map(snippet => (
            <div 
              key={snippet.id} 
              onClick={() => setSelectedSnippet(snippet)}
              className="group bg-zinc-900/30 border border-zinc-800 hover:border-violet-500/50 rounded-2xl p-6 transition-all hover:bg-zinc-900/50 flex flex-col cursor-pointer hover:shadow-lg hover:shadow-violet-900/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-black border border-zinc-800 flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                    <Code className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{snippet.language}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <span className="text-[10px] text-violet-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View
                  </span>
                </div>
              </div>
              
              <h3 className="text-white font-bold mb-2 truncate group-hover:text-violet-400 transition-colors">{snippet.title || "Untitled Snippet"}</h3>
              
              <div className="bg-black rounded-lg p-3 mb-4 border border-zinc-800 overflow-hidden h-24 relative group-hover:border-zinc-700 transition-colors">
                <pre className="text-[10px] font-mono text-zinc-400">{snippet.code}</pre>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>

              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{snippet.explanation}</p>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-2 flex-wrap">
                  {snippet.tags?.slice(0, 2).map(t => <span key={t} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">{t}</span>)}
                  {snippet.tags && snippet.tags.length > 2 && <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">+{snippet.tags.length - 2}</span>}
                </div>
                <span className="text-[10px] text-zinc-600">{new Date(snippet.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        {snippets.length > 0 && (
          <div className="mt-12 pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-600">
            <span>{snippets.length} total snippets</span>
            <span>{filteredSnippets.length} showing</span>
          </div>
        )}
      </div>
    </div>
  );
};
