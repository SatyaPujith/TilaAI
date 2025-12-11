
import React, { useEffect, useRef, useState } from 'react';
import { Send, Mic, StopCircle, Zap, Globe, Activity, Terminal, Code2, GripVertical, MessageSquare, Plus, X, Edit3, Phone, PhoneOff } from 'lucide-react';
import { Message, MessageRole, AppMode, ExplanationStyle, ProgrammingLanguage, CallStatus, ExecutionMode } from '../types';
import { CodeEditor, TestCase } from './CodeEditor';

// Process inline markdown formatting (bold, italic, code)
const processInlineMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;
  
  while (remaining.length > 0) {
    // Check for **bold** pattern
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Check for *italic* pattern (single asterisk)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    // Check for `code` pattern
    const codeMatch = remaining.match(/`([^`]+)`/);
    
    // Find the earliest match
    let earliestMatch: { type: string; match: RegExpMatchArray; index: number } | null = null;
    
    if (boldMatch && boldMatch.index !== undefined) {
      earliestMatch = { type: 'bold', match: boldMatch, index: boldMatch.index };
    }
    if (italicMatch && italicMatch.index !== undefined) {
      if (!earliestMatch || italicMatch.index < earliestMatch.index) {
        earliestMatch = { type: 'italic', match: italicMatch, index: italicMatch.index };
      }
    }
    if (codeMatch && codeMatch.index !== undefined) {
      if (!earliestMatch || codeMatch.index < earliestMatch.index) {
        earliestMatch = { type: 'code', match: codeMatch, index: codeMatch.index };
      }
    }
    
    if (earliestMatch) {
      // Add text before the match
      if (earliestMatch.index > 0) {
        const beforeText = remaining.slice(0, earliestMatch.index);
        if (beforeText) parts.push(beforeText);
      }
      
      // Add the formatted element
      if (earliestMatch.type === 'bold') {
        parts.push(
          <strong key={keyCounter++} className="text-violet-400 font-semibold">
            {earliestMatch.match[1]}
          </strong>
        );
      } else if (earliestMatch.type === 'italic') {
        parts.push(
          <em key={keyCounter++} className="text-zinc-300 italic">
            {earliestMatch.match[1]}
          </em>
        );
      } else if (earliestMatch.type === 'code') {
        parts.push(
          <code key={keyCounter++} className="px-1.5 py-0.5 bg-zinc-800 rounded text-violet-300 text-xs font-mono">
            {earliestMatch.match[1]}
          </code>
        );
      }
      
      remaining = remaining.slice(earliestMatch.index + earliestMatch.match[0].length);
    } else {
      // No more matches, add remaining text
      if (remaining) parts.push(remaining);
      break;
    }
  }
  
  return parts.length > 0 ? parts : [text];
};

// Component to format AI messages with proper markdown rendering
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  // Split by markdown headers and format sections
  const formatText = (content: string) => {
    const lines = content.split('\n');
    const formatted: React.ReactElement[] = [];
    let currentSection: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    lines.forEach((line, idx) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          formatted.push(
            <pre key={`code-${idx}`} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 my-2 overflow-x-auto">
              <code className="text-xs text-violet-300 font-mono">{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle headers
      if (line.startsWith('## ')) {
        if (currentSection.length > 0) {
          formatted.push(
            <div key={`section-${idx}`} className="mb-3">
              {currentSection.map((sectionLine, sIdx) => (
                <div key={sIdx}>{processInlineMarkdown(sectionLine)}</div>
              ))}
            </div>
          );
          currentSection = [];
        }
        formatted.push(
          <h3 key={`header-${idx}`} className="text-base font-bold text-white mt-4 mb-2 border-b border-zinc-800 pb-1">
            {processInlineMarkdown(line.substring(3))}
          </h3>
        );
      } else if (line.startsWith('### ')) {
        formatted.push(
          <h4 key={`subheader-${idx}`} className="text-sm font-semibold text-violet-400 mt-3 mb-1">
            {processInlineMarkdown(line.substring(4))}
          </h4>
        );
      } else if (line.trim().startsWith('- ')) {
        // Bullet points
        formatted.push(
          <div key={`bullet-${idx}`} className="flex gap-2 my-1 ml-2">
            <span className="text-violet-500 mt-1">•</span>
            <span className="flex-1">{processInlineMarkdown(line.trim().substring(2))}</span>
          </div>
        );
      } else if (line.match(/^\d+\.\s/)) {
        // Numbered lists
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          formatted.push(
            <div key={`number-${idx}`} className="flex gap-2 my-1 ml-2">
              <span className="text-violet-500 font-bold">{match[1]}.</span>
              <span className="flex-1">{processInlineMarkdown(match[2])}</span>
            </div>
          );
        }
      } else if (line.trim() === '') {
        // Empty line - add spacing
        if (currentSection.length > 0) {
          formatted.push(
            <div key={`section-${idx}`} className="mb-2">
              {currentSection.map((sectionLine, sIdx) => (
                <div key={sIdx}>{processInlineMarkdown(sectionLine)}</div>
              ))}
            </div>
          );
          currentSection = [];
        }
      } else {
        // Regular text
        currentSection.push(line);
      }
    });

    // Add remaining section
    if (currentSection.length > 0) {
      formatted.push(
        <div key="final-section" className="mb-2">
          {currentSection.map((sectionLine, sIdx) => (
            <div key={sIdx}>{processInlineMarkdown(sectionLine)}</div>
          ))}
        </div>
      );
    }

    return formatted;
  };

  return <div className="space-y-1">{formatText(text)}</div>;
};

interface ChatAreaProps {
  messages: Message[];
  isListening: boolean;
  toggleListening: () => void;
  input: string;
  setInput: (s: string) => void;
  sendMessage: (text?: string) => void;
  isLoading: boolean;
  mode: AppMode;
  setMode: (m: AppMode) => void;
  explanationStyle: ExplanationStyle;
  setExplanationStyle: (s: ExplanationStyle) => void;
  
  // Editor Props
  code: string;
  setCode: (c: string) => void;
  language: ProgrammingLanguage;
  setLanguage: (l: ProgrammingLanguage) => void;
  runCode: (testCases?: TestCase[]) => void;
  editorOutput: string;
  isRunningCode: boolean;
  
  // Call Props
  callStatus: CallStatus;
  toggleCall: () => void;

  // Execution Mode Props
  executionMode: ExecutionMode;
  setExecutionMode: (m: ExecutionMode) => void;
  
  // New Props
  onLanguageChange?: (lang: ProgrammingLanguage) => void;
  onSaveSnippet?: () => void;
  onChallengeComplete?: () => void;
  chatSessions?: any[];
  activeChatId?: string | null;
  onNewChat?: () => void;
  onSwitchChat?: (id: string) => void;
  showChatHistory?: boolean;
  onToggleChatHistory?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onRenameChat?: (chatId: string, newTitle: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isListening,
  toggleListening,
  input,
  setInput,
  sendMessage,
  isLoading,
  mode,
  setMode,
  explanationStyle,
  setExplanationStyle,
  code, setCode, language, setLanguage, runCode, editorOutput, isRunningCode,
  callStatus, toggleCall, executionMode, setExecutionMode,
  onLanguageChange, onSaveSnippet, onChallengeComplete,
  chatSessions = [], activeChatId, onNewChat, onSwitchChat, showChatHistory = false, onToggleChatHistory,
  onDeleteMessage, onDeleteChat, onRenameChat
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatWidth, setChatWidth] = useState(40); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Resizing Logic
  const startResizing = (e: React.MouseEvent) => {
      setIsResizing(true);
      e.preventDefault();
  };

  useEffect(() => {
    const stopResizing = () => setIsResizing(false);
    const resize = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = (e.clientX / window.innerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) {
                setChatWidth(newWidth);
            }
        }
    };

    if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const styles = [
    { id: ExplanationStyle.DEFAULT, label: 'Tech Lead' },
    { id: ExplanationStyle.CODE_WALKTHROUGH, label: 'Walkthrough' },
    { id: ExplanationStyle.DEBUG, label: 'Debugger' },
    { id: ExplanationStyle.OPTIMIZATION, label: 'Optimization' },
    { id: ExplanationStyle.SOCRATIC, label: 'Socratic' },
  ];



  const handleStartRename = (chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId);
    setRenameValue(currentTitle);
  };

  const handleSaveRename = (chatId: string) => {
    if (renameValue.trim() && onRenameChat) {
      onRenameChat(chatId, renameValue.trim());
    }
    setRenamingChatId(null);
    setRenameValue('');
  };

  return (
    <div className="flex-1 flex h-full font-sans overflow-hidden">
      {/* LEFT PANE: CHAT */}
      <div 
        className="flex flex-col border-r border-white/5 relative z-10 bg-black"
        style={{ width: `${chatWidth}%` }}
      >
        {/* Chat History Dropdown - Rendered outside blur container */}
        {showChatHistory && (
          <>
            {/* Backdrop to block content behind */}
            <div 
              className="fixed inset-0"
              style={{ zIndex: 9998, backgroundColor: 'transparent' }}
              onClick={onToggleChatHistory}
            />
            <div 
              className="fixed w-72 rounded-xl overflow-hidden animate-fadeIn"
              ref={chatHistoryRef}
              style={{ 
                zIndex: 9999,
                top: '56px',
                left: '70px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #3f3f46',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(0,0,0,1)'
              }}
            >
              {/* Dropdown Header */}
              <div className="p-3 border-b border-zinc-700" style={{ backgroundColor: '#171717' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wide">Chat History</h4>
                  <span className="text-[10px] text-zinc-500">{chatSessions.length} chats</span>
                </div>
                <button 
                  onClick={() => { onNewChat?.(); onToggleChatHistory?.(); }}
                  className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>
              </div>
              
              {/* Chat List */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar" style={{ backgroundColor: '#0a0a0a' }}>
                {chatSessions.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500 text-xs">
                    No chat history yet
                  </div>
                ) : (
                  chatSessions.map(chat => (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 transition-colors cursor-pointer ${
                        activeChatId === chat.id ? 'border-l-2 border-l-violet-500' : ''
                      }`}
                      style={{ backgroundColor: activeChatId === chat.id ? '#1e1b4b' : '#0a0a0a' }}
                      onMouseEnter={(e) => { if (activeChatId !== chat.id) e.currentTarget.style.backgroundColor = '#171717'; }}
                      onMouseLeave={(e) => { if (activeChatId !== chat.id) e.currentTarget.style.backgroundColor = '#0a0a0a'; }}
                    >
                      {renamingChatId === chat.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(chat.id)}
                            className="flex-1 bg-zinc-800 border border-violet-500 rounded px-2 py-1 text-white text-xs focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleSaveRename(chat.id)} className="p-1 text-green-500 hover:text-green-400">✓</button>
                          <button onClick={() => setRenamingChatId(null)} className="p-1 text-zinc-500 hover:text-white">✕</button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { onSwitchChat?.(chat.id); onToggleChatHistory?.(); }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className={`text-sm font-medium truncate ${activeChatId === chat.id ? 'text-violet-400' : 'text-zinc-300'}`}>
                              {chat.title}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {new Date(chat.updatedAt).toLocaleDateString()} • {chat.messages?.length || 0} msgs
                            </div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onRenameChat && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStartRename(chat.id, chat.title); }}
                                className="p-1 text-zinc-500 hover:text-violet-400 transition-colors"
                                title="Rename chat"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteChat && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                title="Delete chat"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Top Bar */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-black/50 backdrop-blur-sm relative">
            <div className="flex items-center gap-2">
                 {/* Chat History Toggle Button */}
                 <div className="relative">
                   {onToggleChatHistory && (
                     <button 
                        onClick={onToggleChatHistory}
                        className={`p-2 rounded-lg transition-all ${
                          showChatHistory 
                            ? 'bg-violet-600/20 text-violet-400 border border-violet-500/50' 
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border border-transparent'
                        }`}
                        title="Chat History"
                     >
                        <MessageSquare className="w-4 h-4" />
                     </button>
                   )}
                 </div>
                 
                 {/* Voice Mentor Button */}
                 <button 
                    onClick={toggleCall}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wide ${
                      callStatus === 'active' 
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30' 
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-600/40'
                    }`}
                 >
                    {callStatus === 'active' ? (
                      <>
                        <PhoneOff className="w-3 h-3" />
                        End Call
                      </>
                    ) : (
                      <>
                        <Phone className="w-3 h-3" />
                        Voice Mentor
                      </>
                    )}
                 </button>

                 {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button 
                        onClick={() => setMode(AppMode.SYLLABUS)}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition-all flex items-center gap-1.5 ${mode === AppMode.SYLLABUS ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Zap className="w-3 h-3" />
                        Syllabus
                    </button>
                    <button 
                        onClick={() => setMode(AppMode.GENERAL)}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition-all flex items-center gap-1.5 ${mode === AppMode.GENERAL ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Globe className="w-3 h-3" />
                        Global
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-1">
                {/* Style Selector - Compact */}
                {styles.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setExplanationStyle(s.id)}
                        className={`px-1.5 py-1 rounded text-[9px] font-bold transition-all ${
                            explanationStyle === s.id 
                            ? 'bg-violet-600/20 text-violet-300' 
                            : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                        title={s.label}
                    >
                        {s.label.substring(0, 3)}
                    </button>
                ))}
            </div>
        </div>



        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth">
            {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800 shadow-2xl shadow-black relative group">
                    <Terminal className="w-6 h-6 text-violet-500 relative z-10" />
                    <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Dev Tutor Ready.</h2>
                <p className="text-zinc-500 max-w-xs mx-auto mb-6 text-xs leading-relaxed">
                    Ask for code reviews, generate algorithms, or debug your snippets.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                    <button onClick={() => sendMessage("Generate a binary search implementation in Python")} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 hover:text-white hover:border-violet-500/50 text-left transition-all">
                        <Code2 className="w-3 h-3 mb-1 text-violet-500" />
                        Gen Algo
                    </button>
                     <button onClick={() => sendMessage("What is the time complexity of the code in the editor?")} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[11px] font-bold text-zinc-400 hover:text-white hover:border-violet-500/50 text-left transition-all">
                        <Activity className="w-3 h-3 mb-1 text-violet-500" />
                        Complexity Analysis
                    </button>
                </div>
            </div>
            ) : (
            <div className="space-y-6">
                {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`group flex gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center border ${msg.role === MessageRole.USER ? 'bg-zinc-900 border-zinc-800' : 'bg-violet-600 border-violet-500'}`}>
                        {msg.role === MessageRole.USER ? <div className="w-2 h-2 bg-zinc-500 rounded-full" /> : <Terminal className="w-3 h-3 text-white" />}
                    </div>

                    <div className={`flex flex-col max-w-[85%] ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'}`}>
                        <div className={`relative text-sm leading-relaxed px-3 py-2 rounded-xl ${
                            msg.role === MessageRole.USER 
                            ? 'bg-zinc-900 text-zinc-200 border border-zinc-800' 
                            : 'text-zinc-300'
                        }`}>
                            {/* Delete button */}
                            {onDeleteMessage && (
                                <button
                                    onClick={() => onDeleteMessage(msg.id)}
                                    className={`absolute -top-2 ${msg.role === MessageRole.USER ? '-left-2' : '-right-2'} opacity-0 group-hover:opacity-100 w-5 h-5 bg-zinc-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all text-zinc-500 hover:text-white`}
                                    title="Delete message"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            )}
                            
                            {msg.isAudioPlaying && (
                                <div className="inline-flex items-center gap-1.5 mb-1 px-1.5 py-0.5 bg-violet-500/10 rounded border border-violet-500/20 w-fit">
                                    <Activity className="w-3 h-3 text-violet-400 animate-pulse" />
                                    <span className="text-[9px] font-bold text-violet-300 uppercase">Speaking</span>
                                </div>
                            )}
                            {msg.role === MessageRole.MODEL ? (
                                <FormattedMessage text={msg.text || msg.content || ''} />
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text || msg.content || ''}</p>
                            )}
                        </div>
                    </div>
                </div>
                ))}
                {isLoading && (
                   <div className="flex gap-3">
                       <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center animate-pulse">
                            <Terminal className="w-3 h-3 text-white" />
                       </div>
                       <span className="text-xs text-zinc-500 pt-1">Analyzing Logic...</span>
                   </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black border-t border-white/5">
            <div className="relative flex items-center gap-2">
                <button
                    onClick={toggleListening}
                    className={`h-10 w-10 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
                        isListening 
                        ? 'bg-red-500/10 text-red-500 border-red-500 animate-pulse' 
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                    title={isListening ? 'Stop listening (click or speak)' : 'Start speech-to-text (converts speech to text and sends to tutor)'}
                >
                    {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <div className="flex-1 relative bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-violet-500/50 transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask the Tutor..."
                        className="w-full bg-transparent text-white placeholder-zinc-500 px-3 py-2.5 max-h-24 min-h-[40px] focus:outline-none text-sm resize-none custom-scrollbar rounded-xl"
                        disabled={isLoading}
                        rows={1}
                    />
                    <div className="absolute right-1.5 bottom-1 h-8 flex items-center">
                        <button 
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="h-7 w-7 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:bg-zinc-800 transition-all"
                        >
                            <Send className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* DRAG HANDLE */}
      <div 
        onMouseDown={startResizing}
        className="w-1 bg-black hover:bg-violet-600 cursor-col-resize z-50 flex flex-col justify-center items-center transition-colors border-l border-white/5 border-r border-white/5"
      >
        <GripVertical className="w-3 h-3 text-zinc-700" />
      </div>

      {/* RIGHT PANE: CODE EDITOR */}
      <div 
        className="flex flex-col h-full overflow-hidden"
        style={{ width: `${100 - chatWidth}%` }}
      >
          <CodeEditor 
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onRun={runCode}
            output={editorOutput}
            isRunning={isRunningCode}
            executionMode={executionMode}
            setExecutionMode={setExecutionMode}
            onLanguageChange={onLanguageChange}
            onSaveSnippet={onSaveSnippet}
            onChallengeComplete={onChallengeComplete}
          />
      </div>
    </div>
  );
};
