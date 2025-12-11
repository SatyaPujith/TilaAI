import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SnippetsLibrary } from './components/Notebook';
import { AppMode, CodeSnippet, Message, MessageRole, StudyFile, ViewState, AuthStage, User, ExplanationStyle, CodingChallenge, GraphData, ProgrammingLanguage, Project, CallStatus, CommunityPost, ExecutionMode } from './types';
import { generateDevResponse, generateCodingChallenges, generateRoadmapData, runCodeSimulation, generateSyllabusContent, convertCodeLanguage } from './services/geminiService';
import { decodeAudioData, playAudioBuffer } from './services/audioUtils';
import { apiService } from './services/apiService';
import { textToSpeech, playAudioBlob, startSpeechRecognition, getAgentId } from './services/elevenLabsService';
import { Terminal, Plus, ArrowRight, X, File as FileIcon, Map, Code2, Heart, GitFork, Tag, ArrowLeft, Mail, Lock, User as UserIcon, Users, MessageSquare, Code, Trophy, Play, Send, FileText, Check, Sparkles } from 'lucide-react';
import { LandingPage } from './components/LandingPage';



// --- SHARED COMPONENTS ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
    const baseClass = "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide";
    const variants = {
        primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20 hover:shadow-violet-600/30",
        secondary: "bg-white text-black hover:bg-zinc-200",
        outline: "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800",
        ghost: "bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-900"
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant as keyof typeof variants]} ${className}`}>{children}</button>;
};

const Input = ({ type = "text", placeholder, value, onChange, className = "" }: any) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`h-11 w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-zinc-600 transition-all ${className}`} />
);

// --- NOTIFICATION & MODAL SYSTEM ---

interface NotificationProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    const config = {
        success: {
            bg: 'bg-zinc-950',
            border: 'border-green-500/50',
            iconBg: 'bg-green-500/20',
            iconColor: 'text-green-400',
            glow: 'shadow-green-500/20',
            icon: <Check className="w-4 h-4" />
        },
        error: {
            bg: 'bg-zinc-950',
            border: 'border-red-500/50',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            glow: 'shadow-red-500/20',
            icon: <X className="w-4 h-4" />
        },
        info: {
            bg: 'bg-zinc-950',
            border: 'border-violet-500/50',
            iconBg: 'bg-violet-500/20',
            iconColor: 'text-violet-400',
            glow: 'shadow-violet-500/20',
            icon: <Sparkles className="w-4 h-4" />
        },
        warning: {
            bg: 'bg-zinc-950',
            border: 'border-amber-500/50',
            iconBg: 'bg-amber-500/20',
            iconColor: 'text-amber-400',
            glow: 'shadow-amber-500/20',
            icon: <Terminal className="w-4 h-4" />
        }
    };
    
    const c = config[type];
    
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    return (
        <div className={`fixed top-4 right-4 z-[300] ${c.bg} ${c.border} border rounded-2xl shadow-2xl ${c.glow} backdrop-blur-md max-w-sm overflow-hidden`}
             style={{ animation: 'slideInRight 0.3s ease-out' }}>
            {/* Progress bar */}
            <div className={`h-0.5 ${c.iconBg}`}>
                <div className={`h-full ${c.iconColor.replace('text-', 'bg-')}`} 
                     style={{ animation: 'shrink 4s linear forwards', width: '100%' }} />
            </div>
            
            <div className="p-4 flex items-center gap-3">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0`}>
                    {c.icon}
                </div>
                
                {/* Message */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug">{message}</p>
                </div>
                
                {/* Close button */}
                <button 
                    onClick={onClose} 
                    className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
    return (
        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" onClick={onCancel}>
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 transform transition-all" onClick={(e) => e.stopPropagation()}>
                {/* Header with icon */}
                <div className={`p-6 pb-4 border-b border-zinc-800 ${isDanger ? 'bg-red-950/20' : 'bg-violet-950/20'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDanger ? 'bg-red-500/20' : 'bg-violet-500/20'}`}>
                            {isDanger ? (
                                <X className={`w-6 h-6 ${isDanger ? 'text-red-400' : 'text-violet-400'}`} />
                            ) : (
                                <Sparkles className="w-6 h-6 text-violet-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">This action requires confirmation</p>
                        </div>
                    </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    <p className="text-zinc-300 text-sm leading-relaxed mb-6">{message}</p>
                    
                    {/* Actions */}
                    <div className="flex gap-3">
                        <button 
                            onClick={onCancel} 
                            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-sm font-medium"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all ${
                                isDanger 
                                    ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30' 
                                    : 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-900/30'
                            }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface InputModalProps {
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({ title, message, placeholder, defaultValue = '', onSubmit, onCancel }) => {
    const [value, setValue] = useState(defaultValue);
    
    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value);
        }
    };
    
    return (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-zinc-400 mb-4">{message}</p>
                    <Input 
                        value={value} 
                        onChange={(e: any) => setValue(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={(e: any) => e.key === 'Enter' && handleSubmit()}
                        className="mb-4"
                    />
                    <div className="flex gap-3">
                        <Button onClick={onCancel} variant="outline" className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} variant="primary" className="flex-1" disabled={!value.trim()}>
                            Submit
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Voice Mentor Modal with ElevenLabs Embedded Widget
interface VoiceTranscript {
    role: 'user' | 'agent';
    text: string;
    timestamp: Date;
}

// --- MODALS ---

const UserProfileModal = ({ user, onClose, isGuestMode }: { user: User, onClose: () => void, isGuestMode?: boolean }) => {
    const impactScore = (user.problemsSolvedEasy * 10) + (user.problemsSolvedMedium * 30) + (user.problemsSolvedHard * 60);
    const maxScore = 5000; // Arbitrary max for progress bar
    const progress = Math.min((impactScore / maxScore) * 100, 100);

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-black border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10 p-2 text-2xl leading-none">×</button>
                
                <div className="p-8 relative z-10">
                    {isGuestMode ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👤</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Guest User</h3>
                            <p className="text-zinc-400 mb-6">Sign up to save your progress and unlock all features!</p>
                            <Button onClick={onClose} className="mx-auto">Close</Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-6 mb-8">
                                 <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-2xl shadow-violet-900/20">
                                     <span className="text-3xl font-bold font-mono text-white">{user.rank.substring(0, 2).toUpperCase()}</span>
                                 </div>
                                 <div>
                                     <h2 className="text-3xl font-bold text-white mb-1">{user.name}</h2>
                                     <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <span>{user.email}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                        <span className="text-violet-400">{user.rank}</span>
                                     </div>
                                 </div>
                            </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Impact Score</p>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-bold text-white">{impactScore}</span>
                                <span className="text-xs text-zinc-500 mb-1">/ {maxScore}</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-600 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                         <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Current Streak</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-white">{user.streak}</span>
                                <span className="text-sm text-zinc-500 mb-1">days</span>
                            </div>
                        </div>
                    </div>

                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Problem Severity Stats</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                                    <span className="text-green-500 font-bold block text-xl mb-1">{user.problemsSolvedEasy}</span>
                                    <span className="text-xs text-zinc-500 uppercase">Easy</span>
                                </div>
                                 <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                                    <span className="text-yellow-500 font-bold block text-xl mb-1">{user.problemsSolvedMedium}</span>
                                    <span className="text-xs text-zinc-500 uppercase">Medium</span>
                                </div>
                                 <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                                    <span className="text-red-500 font-bold block text-xl mb-1">{user.problemsSolvedHard}</span>
                                    <span className="text-xs text-zinc-500 uppercase">Hard</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD ---

const ProjectDashboard = ({ projects, onCreateProject, onSelectProject, onRenameProject, onDeleteProject, user, onShowProfile }: { 
    projects: Project[], 
    onCreateProject: () => void, 
    onSelectProject: (id: string) => void, 
    onRenameProject: (id: string, newTitle: string) => void,
    onDeleteProject: (id: string) => void,
    user: User, 
    onShowProfile: () => void 
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    
    const handleStartRename = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingId(project.id);
        setEditTitle(project.title);
    };
    
    const handleSaveRename = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            onRenameProject(id, editTitle.trim());
        }
        setEditingId(null);
        setEditTitle('');
    };
    
    const handleCancelRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditTitle('');
    };
    
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDeleteProject(id);
    };
    
    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
             <div className="max-w-6xl mx-auto">
                 <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/20">
                            <Terminal className="w-6 h-6 text-white" />
                         </div>
                         <h1 className="text-2xl font-bold tracking-tight">TILA AI Dashboard</h1>
                     </div>
                     
                     {/* User Profile Trigger */}
                     <div onClick={onShowProfile} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-zinc-900 rounded-xl transition-colors">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">{user.name}</p>
                            <p className="text-xs text-zinc-500">{user.rank}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:border-violet-500 group-hover:text-white transition-all">
                            <UserIcon className="w-5 h-5" />
                        </div>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {/* Create New Card (Visual) */}
                     <div onClick={onCreateProject} className="group cursor-pointer border border-dashed border-zinc-800 hover:border-violet-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-900/30 transition-all min-h-[200px]">
                         <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-violet-600/20 group-hover:text-violet-500 transition-colors">
                             <Plus className="w-6 h-6 text-zinc-500 group-hover:text-violet-500" />
                         </div>
                         <h3 className="font-bold text-white mb-1">New Notebook</h3>
                         <p className="text-sm text-zinc-500">Start a fresh coding environment</p>
                     </div>

                     {projects.map(p => (
                         <div key={p.id} onClick={() => onSelectProject(p.id)} className="group cursor-pointer bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all hover:bg-zinc-900/50 flex flex-col min-h-[200px] relative overflow-hidden">
                             {/* Action buttons */}
                             <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                 <button 
                                     onClick={(e) => handleStartRename(e, p)}
                                     className="p-1.5 rounded-lg bg-zinc-800 hover:bg-violet-600 text-zinc-400 hover:text-white transition-colors"
                                     title="Rename"
                                 >
                                     <FileText className="w-3.5 h-3.5" />
                                 </button>
                                 <button 
                                     onClick={(e) => handleDelete(e, p.id)}
                                     className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
                                     title="Delete"
                                 >
                                     <X className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                             <div className="mb-auto">
                                 <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 border border-zinc-700">
                                     <Code2 className="w-5 h-5 text-zinc-400" />
                                 </div>
                                 {editingId === p.id ? (
                                     <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                         <input
                                             type="text"
                                             value={editTitle}
                                             onChange={(e) => setEditTitle(e.target.value)}
                                             onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e, p.id)}
                                             className="flex-1 bg-zinc-800 border border-violet-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                                             autoFocus
                                         />
                                         <button onClick={(e) => handleSaveRename(e, p.id)} className="p-1 text-green-500 hover:text-green-400">
                                             <Check className="w-4 h-4" />
                                         </button>
                                         <button onClick={handleCancelRename} className="p-1 text-red-500 hover:text-red-400">
                                             <X className="w-4 h-4" />
                                         </button>
                                     </div>
                                 ) : (
                                     <h3 className="font-bold text-xl text-white mb-2">{p.title}</h3>
                                 )}
                                 <p className="text-sm text-zinc-500 line-clamp-2">{p.description}</p>
                             </div>
                             <div className="pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-zinc-600">
                                 <span className="flex items-center gap-1"><FileIcon className="w-3 h-3" /> {p.files.length} Files</span>
                                 <span>Last edited {new Date(p.lastEdited).toLocaleDateString()}</span>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
};

// --- AUTH SCREENS ---

const LoginScreen = ({ onLogin, onRegister, onBack, error }: { onLogin: (email: string, password: string) => void, onRegister: () => void, onBack: () => void, error: string }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 relative">
                <button onClick={onBack} className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 text-xs">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="text-center mb-8 mt-6">
                     <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/20">
                        <Terminal className="w-6 h-6 text-white" />
                     </div>
                     <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                     <p className="text-zinc-500 text-sm">Sign in to your TILA AI account</p>
                </div>
                <div className="space-y-4">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <Input type="email" placeholder="Email Address" className="pl-10" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <Input type="password" placeholder="Password" className="pl-10" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                    </div>
                    <Button onClick={() => onLogin(email, password)} className="w-full">Sign In</Button>
                    <div className="text-center text-xs text-zinc-500 mt-4">
                        Don't have an account? <button onClick={onRegister} className="text-violet-400 hover:underline">Register</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RegisterScreen = ({ onRegister, onLogin, onBack, error }: { onRegister: (name: string, email: string, password: string) => void, onLogin: () => void, onBack: () => void, error: string }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    
    const handleSubmit = () => {
        setLocalError('');
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }
        onRegister(name, email, password);
    };
    
    return (
         <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 relative">
                <button onClick={onBack} className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 text-xs">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="text-center mb-8 mt-6">
                     <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-6 h-6" />
                     </div>
                     <h2 className="text-2xl font-bold text-white">Create Account</h2>
                     <p className="text-zinc-500 text-sm">Join the TILA AI Developer Community</p>
                </div>
                <div className="space-y-4">
                    {(error || localError) && (
                        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
                            {error || localError}
                        </div>
                    )}
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <Input type="text" placeholder="Full Name" className="pl-10" value={name} onChange={(e: any) => setName(e.target.value)} />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <Input type="email" placeholder="Email Address" className="pl-10" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <Input type="password" placeholder="Password" className="pl-10" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <Input type="password" placeholder="Confirm Password" className="pl-10" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
                    </div>
                    <Button onClick={handleSubmit} className="w-full">Create Account</Button>
                    <div className="text-center text-xs text-zinc-500 mt-4">
                        Already have an account? <button onClick={onLogin} className="text-violet-400 hover:underline">Sign In</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- VIEWS ---

const ChallengesView = ({ files, onXPChange, onLoadChallenge, isGuestMode, userChallenges, onRefresh, onShowNotification }: { files: StudyFile[], onXPChange: (n: number) => void, onLoadChallenge: (c: CodingChallenge) => void, isGuestMode: boolean, userChallenges: any[], onRefresh: () => void, onShowNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void }) => {
    const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualTopic, setManualTopic] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    // Group challenges by topic
    const challengesByTopic = userChallenges.reduce((acc: any, challenge: any) => {
        const topic = challenge.topic || 'General';
        if (!acc[topic]) {
            acc[topic] = [];
        }
        acc[topic].push(challenge);
        return acc;
    }, {});

    const generate = async () => {
        if (files.length === 0 && !manualTopic.trim()) {
            onShowNotification("Please enter a topic to generate challenges.", "warning");
            return;
        }
        
        setLoading(true);
        try {
            const topic = manualTopic || "Algorithms & Data Structures";
            
            // Check if topic already exists
            const existingTopicChallenges = userChallenges.filter(c => 
                c.topic && c.topic.toLowerCase() === topic.toLowerCase()
            );
            
            const data = await generateCodingChallenges(topic, files);
            
            // Deduplicate challenges by title within this topic
            const existingTitles = new Set(existingTopicChallenges.map(c => c.title.toLowerCase()));
            const newChallenges = data.filter(c => !existingTitles.has(c.title.toLowerCase()));
            
            if (newChallenges.length === 0) {
                onShowNotification(`All generated challenges for "${topic}" already exist. You have ${existingTopicChallenges.length} challenges in your collection.`, "info");
                setLoading(false);
                return;
            }
            
            setChallenges(newChallenges);
            
            // Note: Challenges are now saved per-notebook in the project itself via handleGenerateChallengesForNode
            // No need to save to global backend - this ensures per-notebook isolation
            onShowNotification(`Generated ${newChallenges.length} challenges for "${topic}"!`, "success");
        } catch (error) {
            console.error('Challenge generation failed:', error);
            onShowNotification('Failed to generate challenges. Please try again.', "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-black">
            <div className="max-w-4xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Algorithm Arena</h2>
                <p className="text-zinc-500 mb-8">Generate LeetCode-style problems based on your syllabus or any topic.</p>
                
                {files.length === 0 && (
                     <div className="max-w-md mx-auto mb-6">
                        <Input 
                            value={manualTopic} 
                            onChange={(e: any) => setManualTopic(e.target.value)} 
                            placeholder="Enter a topic (e.g., Dynamic Programming)" 
                            className="mb-2"
                        />
                        <p className="text-xs text-zinc-600">No syllabus uploaded. AI will generate based on this topic.</p>
                    </div>
                )}
                
                <Button onClick={generate} disabled={loading || (files.length === 0 && !manualTopic)} className="mx-auto">
                    {loading ? 'Generating...' : 'Generate New Challenges'}
                </Button>
            </div>

            {/* Show saved challenges by topic */}
            {!selectedTopic && Object.keys(challengesByTopic).length > 0 && (
                <div className="max-w-4xl mx-auto mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Your Challenges by Topic</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.keys(challengesByTopic).map(topic => (
                            <div 
                                key={topic}
                                onClick={() => setSelectedTopic(topic)}
                                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500 cursor-pointer transition-all"
                            >
                                <h4 className="font-bold text-white mb-1">{topic}</h4>
                                <p className="text-sm text-zinc-500">{challengesByTopic[topic].length} challenges</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Show challenges for selected topic */}
            {selectedTopic && (
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Button onClick={() => setSelectedTopic(null)} variant="ghost" className="h-9 text-xs">
                            ← Back to Topics
                        </Button>
                        <h3 className="text-xl font-bold text-white">{selectedTopic} Challenges</h3>
                    </div>
                    <div className="space-y-4">
                        {challengesByTopic[selectedTopic].map((c: any) => (
                            <div key={c._id} className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-violet-500/50 transition-all group flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-white">{c.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' : c.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>{c.difficulty}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 line-clamp-1">{c.description}</p>
                                </div>
                                <Button onClick={() => onLoadChallenge(c)} variant="outline" className="h-9 text-xs">Solve</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Show newly generated challenges */}
            {challenges.length > 0 && (
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-xl font-bold text-white mb-4">Newly Generated Challenges</h3>
                    <div className="space-y-4">
                        {challenges.map(c => (
                            <div key={c.id} className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-violet-500/50 transition-all group flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-white">{c.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' : c.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>{c.difficulty}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 line-clamp-1">{c.description}</p>
                                </div>
                                <Button onClick={() => onLoadChallenge(c)} variant="outline" className="h-9 text-xs">Solve</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const RoadmapView = ({ files, isGuestMode, onGenerateChallengesForNode, onSendToTutor, userRoadmaps, onRefresh, onShowNotification, onSaveRoadmap }: { files: StudyFile[], isGuestMode: boolean, onGenerateChallengesForNode: (nodeLabel: string) => void, onSendToTutor: (nodeLabel: string) => void, userRoadmaps: any[], onRefresh: () => void, onShowNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, onSaveRoadmap?: (roadmap: any) => void }) => {
    const [data, setData] = React.useState<GraphData | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [topic, setTopic] = React.useState('');
    const [roadmapId, setRoadmapId] = React.useState<string | null>(null);
    const [selectedRoadmap, setSelectedRoadmap] = React.useState<any | null>(null);

    const generate = async () => {
        if (!topic && files.length === 0) {
            onShowNotification('Please enter a topic to generate a roadmap.', 'warning');
            return;
        }
        
        setLoading(true);
        try {
            const topicName = topic || 'Programming';
            console.log('Generating roadmap for:', topicName);
            const res = await generateRoadmapData(files, topicName);
            console.log('Generated roadmap data:', res);
            setData(res);
            
            const newRoadmap = { 
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                topic: topicName, 
                nodes: res.nodes, 
                links: res.links,
                progress: 0
            };
            setSelectedRoadmap(newRoadmap);
            
            // Save to current notebook via callback (per-notebook isolation)
            if (onSaveRoadmap && res.nodes.length > 0) {
                onSaveRoadmap(newRoadmap);
                onShowNotification(`Roadmap "${topicName}" created successfully!`, 'success');
            } else if (isGuestMode) {
                onShowNotification(`Roadmap "${topicName}" created! Sign up to save it.`, 'info');
            }
        } catch (error: any) {
            console.error('Roadmap generation failed:', error);
            onShowNotification(`Failed to generate roadmap: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadRoadmap = (roadmap: any) => {
        setData({ nodes: roadmap.nodes || [], links: roadmap.links || [] });
        setRoadmapId(roadmap._id);
        setTopic(roadmap.topic);
        setSelectedRoadmap(roadmap);
    };
    
    // If we have a selected roadmap but no data, restore it
    React.useEffect(() => {
        if (selectedRoadmap && !data) {
            setData({ nodes: selectedRoadmap.nodes || [], links: selectedRoadmap.links || [] });
            setTopic(selectedRoadmap.topic);
        }
    }, [selectedRoadmap, data]);

    const goBack = () => {
        // Clear current view to show roadmap list
        setData(null);
        setSelectedRoadmap(null);
        setTopic('');
        setRoadmapId(null);
    };

    const [searchQuery, setSearchQuery] = React.useState('');
    
    const filteredRoadmaps = userRoadmaps.filter(roadmap => 
        roadmap.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
            {!data && !selectedRoadmap ? (
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <Map className="w-8 h-8 text-violet-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Learning Roadmaps</h2>
                            <p className="text-zinc-500">Visual learning paths to master any topic step by step.</p>
                        </div>
                        
                        {userRoadmaps.length > 0 && (
                            <div className="mb-12">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">Your Roadmaps</h3>
                                    <div className="relative w-64">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search roadmaps..."
                                            className="w-full h-9 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-zinc-600"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredRoadmaps.map(roadmap => (
                                        <div 
                                            key={roadmap._id}
                                            onClick={() => loadRoadmap(roadmap)}
                                            className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-violet-500 cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                                                    <Map className="w-5 h-5 text-violet-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors">{roadmap.topic}</h4>
                                                    <p className="text-xs text-zinc-500">{roadmap.nodes?.length || 0} concepts</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-zinc-600">
                                                <span>Click to view</span>
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-violet-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredRoadmaps.length === 0 && searchQuery && (
                                    <div className="text-center py-8 text-zinc-500">
                                        No roadmaps found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center">
                            <h3 className="text-lg font-bold text-white mb-4">Create New Roadmap</h3>
                            <div className="max-w-md mx-auto mb-4">
                                <Input 
                                    value={topic} 
                                    onChange={(e: any) => setTopic(e.target.value)} 
                                    placeholder="Enter Topic (e.g. React.js, Machine Learning)" 
                                    className="text-center"
                                />
                            </div>
                            <Button onClick={generate} disabled={!topic || loading} className="mx-auto">
                                {loading ? 'Generating...' : 'Generate Roadmap'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950">
                        <div className="flex items-center gap-4">
                            <button onClick={goBack} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-white">{topic || 'Learning Path'}</h2>
                                <p className="text-xs text-zinc-500">{data?.nodes?.length || 0} concepts to master</p>
                            </div>
                        </div>
                        <Button onClick={goBack} variant="outline" className="h-9 text-xs">
                            ← Back to Roadmaps
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative">
                                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-800"></div>
                                <div className="space-y-6">
                                    {data?.nodes?.map((node, i) => (
                                        <div key={i} className="relative flex items-start gap-6 pl-4">
                                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-black flex-shrink-0 ${node.status === 'mastered' ? 'bg-green-500 text-black' : node.status === 'unlocked' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                                                <span className="font-bold text-xs">{i+1}</span>
                                            </div>
                                            <div className="flex-1 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-white">{node.label}</h3>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${node.type === 'core' ? 'bg-violet-500/20 text-violet-400' : node.type === 'concept' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>{node.type}</span>
                                                        </div>
                                                        <p className="text-xs text-zinc-500">Click buttons to learn or practice this concept</p>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <Button onClick={() => onGenerateChallengesForNode(node.label)} variant="outline" className="h-8 text-xs">
                                                            Challenges
                                                        </Button>
                                                        <Button onClick={() => onSendToTutor(node.label)} variant="ghost" className="h-8 text-xs">
                                                            Ask Tutor
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CommunityView = ({ user, isGuestMode, onShowNotification, onAddSnippet }: { user: User | null, isGuestMode: boolean, onShowNotification: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, onAddSnippet: (snippet: any) => void }) => {
    const [posts, setPosts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [selectedPost, setSelectedPost] = React.useState<any | null>(null);
    const [newPost, setNewPost] = React.useState({ title: '', description: '', code: '', language: 'python', tags: '' });

    React.useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await apiService.getCommunityPosts();
            setPosts(data);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.title.trim()) {
            onShowNotification('Please enter a title', 'warning');
            return;
        }
        try {
            const post = await apiService.createCommunityPost({
                title: newPost.title,
                description: newPost.description,
                code: newPost.code,
                language: newPost.language,
                tags: newPost.tags.split(',').map(t => t.trim()).filter(t => t)
            });
            setPosts(prev => [post, ...prev]);
            setShowCreateModal(false);
            setNewPost({ title: '', description: '', code: '', language: 'python', tags: '' });
            onShowNotification('Post shared with community!', 'success');
        } catch (error) {
            onShowNotification('Failed to create post', 'error');
        }
    };

    const handleLike = async (postId: string) => {
        if (isGuestMode) {
            onShowNotification('Sign in to like posts', 'info');
            return;
        }
        try {
            const result = await apiService.likeCommunityPost(postId);
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: result.likes } : p));
        } catch (error) {
            onShowNotification('Failed to like post', 'error');
        }
    };

    const handleFork = async (postId: string) => {
        if (isGuestMode) {
            onShowNotification('Sign in to fork posts', 'info');
            return;
        }
        try {
            const result = await apiService.forkCommunityPost(postId);
            if (result.snippet) {
                onAddSnippet(result.snippet);
                onShowNotification('Code forked to your snippets!', 'success');
            }
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, forks: result.forks } : p));
        } catch (error) {
            onShowNotification('Failed to fork post', 'error');
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-black">
            {/* Create Post Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-800">
                            <h3 className="text-xl font-bold text-white">Share with Community</h3>
                            <p className="text-sm text-zinc-500">Share your code, solutions, or notes with other developers</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <input type="text" placeholder="Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500" />
                            <textarea placeholder="Description" value={newPost.description} onChange={e => setNewPost({...newPost, description: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 h-20 resize-none" />
                            <textarea placeholder="Code (optional)" value={newPost.code} onChange={e => setNewPost({...newPost, code: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 h-32 resize-none font-mono text-sm" />
                            <div className="flex gap-4">
                                <select value={newPost.language} onChange={e => setNewPost({...newPost, language: e.target.value})} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500">
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="typescript">TypeScript</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                </select>
                                <input type="text" placeholder="Tags (comma separated)" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                            <Button onClick={() => setShowCreateModal(false)} variant="outline">Cancel</Button>
                            <Button onClick={handleCreatePost}>Share Post</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Detail Modal */}
            {selectedPost && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
                    <div className="w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-800">
                            <h3 className="text-xl font-bold text-white">{selectedPost.title}</h3>
                            <p className="text-sm text-zinc-500">by {selectedPost.author} • {formatDate(selectedPost.createdAt)}</p>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <p className="text-zinc-400 mb-4">{selectedPost.description}</p>
                            {selectedPost.code && (
                                <div className="bg-black rounded-xl border border-zinc-800 overflow-hidden">
                                    <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-500">{selectedPost.language}</div>
                                    <pre className="p-4 text-sm font-mono text-zinc-300 overflow-x-auto">{selectedPost.code}</pre>
                                </div>
                            )}
                            {selectedPost.tags?.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedPost.tags.map((t: string) => <span key={t} className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs">{t}</span>)}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-zinc-800 flex justify-between">
                            <div className="flex gap-3">
                                <button onClick={() => handleLike(selectedPost._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-[11px] font-bold uppercase tracking-wide">
                                    <Heart className="w-3.5 h-3.5" /> {selectedPost.likes}
                                </button>
                                <button onClick={() => handleFork(selectedPost._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors text-[11px] font-bold uppercase tracking-wide">
                                    <GitFork className="w-3.5 h-3.5" /> {selectedPost.forks}
                                </button>
                            </div>
                            <Button onClick={() => setSelectedPost(null)} variant="outline">Close</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Community Library</h2>
                        <p className="text-zinc-500">Explore and share code with other developers.</p>
                    </div>
                    {!isGuestMode && (
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4" /> Share Code
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading posts...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
                        <p className="text-zinc-500 mb-6">Be the first to share something with the community!</p>
                        {!isGuestMode && <Button onClick={() => setShowCreateModal(true)}>Create First Post</Button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {posts.map(post => (
                            <div key={post._id} onClick={() => setSelectedPost(post)} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-base font-bold text-white hover:text-violet-400 transition-colors">{post.title}</span>
                                            <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800">by {post.author}</span>
                                        </div>
                                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{post.description}</p>
                                        <div className="flex items-center gap-3">
                                            {post.tags?.map((t: string) => (
                                                <span key={t} className="text-[10px] font-bold text-violet-400 bg-violet-900/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {t}
                                                </span>
                                            ))}
                                            <span className="text-xs text-zinc-600">{formatDate(post.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-500 ml-4">
                                        <button onClick={(e) => { e.stopPropagation(); handleLike(post._id); }} className="flex items-center gap-1 px-2 py-1 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors text-[11px] font-bold">
                                            <Heart className="w-3.5 h-3.5" />
                                            <span>{post.likes || 0}</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleFork(post._id); }} className="flex items-center gap-1 px-2 py-1 hover:text-violet-400 hover:bg-violet-500/10 rounded transition-colors text-[11px] font-bold">
                                            <GitFork className="w-3.5 h-3.5" />
                                            <span>{post.forks || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
  const [authStage, setAuthStage] = useState<AuthStage>(AuthStage.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Project Management
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // View State (Derived from active project or default)
  const [viewState, setViewState] = useState<ViewState>(ViewState.IDE);
  
  // Data State
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [userRoadmaps, setUserRoadmaps] = useState<any[]>([]);
  
  // Chat History Management
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  // Notification & Modal System
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void; confirmText?: string; cancelText?: string; isDanger?: boolean } | null>(null);
  const [inputModal, setInputModal] = useState<{ title: string; message: string; placeholder?: string; onSubmit: (value: string) => void } | null>(null);
  
  // Helper functions for notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      setNotification({ message, type });
  };
  
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
      setConfirmModal({ title, message, onConfirm });
  };
  
  const showInput = (title: string, message: string, placeholder: string, onSubmit: (value: string) => void) => {
      setInputModal({ title, message, placeholder, onSubmit });
  };
  
  // Editor State with Smart Caching
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>(ProgrammingLanguage.PYTHON);
  const [editorOutput, setEditorOutput] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(ExecutionMode.SCRIPT);
  const [codeCache, setCodeCache] = useState<Record<string, string>>({});
  const [currentChallenge, setCurrentChallenge] = useState<CodingChallenge | null>(null);
  
  // AI State
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.SYLLABUS);
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>(ExplanationStyle.DEFAULT);
  
  // Call State
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);

  const audioContextRef = useRef<AudioContext | null>(null);
  useEffect(() => { audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); }, []);

  // Check authentication on mount and persist token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token); // Ensure token is set in API service
      loadUserData();
    }
  }, []);

  // Load chat history when user is authenticated (challenges/roadmaps/snippets are loaded per-project)
  useEffect(() => {
    if (user && !isGuestMode) {
      loadChatHistory();
    }
  }, [user, isGuestMode]);

  // --- HANDLERS ---

  const loadUserData = async (showWelcome: boolean = false) => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser({
        id: userData.id,
        name: userData.name || userData.username,
        email: userData.email,
        isTestUser: false,
        streak: userData.streak || 0,
        xp: userData.xp || 0,
        rank: userData.rank || 'Script Kiddie',
        problemsSolvedEasy: userData.problemsSolvedEasy || 0,
        problemsSolvedMedium: userData.problemsSolvedMedium || 0,
        problemsSolvedHard: userData.problemsSolvedHard || 0
      });
      setIsGuestMode(false);
      setAuthStage(AuthStage.DASHBOARD_SELECTION);
      
      // Load user's projects with their associated data
      const projectsData = await apiService.getProjects();
      setProjects(projectsData.map((p: any) => ({
        id: p._id || p.id,
        title: p.title,
        description: p.description,
        lastEdited: new Date(p.lastEdited),
        files: p.files || [],
        messages: p.messages || [],
        code: p.code || '',
        language: p.language || ProgrammingLanguage.PYTHON,
        snippets: p.snippets || [],
        challenges: p.challenges || [],
        roadmaps: p.roadmaps || []
      })));
      
      if (showWelcome) {
        showNotification(`Welcome back, ${userData.name || userData.username}!`, 'success');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('token');
      apiService.clearToken();
    }
  };

  const loadUserChallenges = async () => {
    try {
      const challenges = await apiService.getChallenges();
      setUserChallenges(challenges);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
  };

  const loadUserRoadmaps = async () => {
    try {
      const roadmaps = await apiService.getRoadmaps();
      setUserRoadmaps(roadmaps);
    } catch (error) {
      console.error('Failed to load roadmaps:', error);
    }
  };

  const loadUserSnippets = async () => {
    try {
      const snippetsData = await apiService.getSnippets();
      setSnippets(snippetsData.map((s: any) => ({
        id: s._id || s.id,
        title: s.title,
        code: s.code,
        language: s.language,
        explanation: s.explanation,
        tags: s.tags || [],
        createdAt: new Date(s.createdAt)
      })));
    } catch (error) {
      console.error('Failed to load snippets:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError('');
      const response = await apiService.login(email, password);
      
      // Ensure token is properly saved
      if (response.token) {
        localStorage.setItem('token', response.token);
        apiService.setToken(response.token);
      }
      
      setIsGuestMode(false);
      await loadUserData(true); // Show welcome notification
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Login failed';
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('400')) {
        setAuthError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        setAuthError('No account found with this email. Please register first.');
      } else {
        setAuthError('Login failed. Please try again later.');
      }
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    try {
      setAuthError('');
      const response = await apiService.register(name, email, password);
      
      // Ensure token is properly saved
      if (response.token) {
        localStorage.setItem('token', response.token);
        apiService.setToken(response.token);
      }
      
      setIsGuestMode(false);
      await loadUserData(false);
      showNotification(`Welcome to TILA AI, ${name}!`, 'success');
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage = error.message || 'Registration failed';
      if (errorMessage.includes('already exists') || errorMessage.includes('400')) {
        setAuthError('An account with this email already exists. Please login instead.');
      } else {
        setAuthError('Registration failed. Please try again.');
      }
    }
  };

  const handleLogout = () => {
      // Clear all user data and session
      localStorage.removeItem('token');
      apiService.clearToken();
      setUser(null);
      setIsGuestMode(false);
      setProjects([]);
      setActiveProjectId(null);
      setMessages([]);
      setSnippets([]);
      setUserChallenges([]);
      setUserRoadmaps([]);
      setChatSessions([]);
      setActiveChatId(null);
      setCode('');
      setFiles([]);
      setAuthStage(AuthStage.LANDING);
      showNotification('Logged out successfully', 'info');
  };

  const handleTestUser = () => {
      setUser({ 
          id: 'guest', 
          name: 'Guest Dev', 
          email: 'guest@tila.ai', 
          isTestUser: true, 
          streak: 1, 
          xp: 0, 
          rank: 'Guest',
          problemsSolvedEasy: 0,
          problemsSolvedMedium: 0,
          problemsSolvedHard: 0
      });
      setIsGuestMode(true);
      setAuthStage(AuthStage.DASHBOARD_SELECTION);
  };

  const createProject = async () => {
      const newProject: Project = {
          id: Date.now().toString(),
          title: "Untitled Notebook",
          description: "New Coding Environment",
          lastEdited: new Date(),
          files: [],
          messages: [],
          code: "",
          language: ProgrammingLanguage.PYTHON,
          snippets: [],
          challenges: [],
          roadmaps: []
      };
      
      if (!isGuestMode) {
          try {
            const savedProject = await apiService.createProject(newProject.title, newProject.description);
            const projectWithId = { ...newProject, id: savedProject._id || savedProject.id };
            setProjects(prev => [...prev, projectWithId]);
            setActiveProjectId(projectWithId.id);
          } catch (error) {
            console.error('Failed to create project:', error);
            // Fallback to local
            setProjects(prev => [...prev, newProject]);
            setActiveProjectId(newProject.id);
          }
      } else {
          // Guest mode - create locally
          setProjects(prev => [...prev, newProject]);
          setActiveProjectId(newProject.id);
      }
      
      // Reset Workspace with fresh data for new notebook
      setFiles([]);
      setMessages([]);
      setCode("");
      setSnippets([]);
      setUserChallenges([]);
      setUserRoadmaps([]);
      setAuthStage(AuthStage.WORKSPACE);
  };

  const selectProject = async (id: string) => {
      const p = projects.find(x => x.id === id);
      if (p) {
          setActiveProjectId(p.id);
          setFiles(p.files || []);
          setMessages(p.messages || []);
          setCode(p.code || '');
          setLanguage(p.language || ProgrammingLanguage.PYTHON);
          
          // Load project-specific data ONLY from the project itself (per-notebook isolation)
          // Do NOT load from global user data - each notebook has its own data
          setUserChallenges((p as any).challenges || []);
          setUserRoadmaps((p as any).roadmaps || []);
          setSnippets(p.snippets || []);
          
          setAuthStage(AuthStage.WORKSPACE);
      }
  };

  const handleRenameProject = async (id: string, newTitle: string) => {
      // Update locally
      setProjects(prev => prev.map(p => 
          p.id === id ? { ...p, title: newTitle, lastEdited: new Date() } : p
      ));
      
      // Update on backend if authenticated
      if (!isGuestMode) {
          try {
              await apiService.updateProject(id, { title: newTitle });
              showNotification('Notebook renamed successfully', 'success');
          } catch (error) {
              console.error('Failed to rename project:', error);
              showNotification('Renamed locally (sync failed)', 'warning');
          }
      } else {
          showNotification('Notebook renamed', 'success');
      }
  };

  const handleDeleteProject = async (id: string) => {
      const projectToDelete = projects.find(p => p.id === id);
      setConfirmModal({
          title: 'Delete Notebook',
          message: `Are you sure you want to delete "${projectToDelete?.title || 'this notebook'}"? All your code, snippets, challenges, and roadmaps in this notebook will be permanently deleted.`,
          confirmText: 'Delete',
          cancelText: 'Keep',
          isDanger: true,
          onConfirm: async () => {
              // Remove locally
              setProjects(prev => prev.filter(p => p.id !== id));
              
              // Delete from backend if authenticated
              if (!isGuestMode) {
                  try {
                      await apiService.deleteProject(id);
                      showNotification('Notebook deleted', 'success');
                  } catch (error) {
                      console.error('Failed to delete project:', error);
                      showNotification('Deleted locally (sync failed)', 'warning');
                  }
              } else {
                  showNotification('Notebook deleted', 'success');
              }
              
              setConfirmModal(null);
          },
          onCancel: () => setConfirmModal(null)
      });
  };

  const handleBackToDashboard = async () => {
      // Save current state to project (including challenges and roadmaps for isolation)
      if (activeProjectId) {
          const updatedProject = { 
              files, 
              messages, 
              code, 
              language, 
              snippets, 
              challenges: userChallenges,
              roadmaps: userRoadmaps,
              lastEdited: new Date() 
          };
          
          // Update local state
          setProjects(prev => prev.map(p => 
            p.id === activeProjectId 
            ? { ...p, ...updatedProject } 
            : p
          ));
          
          // Sync to backend if authenticated
          if (!isGuestMode) {
              try {
                  await apiService.updateProject(activeProjectId, updatedProject);
              } catch (error) {
                  console.error('Failed to sync project:', error);
              }
          }
      }
      setActiveProjectId(null);
      setAuthStage(AuthStage.DASHBOARD_SELECTION);
      setCallStatus(CallStatus.IDLE); // End call if active
  };

  const recognitionRef = useRef<any>(null);
  const elevenLabsWidgetRef = useRef<HTMLElement | null>(null);
  const voiceTranscriptsRef = useRef<VoiceTranscript[]>([]);

  const toggleCall = async () => {
      if (callStatus === CallStatus.ACTIVE) {
          // End the call
          if (elevenLabsWidgetRef.current) {
              // Try to end the call programmatically
              try {
                  (elevenLabsWidgetRef.current as any).endCall?.();
              } catch (e) {
                  console.log('Could not end call programmatically');
              }
              // Remove the widget
              elevenLabsWidgetRef.current.remove();
              elevenLabsWidgetRef.current = null;
          }
          setCallStatus(CallStatus.IDLE);
          
          // Process transcripts and add summary to chat
          if (voiceTranscriptsRef.current.length > 0) {
              handleVoiceSessionEnd(voiceTranscriptsRef.current);
              voiceTranscriptsRef.current = [];
          }
          showNotification('Voice call ended', 'info');
      } else {
          // Start the call - load ElevenLabs widget
          setCallStatus(CallStatus.ACTIVE);
          showNotification('Starting voice mentor...', 'info');
          
          // Load the ElevenLabs widget script if not already loaded
          if (!document.querySelector('script[src*="elevenlabs.io/convai-widget"]')) {
              const script = document.createElement('script');
              script.src = 'https://elevenlabs.io/convai-widget/index.js';
              script.async = true;
              document.body.appendChild(script);
              
              script.onload = () => createElevenLabsWidget();
          } else {
              createElevenLabsWidget();
          }
      }
  };
  
  const createElevenLabsWidget = () => {
      // Remove existing widget if any
      const existingWidget = document.querySelector('elevenlabs-convai');
      if (existingWidget) existingWidget.remove();
      
      // Create new widget
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', getAgentId());
      widget.style.position = 'fixed';
      widget.style.bottom = '20px';
      widget.style.right = '20px';
      widget.style.zIndex = '9999';
      
      // Listen for events
      widget.addEventListener('elevenlabs-convai:call-started', () => {
          console.log('ElevenLabs call started');
          voiceTranscriptsRef.current = [];
          
          // Add "session started" message to chat
          setMessages(prev => [...prev, {
              id: `voice-start-${Date.now()}`,
              role: MessageRole.MODEL,
              text: '🎙️ **Voice Mentoring Session Started**\n\nYou are now connected to your AI Voice Mentor. Speak naturally and ask any coding questions. The conversation will be summarized when the session ends.',
              timestamp: new Date()
          }]);
      });
      
      widget.addEventListener('elevenlabs-convai:call-ended', () => {
          console.log('ElevenLabs call ended');
          setCallStatus(CallStatus.IDLE);
          
          // Add "session ended" message and process transcripts
          const transcripts = voiceTranscriptsRef.current;
          
          if (transcripts.length > 0) {
              handleVoiceSessionEnd(transcripts);
          } else {
              // No transcripts captured, just show session ended
              setMessages(prev => [...prev, {
                  id: `voice-end-${Date.now()}`,
                  role: MessageRole.MODEL,
                  text: '🎙️ **Voice Mentoring Session Ended**\n\nNo conversation was captured. This may happen if the call was very short or there was a connection issue.',
                  timestamp: new Date()
              }]);
          }
          
          voiceTranscriptsRef.current = [];
          
          // Remove widget
          if (elevenLabsWidgetRef.current) {
              elevenLabsWidgetRef.current.remove();
              elevenLabsWidgetRef.current = null;
          }
      });
      
      widget.addEventListener('elevenlabs-convai:transcript', (e: any) => {
          const { text, source } = e.detail || {};
          if (text) {
              const role = source === 'user' ? 'user' : 'agent';
              voiceTranscriptsRef.current.push({ role, text, timestamp: new Date() });
          }
      });
      
      widget.addEventListener('elevenlabs-convai:message', (e: any) => {
          const { message, role, source } = e.detail || {};
          const text = message || e.detail?.text;
          if (text) {
              const speakerRole = role === 'user' || source === 'user' ? 'user' : 'agent';
              voiceTranscriptsRef.current.push({ role: speakerRole, text, timestamp: new Date() });
          }
      });
      
      document.body.appendChild(widget);
      elevenLabsWidgetRef.current = widget;
  };
  
  const handleVoiceSessionEnd = (transcripts: VoiceTranscript[]) => {
      if (transcripts.length === 0) return;
      
      // Generate conversation summary
      const userMessages = transcripts.filter(t => t.role === 'user');
      const agentMessages = transcripts.filter(t => t.role === 'agent');
      
      // Calculate duration
      const startTime = transcripts[0]?.timestamp;
      const endTime = transcripts[transcripts.length - 1]?.timestamp;
      const durationMs = endTime && startTime ? endTime.getTime() - startTime.getTime() : 0;
      const durationMin = Math.max(1, Math.round(durationMs / 60000));
      
      // Build conversation transcript
      const conversationLog = transcripts
          .map(t => `**${t.role === 'user' ? 'You' : 'AI Mentor'}:** ${t.text}`)
          .join('\n\n');
      
      // Extract key topics (simple extraction from user messages)
      const topics = userMessages
          .map(m => m.text)
          .join(' ')
          .substring(0, 200);
      
      // Create summary message
      const summaryMessage = `🎙️ **Voice Mentoring Session Ended**

---

### Session Summary

**Duration:** ~${durationMin} minute${durationMin > 1 ? 's' : ''}
**Exchanges:** ${transcripts.length} total (${userMessages.length} from you, ${agentMessages.length} from AI)

### Topics Discussed
${topics || 'General coding discussion'}

---

### Conversation Transcript

${conversationLog}

---

*Feel free to ask follow-up questions about anything discussed above!*`;
      
      // Add summary to chat
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: MessageRole.MODEL,
          text: summaryMessage,
          timestamp: new Date()
      }]);
      
      // Save to chat history if user is logged in
      if (user && !isGuestMode) {
          const chatTitle = `Voice Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
          apiService.saveChatHistory(chatTitle, [{
              id: Date.now().toString(),
              role: MessageRole.MODEL,
              text: summaryMessage,
              timestamp: new Date()
          }]).catch(e => console.log('Could not save voice session'));
      }
      
      showNotification('Voice session summary added to chat!', 'success');
  };
  


  const handleVoiceInput = async () => {
      if (!isListening) {
          // Check if speech recognition is supported
          const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognitionAPI) {
              showNotification('Speech recognition is not supported in this browser. Try Chrome or Edge.', 'error');
              return;
          }
          
          // Start listening
          setIsListening(true);
          showNotification('🎤 Listening... Speak now!', 'info');
          
          const recognition = startSpeechRecognition(
              async (transcript) => {
                  // User spoke - speech recognized
                  setIsListening(false);
                  setInput(transcript);
                  
                  // Show notification that speech was recognized
                  showNotification(`Speech recognized: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`, 'success');
                  
                  // Auto-send to tutor (always, not just in call mode)
                  setTimeout(() => {
                      sendMessage(transcript);
                  }, 500); // Small delay to show the recognized text first
              },
              () => {
                  setIsListening(false);
                  showNotification('Speech recognition ended', 'info');
              }
          );
          
          if (recognition) {
              recognitionRef.current = recognition;
          } else {
              setIsListening(false);
              showNotification('Failed to start speech recognition', 'error');
          }
      } else {
          // Stop listening
          if (recognitionRef.current) {
              recognitionRef.current.stop();
          }
          setIsListening(false);
          showNotification('Speech recognition stopped', 'info');
      }
  };

  const sendMessageWithVoice = async (text: string) => {
      const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
          const response = await generateDevResponse(text, mode, explanationStyle, code, language, files);
          
          const aiMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: MessageRole.MODEL,
              text: response.text,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);

          // Speak response in live call
          if (callStatus === CallStatus.ACTIVE) {
              const audioBlob = await textToSpeech(response.text);
              if (audioBlob) {
                  playAudioBlob(audioBlob);
              }
          }
      } catch (error) {
          console.error(error);
      } finally {
          setIsLoading(false);
      }
  };

  // Smart Code Caching - Save code when language changes
  const handleLanguageChange = async (newLang: ProgrammingLanguage) => {
      // Save current code to cache
      setCodeCache(prev => ({ ...prev, [language]: code }));
      
      // Check if we have cached code for the new language
      if (codeCache[newLang]) {
          setCode(codeCache[newLang]);
          setLanguage(newLang);
          showNotification(`Switched to ${newLang}. Loaded cached code.`, 'info');
      } else {
          // Offer to convert code if there's substantial code
          if (code.trim() && code.length > 30) {
              setConfirmModal({
                  title: 'Convert Code?',
                  message: `Would you like to convert your ${language} code to ${newLang}? Click "Convert" to translate your code, or "Start Fresh" to begin with a clean template.`,
                  confirmText: 'Convert',
                  cancelText: 'Start Fresh',
                  isDanger: false,
                  onConfirm: async () => {
                      setEditorOutput("Converting code...");
                      try {
                          const converted = await convertCodeLanguage(code, language, newLang);
                          setCode(converted);
                          setCodeCache(prev => ({ ...prev, [newLang]: converted }));
                          setEditorOutput(`Code converted from ${language} to ${newLang} successfully!`);
                          showNotification(`Code converted to ${newLang} successfully!`, 'success');
                      } catch (error) {
                          setEditorOutput("Conversion failed. Starting with template.");
                          setCode('');
                          showNotification('Conversion failed. Starting fresh.', 'error');
                      }
                      setLanguage(newLang);
                      setConfirmModal(null);
                  },
                  onCancel: () => {
                      // Start Fresh - clear code and switch to new language
                      setCode(''); // Clear the code
                      setLanguage(newLang); // Switch to new language
                      setCodeCache(prev => ({ ...prev, [newLang]: '' })); // Clear cache for new language
                      setEditorOutput('');
                      showNotification(`Started fresh with ${newLang}`, 'info');
                      setConfirmModal(null);
                  }
              });
          } else {
              // No substantial code, just switch language
              setLanguage(newLang);
              setCode(''); // Will be filled by CodeEditor boilerplate
              showNotification(`Switched to ${newLang}`, 'info');
          }
      }
  };
  
  // Clear cache when challenge is completed and save to snippets
  const handleChallengeComplete = async () => {
      if (!code.trim()) {
          showNotification('No code to save. Write some code first!', 'warning');
          return;
      }
      
      showNotification('Generating solution explanation...', 'info');
      
      // Generate AI explanation for the solution
      let aiExplanation = '';
      try {
          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
              },
              body: JSON.stringify({
                  contents: [{
                      parts: [{
                          text: `Analyze this ${language} solution for the challenge "${currentChallenge?.title}". Provide a concise explanation (2-3 sentences) of the approach, algorithm used, and time/space complexity:\n\n${code}`
                      }]
                  }]
              })
          });
          
          const data = await response.json();
          aiExplanation = data.candidates?.[0]?.content?.parts?.[0]?.text || `Completed ${currentChallenge?.title} solution in ${language}`;
      } catch (error) {
          console.error('Failed to generate AI explanation:', error);
          aiExplanation = `Completed ${currentChallenge?.title} solution in ${language}`;
      }
      
      // Create snippet from current code
      const snippet: CodeSnippet = {
          id: Date.now().toString(),
          title: `✅ ${currentChallenge?.title || 'Challenge Solution'}`,
          code: code,
          language: language,
          explanation: aiExplanation,
          tags: [language, currentChallenge?.difficulty || 'custom', 'completed', activeProjectId || 'notebook'],
          createdAt: new Date()
      };
      
      // Add to local snippets (per-notebook)
      setSnippets(prev => [snippet, ...prev]);
      
      showNotification('Challenge completed! Solution saved to this notebook.', 'success');
      
      // Clear state
      setCodeCache({});
      setCurrentChallenge(null);
      setCode('');
  };

  const handleRunCode = async (testCases?: { id: string; input: string; expectedOutput: string }[]) => {
      if (!code.trim()) {
          setEditorOutput("Error: No code to execute. Please write some code first.");
          return;
      }
      
      setIsRunningCode(true);
      setEditorOutput(testCases && testCases.length > 0 
          ? `Running ${testCases.length} test case(s)...` 
          : "Compiling and analyzing...");
      
      try {
          // Language mismatch detection
          const detectedLang = detectCodeLanguage(code);
          if (detectedLang && detectedLang !== language) {
              setEditorOutput(`⚠️ Language Mismatch Detected!\n\nEditor is set to: ${language.toUpperCase()}\nCode appears to be: ${detectedLang.toUpperCase()}\n\nPlease switch the editor language to ${detectedLang} or update your code.\n\nTip: Use the language dropdown in the toolbar to change languages.`);
              setIsRunningCode(false);
              return;
          }
          
          // Basic syntax validation
          const syntaxErrors = validateCodeSyntax(code, language);
          if (syntaxErrors.length > 0) {
              setEditorOutput(`Syntax Errors Found:\n${syntaxErrors.join('\n')}\n\nPlease fix these errors before running.`);
              setIsRunningCode(false);
              return;
          }
          
          // Convert test cases to the format expected by runCodeSimulation
          const formattedTestCases = testCases?.map(tc => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput
          }));
          
          const result = await runCodeSimulation(code, language, executionMode, formattedTestCases);
          setEditorOutput(result);
          
          // Simple XP gain simulation
          if (user) setUser({ ...user, xp: user.xp + 5 }); 
      } catch (e: any) {
          setEditorOutput(`Execution Error: ${e.message || 'AI could not process code. Check your syntax and try again.'}`);
      } finally {
          setIsRunningCode(false);
      }
  };
  
  // Detect code language based on syntax patterns
  const detectCodeLanguage = (code: string): ProgrammingLanguage | null => {
      const patterns = {
          [ProgrammingLanguage.PYTHON]: [
              /\bdef\s+\w+\s*\(/,           // def function_name(
              /\bprint\s*\(/,                // print(
              /\bif\s+.*:\s*$/m,             // if condition:
              /\bfor\s+\w+\s+in\s+/,         // for x in
              /\bimport\s+\w+/,              // import module
              /\bfrom\s+\w+\s+import/,       // from module import
              /\belif\s+/,                   // elif
              /\bself\./,                    // self.
              /__init__/,                    // __init__
          ],
          [ProgrammingLanguage.JAVASCRIPT]: [
              /\bfunction\s+\w+\s*\(/,       // function name(
              /\bconst\s+\w+\s*=/,           // const x =
              /\blet\s+\w+\s*=/,             // let x =
              /\bconsole\.log\s*\(/,         // console.log(
              /=>\s*{/,                      // arrow function
              /\bvar\s+\w+\s*=/,             // var x =
          ],
          [ProgrammingLanguage.TYPESCRIPT]: [
              /:\s*(string|number|boolean|any|void)\b/,  // type annotations
              /\binterface\s+\w+/,           // interface
              /\btype\s+\w+\s*=/,            // type alias
              /<\w+>/,                       // generics
          ],
          [ProgrammingLanguage.JAVA]: [
              /\bpublic\s+(static\s+)?class\s+/,  // public class
              /\bpublic\s+static\s+void\s+main/,  // main method
              /\bSystem\.out\.print/,        // System.out.print
              /\bprivate\s+\w+\s+\w+;/,      // private type name;
              /\bnew\s+\w+\s*\(/,            // new ClassName(
          ],
          [ProgrammingLanguage.CPP]: [
              /#include\s*<\w+>/,            // #include <header>
              /\bstd::/,                     // std::
              /\bcout\s*<</,                 // cout <<
              /\bcin\s*>>/,                  // cin >>
              /\busing\s+namespace\s+std/,   // using namespace std
              /\bint\s+main\s*\(\s*\)/,      // int main()
          ],
      };
      
      const scores: Record<ProgrammingLanguage, number> = {
          [ProgrammingLanguage.PYTHON]: 0,
          [ProgrammingLanguage.JAVASCRIPT]: 0,
          [ProgrammingLanguage.TYPESCRIPT]: 0,
          [ProgrammingLanguage.JAVA]: 0,
          [ProgrammingLanguage.CPP]: 0,
      };
      
      for (const [lang, langPatterns] of Object.entries(patterns)) {
          for (const pattern of langPatterns) {
              if (pattern.test(code)) {
                  scores[lang as ProgrammingLanguage]++;
              }
          }
      }
      
      // TypeScript inherits from JavaScript patterns
      if (scores[ProgrammingLanguage.TYPESCRIPT] > 0) {
          scores[ProgrammingLanguage.TYPESCRIPT] += scores[ProgrammingLanguage.JAVASCRIPT];
      }
      
      // Find the language with highest score
      let maxScore = 0;
      let detectedLang: ProgrammingLanguage | null = null;
      
      for (const [lang, score] of Object.entries(scores)) {
          if (score > maxScore) {
              maxScore = score;
              detectedLang = lang as ProgrammingLanguage;
          }
      }
      
      // Only return if we have a confident match (at least 2 patterns)
      return maxScore >= 2 ? detectedLang : null;
  };
  
  // Basic syntax validation helper
  const validateCodeSyntax = (code: string, lang: ProgrammingLanguage): string[] => {
      const errors: string[] = [];
      const lines = code.split('\n');
      
      // Basic bracket matching
      const openBrackets = (code.match(/[\{\[\(]/g) || []).length;
      const closeBrackets = (code.match(/[\}\]\)]/g) || []).length;
      if (openBrackets !== closeBrackets) {
          errors.push(`Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`);
      }
      
      // Language-specific checks
      if (lang === ProgrammingLanguage.PYTHON) {
          lines.forEach((line, idx) => {
              if (line.trim().endsWith(':') && idx < lines.length - 1) {
                  const nextLine = lines[idx + 1];
                  if (nextLine.trim() && !nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
                      errors.push(`Line ${idx + 2}: Expected indentation after ':' on line ${idx + 1}`);
                  }
              }
          });
      }
      
      return errors;
  };

  const handleGenerateSyllabus = async () => {
      showInput(
          'Generate Study Plan',
          'Enter a topic to generate an AI-powered study plan:',
          "e.g., 'Mastering Rust', 'Data Structures'",
          async (topic) => {
              const content = await generateSyllabusContent(topic);
              const newFile: StudyFile = {
                  id: Date.now().toString(),
                  name: `Plan: ${topic}`,
                  type: 'virtual/markdown',
                  size: 'AI',
                  content: content,
                  uploadDate: new Date(),
                  isVirtual: true
              };
              setFiles(prev => [...prev, newFile]);
              showNotification("AI Study Plan generated! You can now ask questions based on it.", 'success');
              setInputModal(null);
          }
      );
  };

  const handleDownloadProject = () => {
      const projectContent = `
# TILA AI Notebook Export
Date: ${new Date().toLocaleDateString()}

## Files
${files.map(f => `### ${f.name}\n${f.content}\n`).join('\n---\n')}

## Chat History
${messages.map(m => `**${m.role.toUpperCase()}**: ${m.text}`).join('\n\n')}

## Code Snippets
${snippets.map(s => `### ${s.title}\n\`\`\`${s.language}\n${s.code}\n\`\`\`\n`).join('\n')}

## Current Workspace Code
\`\`\`${language}
${code}
\`\`\`
      `;

      const blob = new Blob([projectContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tila-ai-notebook-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const streamCodeToEditor = (codeSnippet: string) => {
      let index = 0;
      const interval = setInterval(() => {
          if (index < codeSnippet.length) {
              setCode(prev => prev + codeSnippet.charAt(index));
              index++;
          } else {
              clearInterval(interval);
          }
      }, 30); // Typewriter speed (30ms per char)
  };

  // Chat History Management
  const createNewChat = () => {
      const newChatId = Date.now().toString();
      const newChat = {
          id: newChatId,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
      };
      setChatSessions(prev => [newChat, ...prev]);
      setActiveChatId(newChatId);
      setMessages([]);
      showNotification('New chat session created', 'info');
  };
  
  const switchChat = async (chatId: string) => {
      // Save current chat before switching (only if it's a valid MongoDB ObjectId)
      const isValidMongoId = (id: string) => /^[a-f\d]{24}$/i.test(id);
      
      if (activeChatId && messages.length > 0 && !isGuestMode && user && isValidMongoId(activeChatId)) {
          try {
              await apiService.updateChatHistory(activeChatId, messages);
          } catch (error) {
              console.error('Failed to save current chat:', error);
          }
      }
      
      const chat = chatSessions.find(c => c.id === chatId);
      if (chat) {
          setActiveChatId(chatId);
          setMessages(chat.messages || []);
      }
  };
  
  const deleteChatSession = async (chatId: string) => {
      setConfirmModal({
          title: 'Delete Chat Session',
          message: 'Are you sure you want to delete this chat session? This action cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          isDanger: true,
          onConfirm: async () => {
              // Remove from local state
              setChatSessions(prev => prev.filter(c => c.id !== chatId));
              
              // If this was the active chat, clear it
              if (activeChatId === chatId) {
                  setActiveChatId(null);
                  setMessages([]);
              }
              
              // Delete from backend if authenticated
              const isValidMongoId = (id: string) => /^[a-f\d]{24}$/i.test(id);
              if (!isGuestMode && user && isValidMongoId(chatId)) {
                  try {
                      await apiService.deleteChatHistory(chatId);
                      showNotification('Chat session deleted', 'success');
                  } catch (error) {
                      console.error('Failed to delete chat from server:', error);
                      showNotification('Chat deleted locally', 'info');
                  }
              } else {
                  showNotification('Chat session deleted', 'success');
              }
              
              setConfirmModal(null);
          },
          onCancel: () => setConfirmModal(null)
      });
  };
  
  const renameChatSession = async (chatId: string, newTitle: string) => {
      // Update local state
      setChatSessions(prev => prev.map(c => 
          c.id === chatId ? { ...c, title: newTitle, updatedAt: new Date() } : c
      ));
      
      // Update on backend if authenticated
      const isValidMongoId = (id: string) => /^[a-f\d]{24}$/i.test(id);
      if (!isGuestMode && user && isValidMongoId(chatId)) {
          try {
              await apiService.updateChatHistory(chatId, undefined, newTitle);
          } catch (error) {
              console.error('Failed to rename chat on server:', error);
          }
      }
      
      showNotification('Chat renamed', 'success');
  };
  
  const loadChatHistory = async () => {
      if (!isGuestMode && user) {
          try {
              const histories = await apiService.getChatHistories();
              const loadedSessions = histories.map((h: any) => ({
                  id: h._id,
                  title: h.title || 'Untitled Chat',
                  messages: h.messages || [],
                  createdAt: new Date(h.createdAt),
                  updatedAt: new Date(h.updatedAt)
              }));
              setChatSessions(loadedSessions);
              
              // If no active chat and we have sessions, activate the most recent one
              if (!activeChatId && loadedSessions.length > 0) {
                  const mostRecent = loadedSessions[0];
                  setActiveChatId(mostRecent.id);
                  setMessages(mostRecent.messages || []);
              }
          } catch (error) {
              console.error('Failed to load chat history:', error);
              showNotification('Failed to load chat history', 'error');
          }
      }
  };
  
  // Auto-save chat periodically (every 30 seconds if there are unsaved changes)
  // Helper to check if ID is a valid MongoDB ObjectId
  const isValidMongoId = (id: string) => /^[a-f\d]{24}$/i.test(id);
  
  useEffect(() => {
      if (!isGuestMode && user && activeChatId && messages.length > 0 && isValidMongoId(activeChatId)) {
          const autoSaveInterval = setInterval(async () => {
              try {
                  await apiService.updateChatHistory(activeChatId, messages);
                  console.log('Chat auto-saved');
              } catch (error) {
                  console.error('Auto-save failed:', error);
              }
          }, 30000); // 30 seconds
          
          return () => clearInterval(autoSaveInterval);
      }
  }, [isGuestMode, user, activeChatId, messages]);
  
  // Auto-save project periodically (every 60 seconds)
  useEffect(() => {
      if (!isGuestMode && user && activeProjectId && isValidMongoId(activeProjectId)) {
          const projectAutoSaveInterval = setInterval(async () => {
              try {
                  await apiService.updateProject(activeProjectId, {
                      files,
                      messages,
                      code,
                      language,
                      snippets,
                      challenges: userChallenges,
                      roadmaps: userRoadmaps,
                      lastEdited: new Date()
                  });
                  console.log('Project auto-saved');
              } catch (error) {
                  console.error('Project auto-save failed:', error);
              }
          }, 60000); // 60 seconds
          
          return () => clearInterval(projectAutoSaveInterval);
      }
  }, [isGuestMode, user, activeProjectId, files, messages, code, language, snippets, userChallenges, userRoadmaps]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text: textToSend, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateDevResponse(textToSend, mode, explanationStyle, code, language, files);
      
      const codeBlockRegex = /```[\s\S]*?```/g;
      const codeMatches = response.text.match(codeBlockRegex);
      
      let codeToStream = "";

      if (codeMatches) {
          const rawBlock = codeMatches[0];
          const lines = rawBlock.split('\n');
          if (lines.length > 2) {
            codeToStream = lines.slice(1, -1).join('\n');
          }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: response.text,
        timestamp: new Date()
      };
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      
      // Generate chat title from first message
      const chatTitle = updatedMessages[0]?.text?.substring(0, 50) || textToSend.substring(0, 50) || 'Chat Session';
      
      // Update or create chat session
      if (activeChatId) {
          // Update existing chat session
          setChatSessions(prev => prev.map(chat => 
              chat.id === activeChatId 
              ? { ...chat, messages: finalMessages, updatedAt: new Date(), title: chat.title === 'New Chat' ? chatTitle : chat.title }
              : chat
          ));
          
          // Save to backend if authenticated
          if (!isGuestMode && user) {
              try {
                  await apiService.updateChatHistory(activeChatId, finalMessages);
              } catch (error) {
                  console.error('Failed to update chat history:', error);
              }
          }
      } else {
          // Create new chat session
          const newChatId = Date.now().toString();
          const newChat = {
              id: newChatId,
              title: chatTitle,
              messages: finalMessages,
              createdAt: new Date(),
              updatedAt: new Date()
          };
          
          setChatSessions(prev => [newChat, ...prev]);
          setActiveChatId(newChatId);
          
          // Save to backend if authenticated
          if (!isGuestMode && user) {
              try {
                  const savedChat = await apiService.saveChatHistory(chatTitle, finalMessages);
                  // Update with backend ID
                  if (savedChat._id) {
                      setActiveChatId(savedChat._id);
                      setChatSessions(prev => prev.map(chat => 
                          chat.id === newChatId ? { ...chat, id: savedChat._id } : chat
                      ));
                  }
              } catch (error) {
                  console.error('Failed to save chat history:', error);
              }
          }
      }
      
      // Auto-extract code snippets and save to backend
      if (codeToStream) {
           const snippet = {
               id: Date.now().toString(),
               title: "AI Suggestion",
               code: codeToStream, 
               language: language,
               explanation: response.text.substring(0, 100),
               tags: ['AI-GENERATED'],
               createdAt: new Date()
           };
           setSnippets(prev => [...prev, snippet]);
           
           // Note: Snippets are now saved per-notebook in the project itself via handleSaveSnippet
           // No need to save to global backend - this ensures per-notebook isolation
      }

    } catch (error) {
       console.error(error);
       const errorMsg: Message = {
           id: (Date.now() + 1).toString(),
           role: MessageRole.MODEL,
           text: "Sorry, I encountered an error. Please try again.",
           timestamp: new Date()
       };
       setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate LeetCode-style function stub based on challenge and language
  const generateChallengeStub = (challenge: CodingChallenge, lang: ProgrammingLanguage): string => {
      // Extract function name from title (e.g., "Reverse Linked List" -> "reverseList")
      const funcName = challenge.title
          .split(' ')
          .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('')
          .replace(/[^a-zA-Z0-9]/g, '');
      
      // Try to detect input/output types from description
      const desc = challenge.description.toLowerCase();
      const hasArray = desc.includes('array') || desc.includes('list') || desc.includes('nums');
      const hasLinkedList = desc.includes('linked list') || desc.includes('listnode');
      const hasTree = desc.includes('tree') || desc.includes('treenode');
      const hasString = desc.includes('string');
      const hasMatrix = desc.includes('matrix') || desc.includes('grid');
      
      switch (lang) {
          case ProgrammingLanguage.PYTHON:
              if (hasLinkedList) {
                  return `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def ${funcName}(head: ListNode) -> ListNode:
    """
    ${challenge.description.split('.')[0]}.
    
    Args:
        head: Head of the linked list
    Returns:
        Modified linked list head
    """
    # TODO: Implement your solution
    pass`;
              } else if (hasTree) {
                  return `# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def ${funcName}(root: TreeNode) -> TreeNode:
    """
    ${challenge.description.split('.')[0]}.
    """
    # TODO: Implement your solution
    pass`;
              } else if (hasMatrix) {
                  return `def ${funcName}(matrix: list[list[int]]) -> list[list[int]]:
    """
    ${challenge.description.split('.')[0]}.
    
    Args:
        matrix: 2D grid of integers
    Returns:
        Modified matrix
    """
    # TODO: Implement your solution
    pass`;
              } else if (hasArray) {
                  return `def ${funcName}(nums: list[int]) -> list[int]:
    """
    ${challenge.description.split('.')[0]}.
    
    Args:
        nums: Input array of integers
    Returns:
        Result array
    """
    # TODO: Implement your solution
    pass`;
              } else if (hasString) {
                  return `def ${funcName}(s: str) -> str:
    """
    ${challenge.description.split('.')[0]}.
    
    Args:
        s: Input string
    Returns:
        Result string
    """
    # TODO: Implement your solution
    pass`;
              }
              return `def ${funcName}(input):
    """
    ${challenge.description.split('.')[0]}.
    """
    # TODO: Implement your solution
    pass`;
              
          case ProgrammingLanguage.JAVASCRIPT:
              if (hasLinkedList) {
                  return `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */

/**
 * ${challenge.description.split('.')[0]}.
 * @param {ListNode} head
 * @return {ListNode}
 */
function ${funcName}(head) {
    // TODO: Implement your solution
    
}`;
              } else if (hasArray) {
                  return `/**
 * ${challenge.description.split('.')[0]}.
 * @param {number[]} nums
 * @return {number[]}
 */
function ${funcName}(nums) {
    // TODO: Implement your solution
    
}`;
              } else if (hasString) {
                  return `/**
 * ${challenge.description.split('.')[0]}.
 * @param {string} s
 * @return {string}
 */
function ${funcName}(s) {
    // TODO: Implement your solution
    
}`;
              }
              return `/**
 * ${challenge.description.split('.')[0]}.
 * @param {*} input
 * @return {*}
 */
function ${funcName}(input) {
    // TODO: Implement your solution
    
}`;
              
          case ProgrammingLanguage.TYPESCRIPT:
              if (hasLinkedList) {
                  return `/**
 * Definition for singly-linked list.
 */
class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}

/**
 * ${challenge.description.split('.')[0]}.
 */
function ${funcName}(head: ListNode | null): ListNode | null {
    // TODO: Implement your solution
    
}`;
              } else if (hasArray) {
                  return `/**
 * ${challenge.description.split('.')[0]}.
 */
function ${funcName}(nums: number[]): number[] {
    // TODO: Implement your solution
    
}`;
              }
              return `/**
 * ${challenge.description.split('.')[0]}.
 */
function ${funcName}(input: any): any {
    // TODO: Implement your solution
    
}`;
              
          case ProgrammingLanguage.JAVA:
              if (hasLinkedList) {
                  return `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */

class Solution {
    /**
     * ${challenge.description.split('.')[0]}.
     */
    public ListNode ${funcName}(ListNode head) {
        // TODO: Implement your solution
        
    }
}`;
              } else if (hasArray) {
                  return `class Solution {
    /**
     * ${challenge.description.split('.')[0]}.
     */
    public int[] ${funcName}(int[] nums) {
        // TODO: Implement your solution
        
    }
}`;
              }
              return `class Solution {
    /**
     * ${challenge.description.split('.')[0]}.
     */
    public Object ${funcName}(Object input) {
        // TODO: Implement your solution
        
    }
}`;
              
          case ProgrammingLanguage.CPP:
              if (hasLinkedList) {
                  return `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */

class Solution {
public:
    /**
     * ${challenge.description.split('.')[0]}.
     */
    ListNode* ${funcName}(ListNode* head) {
        // TODO: Implement your solution
        
    }
};`;
              } else if (hasArray) {
                  return `#include <vector>
using namespace std;

class Solution {
public:
    /**
     * ${challenge.description.split('.')[0]}.
     */
    vector<int> ${funcName}(vector<int>& nums) {
        // TODO: Implement your solution
        
    }
};`;
              }
              return `class Solution {
public:
    /**
     * ${challenge.description.split('.')[0]}.
     */
    int ${funcName}(int input) {
        // TODO: Implement your solution
        
    }
};`;
              
          default:
              return challenge.starterCode || '// Write your solution here';
      }
  };

  const loadChallenge = (c: CodingChallenge) => {
      // Clear cache when starting new challenge
      setCodeCache({});
      setCurrentChallenge(c);
      
      // Switch to Function mode for challenges (LeetCode style)
      setExecutionMode(ExecutionMode.FUNCTION);
      
      // Generate proper language-specific function stub
      const challengeCode = generateChallengeStub(c, language);
      
      setCode(challengeCode);
      setViewState(ViewState.IDE);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: MessageRole.MODEL,
          text: `Challenge: ${c.title}\n\n${c.description}\n\n• Function signature only (no implementation)\n• You need to write the logic yourself\n\nWhat I've loaded:\n- "What's the approach for this problem?"\n- "Give me a hint"\n- "Explain the algorithm step by step"\n\nNeed help? Ask me:\n\nDon't ask me to write the code! Try implementing it yourself first. I'm here to guide you through the thinking process.`,
          timestamp: new Date()
      }]);
  };
  
  // Save code snippet
  const handleSaveSnippet = async () => {
      if (!code.trim()) {
          showNotification('No code to save. Write some code first!', 'warning');
          return;
      }
      
      showInput(
          'Save Code Snippet',
          'Enter a name for this code snippet:',
          'e.g., "Binary Search - Optimized"',
          async (name) => {
              showNotification('Generating AI explanation...', 'info');
              
              // Generate AI explanation for the code
              let aiExplanation = '';
              try {
                  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'x-goog-api-key': (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
                      },
                      body: JSON.stringify({
                          contents: [{
                              parts: [{
                                  text: `Analyze this ${language} code and provide a concise explanation (2-3 sentences) of what it does, its purpose, and key concepts used:\n\n${code}`
                              }]
                          }]
                      })
                  });
                  
                  const data = await response.json();
                  aiExplanation = data.candidates?.[0]?.content?.parts?.[0]?.text || `${language} code snippet saved from editor`;
              } catch (error) {
                  console.error('Failed to generate AI explanation:', error);
                  aiExplanation = `${language} code snippet saved from editor on ${new Date().toLocaleString()}`;
              }
              
              const snippet: CodeSnippet = {
                  id: Date.now().toString(),
                  title: name,
                  code: code,
                  language: language,
                  explanation: aiExplanation,
                  tags: [language, currentChallenge?.title || 'custom', activeProjectId || 'notebook'],
                  createdAt: new Date()
              };
              
              // Add to local state first (per-notebook)
              setSnippets(prev => [snippet, ...prev]);
              
              // Immediately update the project to ensure per-notebook isolation
              if (activeProjectId) {
                  setProjects(prev => prev.map(p => 
                      p.id === activeProjectId 
                          ? { ...p, snippets: [snippet, ...(p.snippets || [])], lastEdited: new Date() }
                          : p
                  ));
              }
              
              showNotification('Snippet saved to this notebook!', 'success');
              setInputModal(null);
          }
      );
  };

  const handleDeleteSnippet = async (id: string) => {
      // Remove from local state
      setSnippets(s => s.filter(x => x.id !== id));
      
      // Immediately update the project to ensure per-notebook isolation
      if (activeProjectId) {
          setProjects(prev => prev.map(p => 
              p.id === activeProjectId 
                  ? { ...p, snippets: (p.snippets || []).filter(s => s.id !== id), lastEdited: new Date() }
                  : p
          ));
      }
      
      showNotification('Snippet deleted from this notebook!', 'success');
  };

  const handleAddSnippetFromCommunity = async (snippet: any) => {
      const newSnippet = { ...snippet, id: Date.now().toString(), createdAt: new Date() };
      setSnippets(prev => [newSnippet, ...prev]);
      
      // Immediately update the project to ensure per-notebook isolation
      if (activeProjectId) {
          setProjects(prev => prev.map(p => 
              p.id === activeProjectId 
                  ? { ...p, snippets: [newSnippet, ...(p.snippets || [])], lastEdited: new Date() }
                  : p
          ));
      }
      
      showNotification('Snippet added to this notebook!', 'success');
  };

  const handleGenerateChallengesForNode = async (nodeLabel: string) => {
      try {
          showNotification(`Generating challenges for "${nodeLabel}"...`, 'info');
          const challenges = await generateCodingChallenges(nodeLabel, files);
          
          if (challenges.length > 0) {
              // Add to current notebook's challenges (per-notebook isolation)
              const newChallenges = challenges.map((c: any) => ({
                  ...c,
                  id: c.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
              }));
              
              setUserChallenges(prev => [...prev, ...newChallenges]);
              
              // Update the project with new challenges
              if (activeProjectId) {
                  setProjects(prev => prev.map(p => 
                      p.id === activeProjectId 
                          ? { ...p, challenges: [...((p as any).challenges || []), ...newChallenges], lastEdited: new Date() }
                          : p
                  ));
              }
          }
          
          // Switch to challenges view
          setViewState(ViewState.CHALLENGES);
          
          showNotification(`Generated ${challenges.length} challenges for "${nodeLabel}"!`, 'success');
      } catch (error) {
          console.error('Failed to generate challenges:', error);
          showNotification('Failed to generate challenges. Please try again.', 'error');
      }
  };

  const handleSendToTutor = (nodeLabel: string) => {
      setViewState(ViewState.IDE);
      setInput(`Teach me about ${nodeLabel}. Explain the key concepts step by step.`);
      // Auto-send the message
      setTimeout(() => {
          sendMessage(`Teach me about ${nodeLabel}. Explain the key concepts step by step. Start with the basics. Don't provide complete code implementations, only explain the approach and provide function signatures as examples.`);
      }, 100);
  };

  const handleSaveRoadmap = (roadmap: any) => {
      // Add to current notebook's roadmaps (per-notebook isolation)
      setUserRoadmaps(prev => [...prev, roadmap]);
      
      // Update the project with new roadmap
      if (activeProjectId) {
          setProjects(prev => prev.map(p => 
              p.id === activeProjectId 
                  ? { ...p, roadmaps: [...((p as any).roadmaps || []), roadmap], lastEdited: new Date() }
                  : p
          ));
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: StudyFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const text = await file.text(); 
        newFiles.push({ id: Math.random().toString(36).substr(2, 9), name: file.name, type: file.type, size: (file.size / 1024).toFixed(1) + ' KB', content: text, uploadDate: new Date() });
      }
      setFiles(p => [...p, ...newFiles]);
    }
  };

  // --- RENDER ---

  if (authStage === AuthStage.LANDING) {
      return <LandingPage onStart={() => setAuthStage(AuthStage.LOGIN)} onDemo={handleTestUser} />;
  }

  if (authStage === AuthStage.LOGIN) {
      return <LoginScreen onLogin={handleLogin} onRegister={() => { setAuthStage(AuthStage.REGISTER); setAuthError(''); }} onBack={() => { setAuthStage(AuthStage.LANDING); setAuthError(''); }} error={authError} />;
  }

  if (authStage === AuthStage.REGISTER) {
      return <RegisterScreen onRegister={handleRegister} onLogin={() => { setAuthStage(AuthStage.LOGIN); setAuthError(''); }} onBack={() => { setAuthStage(AuthStage.LANDING); setAuthError(''); }} error={authError} />;
  }

  if (authStage === AuthStage.DASHBOARD_SELECTION && user) {
      return (
        <>
            {showProfile && <UserProfileModal user={user} onClose={() => setShowProfile(false)} isGuestMode={isGuestMode} />}
            <ProjectDashboard 
                projects={projects} 
                onCreateProject={createProject} 
                onSelectProject={selectProject}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
                user={user}
                onShowProfile={() => setShowProfile(true)}
            />
        </>
      );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-black text-white font-sans">
      {/* Notification System */}
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
      
      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal 
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel || (() => setConfirmModal(null))}
          confirmText={confirmModal.confirmText || 'Confirm'}
          cancelText={confirmModal.cancelText || 'Cancel'}
          isDanger={confirmModal.isDanger}
        />
      )}
      
      {/* Input Modal */}
      {inputModal && (
        <InputModal 
          title={inputModal.title}
          message={inputModal.message}
          placeholder={inputModal.placeholder}
          onSubmit={inputModal.onSubmit}
          onCancel={() => setInputModal(null)}
        />
      )}
      

      
      {/* High Z-Index for Profile Modal to overlay everything */}
      {showProfile && user && <UserProfileModal user={user} onClose={() => setShowProfile(false)} isGuestMode={isGuestMode} />}
      
      <Sidebar 
          files={files} 
          onUpload={handleFileUpload} 
          onRemoveFile={(id) => setFiles(f => f.filter(x => x.id !== id))} 
          viewState={viewState} 
          setViewState={setViewState} 
          user={user} 
          onLogout={handleLogout} 
          onGenerateSyllabus={handleGenerateSyllabus}
          onShowProfile={() => setShowProfile(true)}
          onBackToDashboard={handleBackToDashboard}
          onDownloadProject={handleDownloadProject}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

        {viewState === ViewState.IDE && (
          <ChatArea 
            messages={messages} 
            isListening={isListening} 
            toggleListening={handleVoiceInput} 
            input={input} 
            setInput={setInput} 
            sendMessage={sendMessage} 
            isLoading={isLoading} 
            mode={mode} 
            setMode={setMode} 
            explanationStyle={explanationStyle} 
            setExplanationStyle={setExplanationStyle}
            code={code} 
            setCode={setCode} 
            language={language} 
            setLanguage={setLanguage} 
            runCode={handleRunCode} 
            editorOutput={editorOutput} 
            isRunningCode={isRunningCode}
            callStatus={callStatus} 
            toggleCall={toggleCall}
            executionMode={executionMode} 
            setExecutionMode={setExecutionMode}
            onLanguageChange={handleLanguageChange}
            onSaveSnippet={handleSaveSnippet}
            onChallengeComplete={handleChallengeComplete}
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            onNewChat={createNewChat}
            onSwitchChat={switchChat}
            showChatHistory={showChatHistory}
            onToggleChatHistory={() => setShowChatHistory(!showChatHistory)}
            onDeleteMessage={(messageId) => setMessages(prev => prev.filter(m => m.id !== messageId))}
            onDeleteChat={deleteChatSession}
            onRenameChat={renameChatSession}
          />
        )}
        {viewState === ViewState.CHALLENGES && <ChallengesView files={files} onXPChange={() => {}} onLoadChallenge={loadChallenge} isGuestMode={isGuestMode} userChallenges={userChallenges} onRefresh={() => {/* Per-notebook isolation: no global refresh */}} onShowNotification={showNotification} />}
        {viewState === ViewState.ROADMAP && <RoadmapView files={files} isGuestMode={isGuestMode} onGenerateChallengesForNode={handleGenerateChallengesForNode} onSendToTutor={handleSendToTutor} userRoadmaps={userRoadmaps} onRefresh={() => {/* Per-notebook isolation: no global refresh */}} onShowNotification={showNotification} onSaveRoadmap={handleSaveRoadmap} />}
        {viewState === ViewState.SNIPPETS && <SnippetsLibrary snippets={snippets} onDelete={handleDeleteSnippet} onAddToEditor={(snippet) => { setCode(snippet.code); setLanguage(snippet.language); setViewState(ViewState.IDE); showNotification('Code loaded into editor', 'success'); }} onAskTutor={(snippet) => { setViewState(ViewState.IDE); setInput(`Explain this ${snippet.language} code:\n\n${snippet.code}`); }} onGenerateChallenges={(snippet) => { handleGenerateChallengesForNode(snippet.title || 'Code Snippet'); }} />}
        {viewState === ViewState.COMMUNITY && <CommunityView user={user} isGuestMode={isGuestMode} onShowNotification={showNotification} onAddSnippet={handleAddSnippetFromCommunity} />}
      </main>
    </div>
  );
}