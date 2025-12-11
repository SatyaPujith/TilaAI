import React, { useState, useEffect } from 'react';
import { Terminal, MessageSquare, Code, Trophy, Map, Users, Play, Send, Heart, GitFork, Check, Sparkles, Zap, FileText, RotateCcw, ShieldCheck, Wand2 } from 'lucide-react';

interface LandingPageProps {
    onStart: () => void;
    onDemo: () => void;
}

// Animation step definitions
const DEMO_STEPS = [
    { id: 'intro', duration: 2000, label: 'Welcome to TILA AI' },
    { id: 'tutor-click', duration: 1200, label: 'AI Tutor' },
    { id: 'tutor-input-click', duration: 800, label: 'Click Input' },
    { id: 'tutor-type', duration: 2500, label: 'Ask Questions' },
    { id: 'tutor-send-click', duration: 1000, label: 'Send Message' },
    { id: 'tutor-response', duration: 2500, label: 'Get Explanations' },
    { id: 'editor-click', duration: 1200, label: 'Code Editor' },
    { id: 'editor-code', duration: 1500, label: 'Write Code' },
    { id: 'editor-lang-click', duration: 1200, label: 'Language Selector' },
    { id: 'editor-lang-select', duration: 1500, label: 'Convert to JS' },
    { id: 'editor-optimize', duration: 2000, label: 'AI Optimize' },
    { id: 'editor-run', duration: 2000, label: 'Run Code' },
    { id: 'challenges-click', duration: 1200, label: 'Challenges' },
    { id: 'challenges-show', duration: 2500, label: 'Practice Problems' },
    { id: 'roadmap-click', duration: 1200, label: 'Roadmaps' },
    { id: 'roadmap-show', duration: 2500, label: 'Learning Paths' },
    { id: 'community-click', duration: 1200, label: 'Community' },
    { id: 'community-show', duration: 1500, label: 'Browse Posts' },
    { id: 'community-fork', duration: 2000, label: 'Fork Code' },
];

const PYTHON_CODE = `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`;

