import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Zap, ShieldAlert, FileText, FlaskConical, Sparkles, Split, X, Plus, Maximize2, Minimize2, GripHorizontal, Box, Layers, Save, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import { ProgrammingLanguage, EditorTab, ExecutionMode } from '../types';
import { optimizeCode, deepScanCode, generateDocumentation, generateUnitTests, completeCode } from '../services/geminiService';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface CodeEditorProps {
  code: string;
  setCode: (c: string) => void;
  language: ProgrammingLanguage;
  setLanguage: (l: ProgrammingLanguage) => void;
  onRun: (testCases?: TestCase[]) => void;
  output: string;
  isRunning: boolean;
  executionMode: ExecutionMode;
  setExecutionMode: (m: ExecutionMode) => void;
  onLanguageChange?: (lang: ProgrammingLanguage) => void;
  onSaveSnippet?: () => void;
  onChallengeComplete?: () => void;
  fileName?: string;
  onFileNameChange?: (name: string) => void;
}

const BOILERPLATES: Record<ProgrammingLanguage, Record<ExecutionMode, string>> = {
    [ProgrammingLanguage.PYTHON]: {
        [ExecutionMode.SCRIPT]: `# Main Entry Point
def main():
    print("Hello from TILA AI Python!")
    # Write your code here

if __name__ == "__main__":
    main()`,
        [ExecutionMode.FUNCTION]: `def solution(arr):
    """
    Write your algorithm here
    Args:
        arr: Input array
    Returns:
        Processed result
    """
    # TODO: Implement your solution
    return sorted(arr)`
    },
    [ProgrammingLanguage.JAVASCRIPT]: {
        [ExecutionMode.SCRIPT]: `// Main Script Entry Point
function main() {
    console.log("Hello from TILA AI JS!");
    // Write your code here
}

main();`,
        [ExecutionMode.FUNCTION]: `/**
 * Write your algorithm here
 * @param {Array} arr - Input array
 * @returns {Array} - Processed result
 */
function solution(arr) {
    // TODO: Implement your solution
    return arr.sort((a, b) => a - b);
}`
    },
    [ProgrammingLanguage.TYPESCRIPT]: {
        [ExecutionMode.SCRIPT]: `// Main Script Entry Point
const main = (): void => {
    console.log("Hello from TILA AI TS!");
    // Write your code here
};

main();`,
        [ExecutionMode.FUNCTION]: `/**
 * Write your algorithm here
 * @param arr - Input array
 * @returns Processed result
 */
function solution(arr: number[]): number[] {
    // TODO: Implement your solution
    return arr.sort((a, b) => a - b);
}`
    },
    [ProgrammingLanguage.CPP]: {
        [ExecutionMode.SCRIPT]: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    cout << "Hello from TILA AI C++" << endl;
    // Write your code here
    return 0;
}`,
        [ExecutionMode.FUNCTION]: `#include <vector>
using namespace std;

/**
 * Write your algorithm here
 * @param arr Input vector
 * @return Processed result
 */
int solution(vector<int>& arr) {
    // TODO: Implement your solution
    return 0;
}`
    },
    [ProgrammingLanguage.JAVA]: {
        [ExecutionMode.SCRIPT]: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from TILA AI Java!");
        // Write your code here
    }
}`,
        [ExecutionMode.FUNCTION]: `class Solution {
    /**
     * Write your algorithm here
     * @param arr Input array
     * @return Processed result
     */
    public int[] solution(int[] arr) {
        // TODO: Implement your solution
        java.util.Arrays.sort(arr);
        return arr;
    }
}`
    }
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, setCode, language, setLanguage, onRun, output: parentOutput, isRunning, executionMode, setExecutionMode,
  onLanguageChange, onSaveSnippet, onChallengeComplete, fileName, onFileNameChange
}) => {
  // Dynamic filename based on language
  const getDefaultFilename = (lang: ProgrammingLanguage): string => {
    const filenames: Record<ProgrammingLanguage, string> = {
      [ProgrammingLanguage.PYTHON]: 'main.py',
      [ProgrammingLanguage.JAVASCRIPT]: 'main.js',
      [ProgrammingLanguage.TYPESCRIPT]: 'main.ts',
      [ProgrammingLanguage.CPP]: 'main.cpp',
      [ProgrammingLanguage.JAVA]: 'Main.java'
    };
    return filenames[lang] || 'main.txt';
  };
  
  // Get file extension for language
  const getFileExtension = (lang: ProgrammingLanguage): string => {
    const extensions: Record<ProgrammingLanguage, string> = {
      [ProgrammingLanguage.PYTHON]: '.py',
      [ProgrammingLanguage.JAVASCRIPT]: '.js',
      [ProgrammingLanguage.TYPESCRIPT]: '.ts',
      [ProgrammingLanguage.CPP]: '.cpp',
      [ProgrammingLanguage.JAVA]: '.java'
    };
    return extensions[lang] || '.txt';
  };

  const [tabs, setTabs] = useState<EditorTab[]>([
    { id: 'main', title: fileName || getDefaultFilename(language), content: code, type: 'code', isClosable: false, language: language }
  ]);
  const [activeTabId, setActiveTabId] = useState('main');
  
  // Get active tab's language (fallback to global language)
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeTabLanguage = activeTab?.language || language;
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  
  // File rename state
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editFileName, setEditFileName] = useState(fileName || getDefaultFilename(language));
  
  // Console State
  const [consoleHeight, setConsoleHeight] = useState(160);
  const [isResizingConsole, setIsResizingConsole] = useState(false);
  
  // Test Cases State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [showTestCases, setShowTestCases] = useState(false);
  const [newTestInput, setNewTestInput] = useState('');
  const [newTestExpected, setNewTestExpected] = useState('');
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);

  // AI Loading States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDocGen, setIsDocGen] = useState(false);
  const [isTestGen, setIsTestGen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [localOutput, setLocalOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Define finalOutput
  const finalOutput = localOutput || parentOutput;
  
  // Test case handlers
  const addTestCase = () => {
    if (newTestInput.trim() && newTestExpected.trim()) {
      setTestCases(prev => [...prev, {
        id: Date.now().toString(),
        input: newTestInput.trim(),
        expectedOutput: newTestExpected.trim()
      }]);
      setNewTestInput('');
      setNewTestExpected('');
    }
  };
  
  const removeTestCase = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };
  
  const runWithTestCases = () => {
    if (testCases.length > 0) {
      onRun(testCases);
    } else {
      onRun();
    }
  };
  
  // AI Generate Test Cases
  const generateAITestCases = async () => {
    const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
    if (!currentContent.trim()) {
      setLocalOutput("No code to analyze. Write some code first.");
      return;
    }
    
    setIsGeneratingTests(true);
    setLocalOutput("🤖 AI is generating test cases...");
    
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
              text: `Analyze this ${activeTabLanguage} code and generate 3-5 test cases.

CODE:
${currentContent}

Return ONLY a JSON array of test cases in this exact format (no markdown, no explanation):
[
  {"input": "example input 1", "expectedOutput": "expected output 1"},
  {"input": "example input 2", "expectedOutput": "expected output 2"}
]

Make the test cases realistic and cover edge cases.`
            }]
          }]
        })
      });
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newTestCases: TestCase[] = parsed.map((tc: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          input: String(tc.input || tc.Input || ''),
          expectedOutput: String(tc.expectedOutput || tc.expected || tc.output || '')
        })).filter((tc: TestCase) => tc.input && tc.expectedOutput);
        
        setTestCases(prev => [...prev, ...newTestCases]);
        setLocalOutput(`✅ Generated ${newTestCases.length} test cases!`);
      } else {
        setLocalOutput("❌ Could not parse AI response. Try again.");
      }
    } catch (error) {
      console.error('AI test generation error:', error);
      setLocalOutput("❌ Failed to generate test cases. Check your API key.");
    } finally {
      setIsGeneratingTests(false);
    }
  };
  
  // File rename handlers
  const handleFileNameSave = () => {
    let newName = editFileName.trim();
    if (!newName) {
      newName = getDefaultFilename(activeTabLanguage);
    }
    // Ensure correct extension for the tab's language
    const ext = getFileExtension(activeTabLanguage);
    if (!newName.endsWith(ext)) {
      // Remove any existing extension and add correct one
      const baseName = newName.replace(/\.[^/.]+$/, '');
      newName = baseName + ext;
    }
    setEditFileName(newName);
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, title: newName } : t));
    if (onFileNameChange && activeTabId === 'main') {
      onFileNameChange(newName);
    }
    setIsEditingFileName(false);
  };

  // Initial Boilerplate Injection on Mount if empty
  useEffect(() => {
      if (!code.trim()) {
          const boilerplate = BOILERPLATES[language]?.[executionMode] || '';
          setCode(boilerplate);
      }
  }, []);
  
  // Update main tab filename when language changes
  useEffect(() => {
      setTabs(prev => prev.map(t => 
        t.id === 'main' ? { ...t, title: getDefaultFilename(language) } : t
      ));
  }, [language]);

  // Sync main code with active tab if it's main
  useEffect(() => {
    setTabs(prev => prev.map(t => t.id === 'main' ? { ...t, content: code } : t));
  }, [code]);

  const handleLanguageChange = (newLang: ProgrammingLanguage) => {
      // Update ONLY the active tab's language and filename
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab) {
          const baseName = currentTab.title.replace(/\.[^/.]+$/, '');
          const newExt = getFileExtension(newLang);
          const newTitle = baseName + newExt;
          
          // Update tab with new language and title
          setTabs(prev => prev.map(t => 
            t.id === activeTabId ? { ...t, title: newTitle, language: newLang } : t
          ));
          
          // Only update global language if it's the main tab
          if (activeTabId === 'main') {
              if (onLanguageChange) {
                  onLanguageChange(newLang);
              } else {
                  setLanguage(newLang);
                  // Reset to boilerplate for new language
                  setCode(BOILERPLATES[newLang]?.[executionMode] || '');
              }
          }
      }
  };

  // Handle mode change - ALWAYS reset to boilerplate
  const handleModeChange = (newMode: ExecutionMode) => {
      setExecutionMode(newMode);
      // Always reset to the appropriate boilerplate when switching modes
      const boilerplate = BOILERPLATES[language]?.[newMode] || '';
      setCode(boilerplate);
      setLocalOutput(`Switched to ${newMode === ExecutionMode.SCRIPT ? 'Script' : 'Function'} mode. Editor reset to ${language} template.`);
  };

  // Handle Tab Switching & Content Sync
  const handleTabChange = (id: string) => {
    setActiveTabId(id);
  };

  const updateTabContent = (id: string, newContent: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t));
    if (id === 'main') {
        setCode(newContent);
    }
  };

  const createTab = (title: string, content: string, type: EditorTab['type'] = 'code', tabLang?: ProgrammingLanguage) => {
    const newId = Date.now().toString();
    // Use provided language or inherit from active tab
    const newTabLang = tabLang || activeTabLanguage;
    // If title is 'Untitled', add the current language extension
    let finalTitle = title;
    if (title === 'Untitled') {
      finalTitle = `untitled${getFileExtension(newTabLang)}`;
    }
    const newTab: EditorTab = { id: newId, title: finalTitle, content, type, isClosable: true, language: newTabLang };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    return newId;
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    if (splitTabId === id) {
        setSplitTabId(null);
    }
  };

  // --- AI HANDLERS ---

  const handleOptimize = async () => {
      const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
      if(!currentContent.trim()) return;
      setIsOptimizing(true);
      setLocalOutput("Neural Engine: Analyzing Complexity & Rewriting Logic...");
      try {
          const optimized = await optimizeCode(currentContent, activeTabLanguage);
          createTab('Optimized', optimized, 'code', activeTabLanguage);
          setSplitTabId(activeTabId);
          setLocalOutput("Optimization Complete. Opened in new tab.");
      } catch(e) { setLocalOutput("Optimization Failed."); } 
      finally { setIsOptimizing(false); }
  };

  const handleDeepScan = async () => {
      const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
      if(!currentContent.trim()) return;
      setIsScanning(true);
      setLocalOutput("🔍 Checking your code for potential issues...");
      try {
          const result = await deepScanCode(currentContent, activeTabLanguage);
          
          // Create a user-friendly report
          let report = `// CODE ANALYSIS REPORT\n`;
          report += `// Overall Score: ${result.score}/100\n`;
          report += `// ${result.summary}\n\n`;
          
          if (result.issues.length === 0) {
              report += `// ✅ Great! No issues found in your code.\n`;
          } else {
              report += `// Found ${result.issues.length} potential issue(s):\n\n`;
              result.issues.forEach((issue, index) => {
                  report += `// ${index + 1}. [${issue.severity}] Line ${issue.line || '?'}\n`;
                  report += `//    Problem: ${issue.message}\n`;
                  if (issue.suggestion) {
                      report += `//    Fix: ${issue.suggestion}\n`;
                  }
                  report += `\n`;
              });
          }
          
          report += `\n// Your original code:\n`;
          
          createTab('Code Analysis', report + currentContent, 'code', activeTabLanguage);
          setLocalOutput(`✅ Analysis complete! Found ${result.issues.length} potential issue(s).`);
      } catch(e) { 
          setLocalOutput("❌ Analysis failed. Please try again."); 
      } 
      finally { setIsScanning(false); }
  };

  const handleDocGen = async () => {
      const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
      if(!currentContent.trim()) return;
      setIsDocGen(true);
      setLocalOutput("Generating JSDoc/Docstrings...");
      try {
          const res = await generateDocumentation(currentContent, activeTabLanguage);
          createTab('Documentation', res, 'doc', activeTabLanguage);
          setSplitTabId(activeTabId);
          setLocalOutput("Documentation generated.");
      } catch(e) { setLocalOutput("Doc Gen Failed."); }
      finally { setIsDocGen(false); }
  };

  const handleTestGen = async () => {
      const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
      if(!currentContent.trim()) return;
      setIsTestGen(true);
      setLocalOutput("🧪 Creating test cases for your code...");
      try {
          const res = await generateUnitTests(currentContent, activeTabLanguage);
          createTab('Unit Tests', res, 'test', activeTabLanguage);
          setSplitTabId(activeTabId);
          setLocalOutput("✅ Test cases created! Check the new tab.");
      } catch(e) { setLocalOutput("❌ Failed to create tests. Please try again."); }
      finally { setIsTestGen(false); }
  };

  const handleComplete = async () => {
      const currentContent = tabs.find(t => t.id === activeTabId)?.content || code;
      if(!currentContent.trim()) return;
      setIsCompleting(true);
      setLocalOutput("Neural Engine: Completing logic pattern...");
      try {
          const result = await completeCode(currentContent, activeTabLanguage);
          createTab('Auto-Complete', result.fixedCode, 'code', activeTabLanguage);
          setSplitTabId(activeTabId);
          setLocalOutput(`Completion Ready. ${result.explanation}`);
      } catch(e) { setLocalOutput("Completion Failed."); } 
      finally { setIsCompleting(false); }
  };

  const handleCopy = () => {
    const currentContent = tabs.find(t => t.id === activeTabId)?.content || '';
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- CONSOLE RESIZING ---
  const startResizingConsole = (e: React.MouseEvent) => {
    setIsResizingConsole(true);
    e.preventDefault();
  };

  useEffect(() => {
    const stopResizing = () => setIsResizingConsole(false);
    const resize = (e: MouseEvent) => {
        if (isResizingConsole) {
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 50 && newHeight < window.innerHeight - 200) {
                setConsoleHeight(newHeight);
            }
        }
    };
    if (isResizingConsole) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizingConsole]);


  // Helper to render a specific tab content
  const renderEditor = (tabId: string) => {
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return null;

      const lines = tab.content.split('\n').length;
      const lineNumbers = Array.from({ length: Math.max(lines, 15) }, (_, i) => i + 1);

      return (
          <div className="flex-1 flex overflow-hidden bg-[#0D0D0D] relative group">
             {/* Line Numbers */}
             <div className="w-10 flex-shrink-0 bg-black/30 text-zinc-700 text-right pr-3 pt-4 select-none border-r border-white/5 text-[11px] leading-6 font-mono">
                {lineNumbers.map(n => <div key={n}>{n}</div>)}
             </div>
             <textarea
                value={tab.content}
                onChange={(e) => updateTabContent(tabId, e.target.value)}
                className="flex-1 bg-transparent text-zinc-300 resize-none outline-none p-4 leading-6 font-mono text-[13px] custom-scrollbar selection:bg-violet-500/30"
                spellCheck="false"
                placeholder={tab.id === 'main' ? BOILERPLATES[tab.language || language]?.[executionMode] || 'Start typing...' : 'Start typing...'}
                readOnly={false}
             />
             <div className="absolute top-2 right-2 px-2 py-1 bg-zinc-900/80 rounded text-[10px] text-zinc-500 pointer-events-none uppercase font-bold border border-zinc-800">
                {tab.title}
             </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] border-l border-white/5 font-mono text-sm relative">
      
      {/* Chrome-like Tabs Bar */}
      <div className="flex items-center bg-black border-b border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
            <div 
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                onDoubleClick={() => {
                    setActiveTabId(tab.id);
                    setEditFileName(tab.title);
                    setIsEditingFileName(true);
                }}
                className={`group flex items-center gap-2 px-4 py-2.5 text-xs border-r border-white/5 cursor-pointer select-none min-w-[120px] max-w-[200px] ${activeTabId === tab.id ? 'bg-[#0D0D0D] text-white border-t-2 border-t-violet-500' : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
            >
                {isEditingFileName && activeTabId === tab.id ? (
                    <input
                        type="text"
                        value={editFileName}
                        onChange={(e) => setEditFileName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFileNameSave();
                            if (e.key === 'Escape') setIsEditingFileName(false);
                        }}
                        onBlur={handleFileNameSave}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-zinc-800 border border-violet-500 rounded px-1 py-0.5 text-white text-xs focus:outline-none min-w-0"
                        autoFocus
                    />
                ) : (
                    <span className="truncate flex-1" title="Double-click to rename">{tab.title}</span>
                )}
                {tab.isClosable && !isEditingFileName && (
                    <button onClick={(e) => closeTab(tab.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 rounded p-0.5">
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        ))}
        <button 
            onClick={() => createTab('Untitled', '')}
            className="px-3 text-zinc-500 hover:text-white transition-colors"
            title="New file"
        >
            <Plus className="w-4 h-4" />
        </button>
        <div className="flex-1"></div>
        {/* Toggle Split View */}
        <button 
            onClick={() => setSplitTabId(splitTabId ? null : (tabs.length > 1 ? tabs[tabs.length-2].id : null))}
            className={`px-3 py-2.5 border-l border-white/5 hover:bg-zinc-900 transition-colors ${splitTabId ? 'text-violet-500' : 'text-zinc-500'}`}
            title="Toggle Split View"
        >
            <Split className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-900/30">
        <div className="flex items-center gap-3">
          {/* Language Selector - Per Tab */}
          <select 
            value={activeTabLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as ProgrammingLanguage)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value={ProgrammingLanguage.PYTHON} className="bg-black text-zinc-300">Python</option>
            <option value={ProgrammingLanguage.JAVASCRIPT} className="bg-black text-zinc-300">JavaScript</option>
            <option value={ProgrammingLanguage.TYPESCRIPT} className="bg-black text-zinc-300">TypeScript</option>
            <option value={ProgrammingLanguage.CPP} className="bg-black text-zinc-300">C++</option>
            <option value={ProgrammingLanguage.JAVA} className="bg-black text-zinc-300">Java</option>
          </select>

          <div className="w-px h-3 bg-zinc-700"></div>

          {/* Execution Mode Toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
               <button 
                onClick={() => handleModeChange(ExecutionMode.SCRIPT)}
                className={`px-2 py-0.5 text-[10px] rounded flex items-center gap-1 transition-all ${executionMode === ExecutionMode.SCRIPT ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Write complete script with main method"
               >
                  <FileText className="w-3 h-3" /> Script
               </button>
               <button 
                onClick={() => handleModeChange(ExecutionMode.FUNCTION)}
                className={`px-2 py-0.5 text-[10px] rounded flex items-center gap-1 transition-all ${executionMode === ExecutionMode.FUNCTION ? 'bg-violet-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Write only function logic (LeetCode style)"
               >
                  <Box className="w-3 h-3" /> Fn Only
               </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* AI Tools with Futuristic Glow */}
            <button 
                onClick={handleOptimize} 
                disabled={isOptimizing} 
                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-300 relative group" 
                title="Optimize"
            >
                <Zap className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-pulse' : ''}`} />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Optimize</span>
            </button>
            <button 
                onClick={handleDeepScan} 
                disabled={isScanning} 
                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300 relative group" 
                title="Code Analysis - Find potential issues and edge cases"
            >
                <ShieldAlert className={`w-3.5 h-3.5 ${isScanning ? 'animate-pulse' : ''}`} />
                 <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Code Analysis</span>
            </button>
            <button 
                onClick={handleDocGen} 
                disabled={isDocGen} 
                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-300 relative group" 
                title="Generate Docs"
            >
                <FileText className={`w-3.5 h-3.5 ${isDocGen ? 'animate-pulse' : ''}`} />
                 <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Auto-Doc</span>
            </button>
             <button 
                onClick={handleTestGen} 
                disabled={isTestGen} 
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-300 relative group" 
                title="Generate Tests"
            >
                <FlaskConical className={`w-3.5 h-3.5 ${isTestGen ? 'animate-pulse' : ''}`} />
                 <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Unit Tests</span>
            </button>
            <button 
                onClick={handleComplete} 
                disabled={isCompleting} 
                className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-300 relative group" 
                title="AI Complete"
            >
                <Sparkles className={`w-3.5 h-3.5 ${isCompleting ? 'animate-pulse' : ''}`} />
                 <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Complete Code</span>
            </button>

            <div className="w-px h-3 bg-zinc-700 mx-1"></div>

            <button onClick={handleCopy} className="p-1.5 text-zinc-500 hover:text-white transition-colors" title="Copy Code">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            
            {onSaveSnippet && (
                <button 
                    onClick={onSaveSnippet} 
                    className="p-1.5 text-zinc-500 hover:text-violet-400 transition-colors" 
                    title="Save to Snippets"
                >
                    <Save className="w-3.5 h-3.5" />
                </button>
            )}
            
            {onChallengeComplete && (
                <button 
                    onClick={onChallengeComplete} 
                    className="flex items-center gap-1 px-2 py-1 text-[10px] bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-bold" 
                    title="Mark Challenge Complete & Save to Snippets"
                >
                    <CheckCircle className="w-3 h-3" />
                    Complete
                </button>
            )}
            
            <button onClick={() => updateTabContent(activeTabId, '')} className="p-1.5 text-zinc-500 hover:text-white transition-colors" title="Clear Code">
                <RotateCcw className="w-3.5 h-3.5" />
            </button>
            
            {/* Test Cases Toggle */}
            <button 
                onClick={() => setShowTestCases(!showTestCases)}
                className={`p-1.5 rounded-lg transition-all duration-300 relative group ${showTestCases ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}`}
                title="Test Cases"
            >
                <Layers className="w-3.5 h-3.5" />
                {testCases.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                        {testCases.length}
                    </span>
                )}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">Test Cases</span>
            </button>
            
            <button 
                onClick={() => { setLocalOutput(null); runWithTestCases(); }}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded transition-all disabled:opacity-50 ml-1 shadow-lg shadow-violet-900/20 hover:shadow-violet-600/30"
            >
                <Play className="w-3 h-3 fill-current" />
                {testCases.length > 0 ? `RUN (${testCases.length})` : 'RUN'}
            </button>
        </div>
      </div>
      
      {/* Test Cases Panel */}
      {showTestCases && (
          <div className="border-b border-white/10 bg-zinc-900/50 p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Test Cases</span>
                  <button onClick={() => setShowTestCases(false)} className="text-zinc-500 hover:text-white">
                      <X className="w-3 h-3" />
                  </button>
              </div>
              
              {/* Existing Test Cases */}
              {testCases.length > 0 && (
                  <div className="space-y-2 mb-3">
                      {testCases.map((tc, idx) => (
                          <div key={tc.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2 text-[10px]">
                              <span className="text-zinc-500 font-bold">#{idx + 1}</span>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                  <div>
                                      <span className="text-zinc-500">Input:</span>
                                      <span className="text-zinc-300 ml-1 font-mono">{tc.input}</span>
                                  </div>
                                  <div>
                                      <span className="text-zinc-500">Expected:</span>
                                      <span className="text-green-400 ml-1 font-mono">{tc.expectedOutput}</span>
                                  </div>
                              </div>
                              <button onClick={() => removeTestCase(tc.id)} className="text-zinc-500 hover:text-red-400">
                                  <Trash2 className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
              )}
              
              {/* Add New Test Case */}
              <div className="flex items-center gap-2">
                  <input
                      type="text"
                      value={newTestInput}
                      onChange={(e) => setNewTestInput(e.target.value)}
                      placeholder="Input (e.g., [1,2,3])"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-violet-500"
                  />
                  <input
                      type="text"
                      value={newTestExpected}
                      onChange={(e) => setNewTestExpected(e.target.value)}
                      placeholder="Expected Output"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-violet-500"
                  />
                  <button 
                      onClick={addTestCase}
                      disabled={!newTestInput.trim() || !newTestExpected.trim()}
                      className="px-2 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[10px] font-bold rounded"
                      title="Add test case"
                  >
                      <Plus className="w-3 h-3" />
                  </button>
                  <button 
                      onClick={generateAITestCases}
                      disabled={isGeneratingTests}
                      className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-[10px] font-bold rounded flex items-center gap-1"
                      title="Generate test cases with AI"
                  >
                      <Sparkles className={`w-3 h-3 ${isGeneratingTests ? 'animate-spin' : ''}`} />
                      AI
                  </button>
              </div>
              
              {/* Quick Actions */}
              {testCases.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800">
                      <button 
                          onClick={() => setTestCases([])}
                          className="text-[9px] text-zinc-500 hover:text-red-400 transition-colors"
                      >
                          Clear All
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Editor Content Area (Split Logic) */}
      <div className="flex-1 flex overflow-hidden">
          {splitTabId ? (
              <>
                <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                    {renderEditor(activeTabId)}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    {renderEditor(splitTabId)}
                </div>
              </>
          ) : (
              renderEditor(activeTabId)
          )}
      </div>

      {/* Resizable Console */}
      <div 
        className="relative bg-black border-t border-white/10 flex flex-col"
        style={{ height: consoleHeight }}
      >
          {/* Drag Handle */}
          <div 
            onMouseDown={startResizingConsole}
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-violet-500/50 z-10 transition-colors"
          ></div>

          <div className="h-7 flex items-center justify-between px-4 bg-zinc-900/50 border-b border-white/5 select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Console Output</span>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setConsoleHeight(consoleHeight === 40 ? 160 : 40)} className="text-zinc-600 hover:text-white">
                     {consoleHeight === 40 ? <Maximize2 className="w-3 h-3"/> : <Minimize2 className="w-3 h-3"/>}
                 </button>
              </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              {finalOutput ? (
                  <pre className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                      finalOutput.includes("❌") ? 'text-red-300' : 
                      finalOutput.includes("✅") ? 'text-green-300' : 
                      finalOutput.includes("CODE ANALYSIS") || finalOutput.includes("Checking your code") ? 'text-blue-300' : 
                      finalOutput.includes("Optimization") ? 'text-amber-300' : 
                      finalOutput.includes("Switched to") ? 'text-violet-300' : 
                      finalOutput.includes("🤖") ? 'text-purple-300' :
                      'text-zinc-300'
                  }`}>
                      {finalOutput.split('\n').map((line, i) => (
                          <div key={i} className={`${
                              line.includes('✅') ? 'text-green-400' : 
                              line.includes('❌') ? 'text-red-400' : 
                              line.includes('━') ? 'text-zinc-600' :
                              line.includes('📊') || line.includes('🧪') || line.includes('📤') ? 'text-violet-400 font-bold' :
                              line.includes('Input') ? 'text-cyan-400' :
                              line.includes('Expected') ? 'text-yellow-400' :
                              line.includes('Actual') || line.includes('Output') ? 'text-blue-400' :
                              line.includes('Time:') || line.includes('Space:') ? 'text-zinc-500' :
                              line.includes('Result:') ? 'font-bold' :
                              ''
                          }`}>
                              {line}
                          </div>
                      ))}
                  </pre>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                      <Terminal className="w-8 h-8 mb-2 opacity-30" />
                      <span className="text-xs">No output yet. Click Run to execute your code.</span>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
