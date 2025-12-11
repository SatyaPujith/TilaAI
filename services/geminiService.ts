import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AppMode, StudyFile, ExplanationStyle, CodingChallenge, GraphData, ProgrammingLanguage, ScanResult, CompletionResult, ExecutionMode } from "../types";

// Initialize the client
const getClient = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

const getStyleInstruction = (style: ExplanationStyle): string => {
  switch (style) {
    case ExplanationStyle.DEBUG:
      return "You are a Senior Debugger. Analyze the code strictly for syntax errors, logical bugs, and edge cases. Be concise and point out lines.";
    case ExplanationStyle.CODE_WALKTHROUGH:
      return "Explain the code logic step-by-step. Focus on control flow and data structures used. Do not read the syntax characters aloud, explain the intent.";
    case ExplanationStyle.OPTIMIZATION:
      return "Focus purely on Big O notation. Analyze Time and Space complexity. Suggest optimizations to reduce complexity.";
    case ExplanationStyle.SOCRATIC:
      return "Do not give the code solution. Ask leading questions about the algorithm to help the user derive the solution.";
    case ExplanationStyle.ELI5:
      return "Explain the algorithm using real-world analogies (e.g., explain Arrays like a row of mailboxes).";
    default:
      return "You are a Senior Tech Lead tutoring a junior developer.";
  }
};