const JS_CODE = `function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`;

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onDemo }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
    const [isClicking, setIsClicking] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [showResponse, setShowResponse] = useState(false);
    const [activeTab, setActiveTab] = useState<'tutor' | 'editor' | 'challenges' | 'roadmap' | 'community'>('tutor');
    const [currentLang, setCurrentLang] = useState('Python');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [showOptimize, setShowOptimize] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showForkSuccess, setShowForkSuccess] = useState(false);

    // Ensure component is mounted before starting animations
    useEffect(() => {
        // Small delay to ensure browser has painted
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
        }, 100);
        return () => clearTimeout(mountTimer);
    }, []);

    // Main animation loop - only start after mounted
    useEffect(() => {
        if (!isMounted || isPaused) return;
        
        const step = DEMO_STEPS[currentStep];
        
        const timer = setTimeout(() => {
            setCurrentStep((prev) => (prev + 1) % DEMO_STEPS.length);
        }, step.duration);

        return () => clearTimeout(timer);
    }, [currentStep, isPaused, isMounted]);

    // Handle step changes
    useEffect(() => {
        const step = DEMO_STEPS[currentStep];
        
        // Reset states on new cycle
        if (step.id === 'intro') {
            setTypedText('');
            setShowResponse(false);
            setActiveTab('tutor');
            setCurrentLang('Python');
            setShowLangDropdown(false);
            setIsConverting(false);
            setShowOptimize(false);
            setShowOutput(false);
            setShowForkSuccess(false);
        }

        // Cursor positions - calculated based on actual UI layout
        // Preview container is max-w-5xl (1024px), sidebar is w-14 (56px)
        // Content area starts at x=56, toolbar height ~40px
        // Chat panel is half width when tutor active (~484px), input at bottom
        
        switch (step.id) {
            case 'tutor-click':
                // Sidebar icon 1 (Tutor): x=28 (center of 56px), y=32 (12px padding + 20px half icon)
                setCursorPos({ x: 28, y: 32 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setActiveTab('tutor'), 600);
                break;
                
            case 'tutor-input-click':
                // Chat panel width is ~half (400px), input at bottom
                // Input field center: sidebar(56) + chat_width/2(200) = 256
                setCursorPos({ x: 256, y: 352 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 300);
                break;
                
            case 'tutor-type':
                // Stay on input field while typing
                setCursorPos({ x: 256, y: 352 });
                const text = "How do I implement binary search?";
                let i = 0;
                const typeInterval = setInterval(() => {
                    if (i < text.length) {
                        setTypedText(text.substring(0, i + 1));
                        i++;
                    } else {
                        clearInterval(typeInterval);
                    }
                }, 70);
                return () => clearInterval(typeInterval);
                
            case 'tutor-send-click':
                // Send button icon - exact position at right of input
                setCursorPos({ x: 520, y: 352 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setShowResponse(true), 600);
                break;
                
            case 'tutor-response':
                // Move cursor to response area
                setCursorPos({ x: 280, y: 200 });
                break;
                
            case 'editor-click':
                // Sidebar icon 2 (Editor): y = 32 + 48 = 80
                setCursorPos({ x: 28, y: 80 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setActiveTab('editor'), 600);
                break;
                
            case 'editor-code':
                // Move to code area (middle of editor)
                setCursorPos({ x: 400, y: 180 });
                break;
                
            case 'editor-lang-click':
                // Language dropdown button in editor toolbar (right side)
                // IDE content is 380px height, toolbar is at top
                // Sidebar is 56px, editor area fills the rest
                // Toolbar layout (right to left): RUN(~50px) | divider | AI tools(~90px) | Lang dropdown(~60px)
                // From right edge: 50 + 8 + 90 + 30 = ~178px from right
                // Editor area width after sidebar: ~968px, so dropdown center: 56 + 968 - 178 = ~846px
                // But cursor is relative to the IDE container, so: 846 - some offset
                // Adjusted to point at the dropdown button center
                setCursorPos({ x: 830, y: 22 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setShowLangDropdown(true), 600);
                break;
                
            case 'editor-lang-select':
                // Click JavaScript option in dropdown
                // Dropdown appears below the button, aligned to right edge
                // JavaScript is the second option in the list (after Python)
                // Toolbar height ~36px, dropdown margin ~4px, Python option ~20px, JS option center ~10px
                // Total y: 36 + 4 + 20 + 10 = ~70px
                setCursorPos({ x: 830, y: 75 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => {
                    setShowLangDropdown(false);
                    setIsConverting(true);
                    setTimeout(() => {
                        setCurrentLang('JavaScript');
                        setIsConverting(false);
                    }, 800);
                }, 600);
                break;
                
            case 'editor-optimize':
                // Optimize button (Zap icon) - center of button
                setCursorPos({ x: 862, y: 18 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setShowOptimize(true), 600);
                setTimeout(() => setShowOptimize(false), 1800);
                break;
                
            case 'editor-run':
                // RUN button - center of button
                setCursorPos({ x: 950, y: 18 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setShowOutput(true), 600);
                break;
                
            case 'challenges-click':
                // Sidebar icon 3 (Challenges): y = 80 + 48 = 128
                setCursorPos({ x: 28, y: 128 });
                setShowOutput(false);
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setActiveTab('challenges'), 600);
                break;
                
            case 'challenges-show':
                // Move to first challenge "Solve" button - exact center
                setCursorPos({ x: 650, y: 108 });
                break;
                
            case 'roadmap-click':
                // Sidebar icon 4 (Roadmap): y = 128 + 48 = 176
                setCursorPos({ x: 28, y: 176 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setActiveTab('roadmap'), 600);
                break;
                
            case 'roadmap-show':
                // Move to "Learn" button on current node (Binary Search)
                setCursorPos({ x: 650, y: 165 });
                break;
                
            case 'community-click':
                // Sidebar icon 5 (Community): y = 176 + 48 = 224
                setCursorPos({ x: 28, y: 224 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setActiveTab('community'), 600);
                break;
            case 'community-show':
                // Move to first post
                setCursorPos({ x: 400, y: 140 });
                break;
                
            case 'community-fork':
                // Click fork icon on first post
                setCursorPos({ x: 720, y: 140 });
                setTimeout(() => { setIsClicking(true); setTimeout(() => setIsClicking(false), 200); }, 400);
                setTimeout(() => setShowForkSuccess(true), 600);
                setTimeout(() => setShowForkSuccess(false), 1800);
                break;
        }
    }, [currentStep]);

    const currentStepData = DEMO_STEPS[currentStep];

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
                            <Terminal className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tight">TILA AI</span>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button onClick={onStart} className="text-[11px] font-bold text-zinc-400 hover:text-white uppercase tracking-wide px-3 py-1.5">Sign In</button>
                        <button onClick={onDemo} className="text-[11px] font-bold text-white bg-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-500 shadow-lg shadow-violet-900/30 transition-all uppercase tracking-wide">
                            Try Free
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="pt-20 px-6 max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 mb-4">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold uppercase text-violet-400">Live Demo</span>
                        <span className="text-[10px] text-zinc-500">• {currentStepData.label}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
                        Your AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Coding Companion</span>
                    </h1>
                    <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                        Watch how TILA AI helps you learn algorithms, write better code, and master programming.
                    </p>
                </div>

                {/* IDE Preview Container */}
                <div 
                    className="max-w-5xl mx-auto mb-8"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-violet-900/20 overflow-hidden">
                        {/* Window Header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-[10px] text-zinc-500 ml-2">TILA AI — {currentLang === 'Python' ? 'main.py' : 'main.js'}</span>
                            </div>
                        </div>

                        {/* IDE Content */}
                        <div className="flex h-[380px] relative">
                            {/* Animated Cursor */}
                            <div 
                                className={`absolute pointer-events-none z-50 transition-all duration-700 ease-out ${isClicking ? 'scale-90' : 'scale-100'}`}
                                style={{ left: cursorPos.x, top: cursorPos.y, transform: 'translate(-50%, -50%)' }}
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                                    <path fill="currentColor" d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 4.702z"/>
                                </svg>
                                {isClicking && (
                                    <div className="absolute top-0 left-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/30 animate-ping"></div>
                                )}
                            </div>

                            {/* Sidebar - Exact match to app */}
                            <div className="w-14 bg-zinc-900/50 border-r border-zinc-800 flex flex-col items-center py-3 gap-2">
                                {[
                                    { id: 'tutor', icon: MessageSquare, label: 'Tutor' },
                                    { id: 'editor', icon: Code, label: 'Editor' },
                                    { id: 'challenges', icon: Trophy, label: 'Challenges' },
                                    { id: 'roadmap', icon: Map, label: 'Roadmap' },
                                    { id: 'community', icon: Users, label: 'Community' },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <div 
                                            key={item.id}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-violet-600 text-white' 
                                                    : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* AI Tutor View */}
                                {activeTab === 'tutor' && (
                                    <div className="flex-1 flex animate-fadeIn">
                                        {/* Chat Panel */}
                                        <div className="w-1/2 flex flex-col border-r border-zinc-800">
                                            <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
                                                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                                                </div>
                                                <span className="text-xs font-bold text-white">AI Tutor</span>
                                                <span className="ml-auto px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-bold">ONLINE</span>
                                            </div>
                                            <div className="flex-1 p-3 overflow-y-auto">
                                                {typedText && (
                                                    <div className="flex justify-end mb-3">
                                                        <div className="bg-violet-600 rounded-xl rounded-br-sm px-3 py-2 max-w-[85%]">
                                                            <p className="text-xs">{typedText}<span className="animate-pulse">|</span></p>
                                                        </div>
                                                    </div>
                                                )}
                                                {showResponse && (
                                                    <div className="flex justify-start animate-fadeIn">
                                                        <div className="bg-zinc-800 rounded-xl rounded-bl-sm px-3 py-2 max-w-[90%]">
                                                            <p className="text-xs text-zinc-300 mb-2">
                                                                <span className="text-violet-400 font-bold">Binary Search</span> is an efficient O(log n) algorithm that works on sorted arrays.
                                                            </p>
                                                            <p className="text-[10px] text-zinc-500">## Approach</p>
                                                            <p className="text-[10px] text-zinc-400">1. Find middle element</p>
                                                            <p className="text-[10px] text-zinc-400">2. Compare with target</p>
                                                            <p className="text-[10px] text-zinc-400">3. Eliminate half each time</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-zinc-800">
                                                <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5">
                                                    <input className="flex-1 bg-transparent text-[10px] text-zinc-400 outline-none" placeholder="Ask anything about code..." readOnly value={typedText} />
                                                    <Send className="w-3.5 h-3.5 text-violet-500" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Code Preview */}
                                        <div className="flex-1 flex flex-col bg-black/30">
                                            <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
                                                <FileText className="w-3 h-3 text-zinc-500" />
                                                <span className="text-[10px] text-zinc-400">main.py</span>
                                            </div>
                                            <div className="flex-1 p-3 font-mono text-[10px] text-zinc-500 overflow-hidden">
                                                <pre className="leading-relaxed">{PYTHON_CODE}</pre>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Editor View */}
                                {activeTab === 'editor' && (
                                    <div className="flex-1 flex flex-col animate-fadeIn">
                                        {/* Editor Toolbar */}
                                        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                                <span className="text-[10px] text-zinc-400">{currentLang === 'Python' ? 'main.py' : 'main.js'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {/* Language Selector */}
                                                <div className="relative">
                                                    <button className={`px-2 py-1 rounded text-[9px] font-bold uppercase flex items-center gap-1 transition-all ${showLangDropdown ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                                                        {currentLang}
                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </button>
                                                    {showLangDropdown && (
                                                        <div className="absolute top-full mt-1 right-0 bg-zinc-800 border border-zinc-700 rounded-lg py-1 z-10 animate-fadeIn">
                                                            <div className="px-3 py-1 text-[9px] text-zinc-400 hover:bg-zinc-700 cursor-pointer">Python</div>
                                                            <div className="px-3 py-1 text-[9px] text-violet-400 bg-violet-500/10 cursor-pointer">JavaScript</div>
                                                            <div className="px-3 py-1 text-[9px] text-zinc-400 hover:bg-zinc-700 cursor-pointer">TypeScript</div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* AI Tools */}
                                                <button className={`p-1.5 rounded text-zinc-500 hover:text-white transition-all ${showOptimize ? 'bg-violet-600 text-white' : 'hover:bg-zinc-800'}`}>
                                                    <Zap className="w-3 h-3" />
                                                </button>
                                                <button className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                                                    <ShieldCheck className="w-3 h-3" />
                                                </button>
                                                <button className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                                                    <Wand2 className="w-3 h-3" />
                                                </button>
                                                <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                                                <button className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${showOutput ? 'bg-green-600 text-white' : 'bg-violet-600 text-white hover:bg-violet-500'}`}>
                                                    <Play className="w-2.5 h-2.5 fill-current" /> RUN
                                                </button>
                                            </div>
                                        </div>
                                        {/* Code Area */}
                                        <div className="flex-1 flex overflow-hidden relative">
                                            {isConverting && (
                                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 animate-fadeIn">
                                                    <div className="flex items-center gap-2 text-violet-400">
                                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                                        <span className="text-xs font-bold">Converting to JavaScript...</span>
                                                    </div>
                                                </div>
                                            )}
                                            {showOptimize && (
                                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 animate-fadeIn">
                                                    <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-4 max-w-xs">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Zap className="w-4 h-4 text-violet-400" />
                                                            <span className="text-xs font-bold text-white">AI Optimization</span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-400">✓ Code is already optimal</p>
                                                        <p className="text-[10px] text-green-400">Time: O(log n) | Space: O(1)</p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 p-3 font-mono text-[10px] overflow-auto">
                                                <pre className="text-zinc-300 leading-relaxed">
                                                    {(currentLang === 'Python' ? PYTHON_CODE : JS_CODE).split('\n').map((line, i) => (
                                                        <div key={i} className="flex hover:bg-zinc-800/30">
                                                            <span className="w-6 text-zinc-600 select-none text-right pr-3">{i + 1}</span>
                                                            <span>{line}</span>
                                                        </div>
                                                    ))}
                                                </pre>
                                            </div>
                                        </div>
                                        {/* Output Panel */}
                                        {showOutput && (
                                            <div className="border-t border-zinc-800 p-2 bg-black/50 animate-fadeIn">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Terminal className="w-3 h-3 text-green-500" />
                                                    <span className="text-[9px] font-bold text-green-500 uppercase">Output</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 font-mono">{'>'} binary_search([1,2,3,4,5], 3) = 2</p>
                                                <p className="text-[10px] text-green-400 font-mono">✓ Time: O(log n) | Space: O(1)</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Challenges View */}
                                {activeTab === 'challenges' && (
                                    <div className="flex-1 p-4 animate-fadeIn overflow-auto">
                                        <div className="max-w-2xl mx-auto">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                                    <Trophy className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white">Coding Challenges</h3>
                                                    <p className="text-[10px] text-zinc-500">AI-generated problems to practice</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {[
                                                    { title: 'Two Sum', diff: 'Easy', color: 'green' },
                                                    { title: 'Binary Search', diff: 'Easy', color: 'green' },
                                                    { title: 'Merge Intervals', diff: 'Medium', color: 'amber' },
                                                    { title: 'LRU Cache', diff: 'Hard', color: 'red' },
                                                ].map((c, i) => (
                                                    <div key={c.title} className={`p-3 rounded-xl border transition-all ${i === 0 ? 'bg-violet-500/10 border-violet-500/30' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-white">{c.title}</span>
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold bg-${c.color}-500/20 text-${c.color}-400`}>
                                                                    {c.diff}
                                                                </span>
                                                            </div>
                                                            <button className="px-2 py-1 rounded text-[9px] font-bold uppercase bg-zinc-800 text-zinc-400 hover:text-white transition-all">
                                                                Solve
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Roadmap View */}
                                {activeTab === 'roadmap' && (
                                    <div className="flex-1 p-4 animate-fadeIn overflow-auto">
                                        <div className="max-w-2xl mx-auto">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                    <Map className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white">Learning Roadmap</h3>
                                                    <p className="text-[10px] text-zinc-500">Data Structures & Algorithms</p>
                                                </div>
                                            </div>
                                            <div className="relative pl-6">
                                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-zinc-800"></div>
                                                {[
                                                    { label: 'Arrays & Strings', status: 'done' },
                                                    { label: 'Two Pointers', status: 'done' },
                                                    { label: 'Binary Search', status: 'current' },
                                                    { label: 'Sliding Window', status: 'locked' },
                                                    { label: 'Trees & Graphs', status: 'locked' },
                                                    { label: 'Dynamic Programming', status: 'locked' },
                                                ].map((node, i) => (
                                                    <div key={node.label} className="relative flex items-center gap-3 mb-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                            node.status === 'done' ? 'bg-green-500 border-green-500' :
                                                            node.status === 'current' ? 'bg-violet-600 border-violet-600' :
                                                            'bg-zinc-800 border-zinc-600'
                                                        }`}>
                                                            {node.status === 'done' && <Check className="w-2.5 h-2.5 text-white" />}
                                                            {node.status === 'current' && <span className="text-[8px] font-bold text-white">{i + 1}</span>}
                                                        </div>
                                                        <div className={`flex-1 p-2 rounded-lg ${node.status === 'current' ? 'bg-violet-500/10 border border-violet-500/30' : ''}`}>
                                                            <span className={`text-xs ${node.status === 'locked' ? 'text-zinc-500' : 'text-white'}`}>{node.label}</span>
                                                        </div>
                                                        {node.status === 'current' && (
                                                            <button className="px-2 py-1 rounded text-[9px] font-bold uppercase bg-violet-600 text-white">
                                                                Learn
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Community View */}
                                {activeTab === 'community' && (
                                    <div className="flex-1 p-4 animate-fadeIn overflow-auto relative">
                                        {/* Fork Success Notification */}
                                        {showForkSuccess && (
                                            <div className="absolute top-4 right-4 z-10 animate-fadeIn">
                                                <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                                                    <Check className="w-4 h-4" />
                                                    <span className="text-xs font-bold">Forked successfully!</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="max-w-2xl mx-auto">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-pink-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-white">Community</h3>
                                                        <p className="text-[10px] text-zinc-500">Share & learn from others</p>
                                                    </div>
                                                </div>
                                                <button className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase bg-violet-600 text-white flex items-center gap-1">
                                                    <span>+</span> Share Code
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {[
                                                    { title: 'Optimized Quick Sort', author: 'alex_dev', likes: 24, forks: showForkSuccess ? 9 : 8, lang: 'Python' },
                                                    { title: 'DP Fibonacci', author: 'coder123', likes: 18, forks: 5, lang: 'JavaScript' },
                                                    { title: 'Graph BFS/DFS', author: 'algo_master', likes: 31, forks: 12, lang: 'Python' },
                                                ].map((post, idx) => (
                                                    <div key={post.title} className={`p-3 rounded-xl bg-zinc-900/50 border transition-all cursor-pointer ${idx === 0 && showForkSuccess ? 'border-green-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}>
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <span className="text-xs font-bold text-white">{post.title}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[9px] text-zinc-500">by {post.author}</span>
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{post.lang}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-zinc-500">
                                                                <span className="flex items-center gap-1 text-[10px]">
                                                                    <Heart className="w-3 h-3" /> {post.likes}
                                                                </span>
                                                                <span className={`flex items-center gap-1 text-[10px] ${idx === 0 && showForkSuccess ? 'text-green-400' : ''}`}>
                                                                    <GitFork className="w-3 h-3" /> {post.forks}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Timeline */}
                <div className="max-w-3xl mx-auto mb-8">
                    <div className="flex items-center justify-between text-[9px] text-zinc-600 mb-2 px-4">
                        <span>Tutor</span>
                        <span>Editor</span>
                        <span>Challenges</span>
                        <span>Roadmap</span>
                        <span>Community</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500 rounded-full"
                            style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center pb-12">
                    <div className="flex justify-center gap-3 mb-4">
                        <button onClick={onStart} className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/30 transition-all">
                            <Sparkles className="w-3.5 h-3.5" /> Get Started Free
                        </button>
                        <button onClick={onDemo} className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all">
                            <Play className="w-3.5 h-3.5" /> Try Demo
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600">No credit card required • Free tier available</p>
                </div>
            </div>

            {/* CSS */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