export const generateDevResponse = async (
  prompt: string,
  mode: AppMode,
  style: ExplanationStyle,
  currentCode: string,
  language: ProgrammingLanguage,
  contextFiles: StudyFile[]
) => {
  const ai = getClient();
  
  let systemInstruction = `You are TILA, an advanced AI Coding Tutor and mentor. You help developers learn algorithms, data structures, and programming concepts.

CRITICAL RULES:
1. NEVER provide complete code solutions unless explicitly asked with "give me the code" or "show me the solution"
2. Break down explanations into clear sections with markdown headers (##)
3. Start with the problem understanding
4. Explain the approach/algorithm step by step
5. Mention naive solution first, then optimized solution
6. Use bullet points and numbered lists for clarity
7. Format responses with proper spacing and structure (add blank lines between sections)
8. Only provide function signatures, not full implementations
9. Guide users to implement the logic themselves
10. If user asks "tell me the algorithm", provide step-by-step approach only

RESPONSE FORMAT (ALWAYS USE THIS STRUCTURE):

## Understanding the Problem
[Brief explanation in 2-3 sentences]

## Approach
1. Step 1 explanation
2. Step 2 explanation
3. Step 3 explanation

## Naive Solution
- Time Complexity: O(?)
- Space Complexity: O(?)
- Brief explanation of the naive approach

## Optimized Solution
- Time Complexity: O(?)
- Space Complexity: O(?)
- Brief explanation of optimization

## Implementation Hints
- Hint 1: [specific guidance]
- Hint 2: [specific guidance]
- Hint 3: [specific guidance]

## Function Signature
\`\`\`${language}
// Only the function signature, NO implementation
\`\`\`

Would you like me to show you the complete implementation?`;
  systemInstruction += " " + getStyleInstruction(style);
  
  // Context injection
  let finalPrompt = prompt;
  
  if (currentCode) {
      finalPrompt += `\n\n[CURRENT CODE CONTEXT (${language})]:\n${currentCode}\n`;
  }

  if (mode === AppMode.SYLLABUS && contextFiles.length > 0) {
      const contextText = contextFiles.map(f => `[DOC: ${f.name}]\n${f.content}`).join('\n\n').substring(0, 20000);
      systemInstruction += " Base your coding challenges and explanations on the provided technical documentation/syllabus.";
      finalPrompt = `CONTEXT:\n${contextText}\n\nUSER QUERY: ${prompt}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const candidate = response.candidates?.[0];
    const textPart = candidate?.content?.parts?.find(p => p.text)?.text || "I apologize, I couldn't generate a response. Please try again.";

    return {
      text: textPart,
      audioData: null
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export interface TestCase {
    input: string;
    expectedOutput: string;
}

export interface CodeExecutionResult {
    output: string;
    isCorrect: boolean;
    timeComplexity: string;
    spaceComplexity: string;
    expectedTimeComplexity?: string;
    expectedSpaceComplexity?: string;
    testResults?: { input: string; expected: string; actual: string; passed: boolean }[];
}

export const runCodeSimulation = async (
    code: string, 
    language: string, 
    mode: ExecutionMode = ExecutionMode.SCRIPT,
    testCases?: TestCase[]
): Promise<string> => {
    const ai = getClient();
    
    let prompt = "";
    
    if (testCases && testCases.length > 0) {
        // Run with test cases - clean, simple format
        const testCaseStr = testCases.map((tc, i) => 
            `Test ${i + 1}: Input: ${tc.input}, Expected: ${tc.expectedOutput}`
        ).join('\n');
        
        prompt = `Act as a ${language} compiler. Execute this code with the test cases.

CODE:
${code}

TEST CASES:
${testCaseStr}

RESPOND IN THIS EXACT CLEAN FORMAT (no extra text):

🧪 TEST RESULTS
${testCases.map((_, i) => `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test ${i + 1}: ✅ PASS or ❌ FAIL
Input    → [value]
Expected → [value]  
Actual   → [value]`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: ✅ ALL PASSED or ❌ X/Y FAILED
Time: O(?)  |  Space: O(?)`;
    } else if (mode === ExecutionMode.FUNCTION) {
        prompt = `Act as a ${language} compiler. Execute this function with sample inputs.

CODE:
${code}

Create 3 test cases and run them. RESPOND IN THIS CLEAN FORMAT:

🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: ✅ PASS or ❌ FAIL
Input  → [value]
Output → [value]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 2: ✅ PASS or ❌ FAIL
Input  → [value]
Output → [value]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 3: ✅ PASS or ❌ FAIL
Input  → [value]
Output → [value]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: ✅ Code works correctly or ❌ Has errors
Time: O(?)  |  Space: O(?)`;
    } else {
        prompt = `Act as a ${language} compiler. Execute this code and show the output.
If there are errors, show them clearly.

CODE:
${code}

RESPOND IN THIS CLEAN FORMAT:

📤 OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[actual program output here]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: ✅ Success or ❌ Error: [brief description]
Time: O(?)  |  Space: O(?)`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
    });

    return response.text || "No output generated.";
};

export const generateCodingChallenges = async (topic: string, contextFiles: StudyFile[]): Promise<CodingChallenge[]> => {
    const ai = getClient();
    let contextText = "";
    
    if (contextFiles.length > 0) {
        contextText = contextFiles.map(f => f.content).join('\n').substring(0, 10000);
    }
    
    const prompt = `Generate 3 coding challenges related to: ${topic} ${contextText ? 'based on the provided context.' : ''}.
    ${contextText ? `Context: ${contextText}` : ''}
    
    Return a JSON array with exactly 3 challenges. Each challenge must have:
    - id: unique string identifier
    - title: challenge name
    - difficulty: one of "Easy", "Medium", or "Hard"
    - description: detailed problem description
    - starterCode: initial code template
    - testCases: array of test case descriptions
    
    Example format:
    [
      {
        "id": "1",
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": "Given an array of integers, return indices of two numbers that add up to a target.",
        "starterCode": "def twoSum(nums, target):\\n    pass",
        "testCases": ["Input: [2,7,11,15], target=9, Output: [0,1]"]
      }
    ]`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const parsed = JSON.parse(response.text || '[]');
        return parsed.map((c: any, idx: number) => ({
            id: c.id || `challenge-${Date.now()}-${idx}`,
            title: c.title || `Challenge ${idx + 1}`,
            difficulty: c.difficulty || 'Medium',
            description: c.description || 'No description provided',
            starterCode: c.starterCode || '// Write your solution here',
            testCases: c.testCases || []
        })) as CodingChallenge[];
    } catch (e) {
        console.error('Challenge generation error:', e);
        // Return fallback challenges
        return [
            {
                id: `fallback-${Date.now()}-1`,
                title: `${topic} - Basic Problem`,
                difficulty: 'Easy',
                description: `Solve a basic problem related to ${topic}. Implement the solution step by step.`,
                starterCode: '// Write your solution here\n\nfunction solve() {\n    // Your code\n}',
                testCases: ['Test your solution with different inputs']
            },
            {
                id: `fallback-${Date.now()}-2`,
                title: `${topic} - Intermediate Challenge`,
                difficulty: 'Medium',
                description: `An intermediate level challenge for ${topic}. Consider edge cases and optimize your solution.`,
                starterCode: '// Write your solution here\n\nfunction solve() {\n    // Your code\n}',
                testCases: ['Test with edge cases']
            },
            {
                id: `fallback-${Date.now()}-3`,
                title: `${topic} - Advanced Problem`,
                difficulty: 'Hard',
                description: `An advanced problem for ${topic}. Focus on optimal time and space complexity.`,
                starterCode: '// Write your solution here\n\nfunction solve() {\n    // Your code\n}',
                testCases: ['Test with large inputs']
            }
        ];
    }
};

export const generateRoadmapData = async (contextFiles: StudyFile[], topic?: string): Promise<GraphData> => {
    const ai = getClient();
    
    let promptContext = "";
    if (contextFiles.length > 0) {
        promptContext = contextFiles.map(f => f.content).join('\n').substring(0, 15000);
    } else if (topic) {
        promptContext = topic;
    } else {
        return { nodes: [], links: [] };
    }

    const prompt = `You are a programming and computer science education expert. Create a technical learning roadmap for: "${promptContext}"

    IMPORTANT: This is for a CODING/PROGRAMMING learning platform. Interpret the topic in a SOFTWARE ENGINEERING context:
    - "Trees" = Data Structures (Binary Trees, BST, AVL, Red-Black Trees, Tries, etc.)
    - "Graphs" = Graph Data Structures & Algorithms (BFS, DFS, Dijkstra, etc.)
    - "Arrays" = Array Data Structure & Algorithms (Sorting, Searching, Two Pointers, etc.)
    - "Strings" = String Manipulation & Algorithms (Pattern Matching, KMP, etc.)
    - "Dynamic Programming" = DP Techniques & Patterns
    - "System Design" = Software Architecture & Scalability
    - Any topic should be interpreted as its PROGRAMMING/DSA equivalent
    
    Generate a structured learning path with 6-10 nodes representing key programming concepts, algorithms, or techniques.
    
    CRITICAL: You MUST return a valid JSON object with this EXACT structure:
    {
      "nodes": [
        {"id": "1", "label": "Introduction to [Topic] in Programming", "type": "core", "status": "unlocked"},
        {"id": "2", "label": "Basic Operations & Implementation", "type": "concept", "status": "locked"},
        {"id": "3", "label": "Common Algorithms", "type": "concept", "status": "locked"},
        {"id": "4", "label": "Advanced Techniques", "type": "detail", "status": "locked"}
      ],
      "links": [
        {"source": "1", "target": "2"},
        {"source": "2", "target": "3"}
      ]
    }
    
    Rules:
    - Focus ONLY on programming, coding, DSA, or software engineering aspects
    - nodes: array with id (string), label (string - technical programming term), type ("core"|"concept"|"detail"), status ("unlocked"|"locked")
    - links: array with source and target matching node ids
    - Labels should be specific programming/DSA terms (e.g., "Binary Search Tree Operations", "Tree Traversal Algorithms", "Balanced Trees - AVL & Red-Black")
    - Return ONLY the JSON object
    - NO markdown, NO explanations`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        let responseText = response.text || '{"nodes": [], "links": []}';
        
        // Aggressive cleanup - remove all markdown formatting
        responseText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```javascript\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^[\s\n]+|[\s\n]+$/g, '')
            .trim();
        
        // Try to extract JSON if it's embedded in text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseText = jsonMatch[0];
        }
        
        console.log('Parsing roadmap response:', responseText);
        
        let data = JSON.parse(responseText);
        
        // Handle case where nodes might be a string (AI error)
        if (typeof data.nodes === 'string') {
            console.warn('Nodes returned as string, attempting to parse...');
            try {
                data.nodes = JSON.parse(data.nodes);
            } catch (e) {
                console.error('Failed to parse nodes string:', data.nodes);
                throw new Error('Invalid nodes format - received string instead of array');
            }
        }
        
        // Validate and ensure proper structure
        if (!data.nodes || !Array.isArray(data.nodes)) {
            console.error('Invalid nodes structure:', data);
            throw new Error('Invalid nodes structure');
        }
        
        // Ensure all nodes have required properties
        data.nodes = data.nodes.map((node: any, index: number) => ({
            id: String(node.id || index + 1),
            label: String(node.label || `Node ${index + 1}`),
            type: String(node.type || 'concept'),
            status: index === 0 ? 'unlocked' : String(node.status || 'locked')
        }));
        
        // Ensure links is an array with valid structure
        if (!data.links || !Array.isArray(data.links)) {
            data.links = [];
        }
        
        data.links = data.links.map((link: any) => ({
            source: String(link.source),
            target: String(link.target)
        }));
        
        console.log('Successfully parsed roadmap:', data);
        
        return data as GraphData;
    } catch (e) {
        console.error('Roadmap generation error:', e);
        // Return fallback roadmap
        const topicName = topic || 'Programming';
        return {
            nodes: [
                { id: '1', label: `${topicName} Basics`, type: 'core', status: 'unlocked' },
                { id: '2', label: `${topicName} Fundamentals`, type: 'concept', status: 'locked' },
                { id: '3', label: `Intermediate ${topicName}`, type: 'concept', status: 'locked' },
                { id: '4', label: `Advanced ${topicName}`, type: 'detail', status: 'locked' },
                { id: '5', label: `${topicName} Best Practices`, type: 'detail', status: 'locked' }
            ],
            links: [
                { source: '1', target: '2' },
                { source: '2', target: '3' },
                { source: '3', target: '4' },
                { source: '4', target: '5' }
            ]
        };
    }
};

export const generateTextOnly = async (prompt: string, contextFiles: StudyFile[]) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Summarize this coding concept: ${prompt}`
    });
    return response.text;
};

// --- NEW FUTURISTIC FEATURES ---

export const generateSyllabusContent = async (topic: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Create a detailed study syllabus/documentation for the topic: "${topic}". 
    Include Key Concepts, Code Examples, and Common Pitfalls. 
    Format as Markdown.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
    });
    return response.text || "Failed to generate syllabus.";
};

export const optimizeCode = async (code: string, language: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are a Code Optimization Engine.
Analyze and optimize the following ${language} code.

RULES:
1. Return ONLY the optimized code - no explanations outside comments
2. Add a brief comment at the top showing: Original O(?) → Optimized O(?)
3. Keep the same function/variable names
4. Add inline comments ONLY where you made significant changes
5. Do NOT add verbose explanations or markdown

CODE:
${code}

Return the optimized code only:`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
    });
    
    let result = response.text || code;
    // Remove markdown code blocks if present
    result = result.replace(/```[\w]*\n?/g, '').replace(/```$/g, '').trim();
    
    return result;
};

export const deepScanCode = async (code: string, language: string): Promise<ScanResult> => {
    const ai = getClient();
    const prompt = `Analyze this ${language} code and find potential issues that could cause bugs.

Focus ONLY on:
1. Edge Cases - What could go wrong with different inputs?
2. Logic Issues - Are there any logical problems in the code?

Be simple and clear. Explain issues in plain English that any developer can understand.

CODE:
${code}

Return JSON with this structure:
{ 
  "score": number (0-100), 
  "summary": "Brief summary in simple words", 
  "issues": [
    { 
      "severity": "Important" or "Minor", 
      "message": "Clear explanation of what could go wrong", 
      "line": line_number,
      "suggestion": "Simple fix suggestion"
    }
  ] 
}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    issues: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: {
                                severity: { type: Type.STRING, enum: ['Important', 'Minor'] },
                                message: { type: Type.STRING },
                                line: { type: Type.NUMBER },
                                suggestion: { type: Type.STRING }
                            } 
                        } 
                    }
                }
            }
        }
    });

    try {
        return JSON.parse(response.text || '{}') as ScanResult;
    } catch (e) {
        return { score: 0, summary: "Analysis Failed", issues: [] };
    }
};

export const generateDocumentation = async (code: string, language: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are an Automated Documentation Generator.
    Add professional JSDoc/Docstring comments to the following ${language} code.
    Explain parameters, return values, and complex logic.
    Do not change the logic, only add comments.
    
    CODE:
    ${code}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
    });
    return response.text || code;
};

export const generateUnitTests = async (code: string, language: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Create simple test cases for this ${language} code.

Make the tests:
1. Easy to understand
2. Cover normal usage (happy path)
3. Test edge cases (empty inputs, null values, etc.)
4. Use standard testing frameworks

Add comments explaining what each test does.

CODE:
${code}

Return clean test code without markdown formatting.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
    });
    return response.text || "";
};

export const completeCode = async (code: string, language: string): Promise<CompletionResult> => {
    const ai = getClient();
    const prompt = `You are an intelligent code auto-completion engine.
    Review the following ${language} code.
    1. If it is incomplete, finish the logic.
    2. If it has errors, fix them.
    3. STRICTLY maintain the user's coding style, variable naming, and indentation.
    4. Provide a brief explanation of what you changed or added.

    Return JSON format ONLY.
    Structure: { "fixedCode": "string", "explanation": "string" }

    CODE:
    ${code}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    fixedCode: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                }
            }
        }
    });

    try {
        return JSON.parse(response.text || '{"fixedCode": "", "explanation": "Failed to parse"}') as CompletionResult;
    } catch (e) {
        return { fixedCode: code, explanation: "AI Error" };
    }
};

export const convertCodeLanguage = async (code: string, fromLang: string, toLang: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are a code translator. Convert the following ${fromLang} code to ${toLang}.
    
CRITICAL RULES:
1. Maintain the EXACT same logic and algorithm
2. Use idiomatic ${toLang} syntax and conventions
3. Keep the same variable names where possible
4. Add brief comments explaining ${toLang}-specific features
5. Return ONLY the converted code, no explanations

${fromLang} CODE:
${code}

Convert to ${toLang}:`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt
    });

    let convertedCode = response.text || code;
    
    // Remove markdown code blocks if present
    convertedCode = convertedCode.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();
    
    return convertedCode;
};

// Simple wrapper for integrated app
export const geminiService = {
  async sendMessage(message: string, history: any[] = []) {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: message
    });
    return response.text || "No response generated.";
  },

  async transcribeAudio(audioBlob: Blob) {
    // Audio transcription would require additional setup
    // For now, return a placeholder
    return "Audio transcription not yet implemented";
  }
};
