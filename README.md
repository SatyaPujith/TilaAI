<div align="center">

# 🌧️ Tila AI

### Your Intelligent AI-Powered Coding Companion

**Built on LiquidMetal AI Raindrop Platform | Powered by Vultr Infrastructure**

[![Platform](https://img.shields.io/badge/Platform-Raindrop-0066FF?style=for-the-badge&logo=cloud&logoColor=white)](https://liquidmetal.ai)
[![Infrastructure](https://img.shields.io/badge/Infrastructure-Vultr-007BFC?style=for-the-badge&logo=vultr&logoColor=white)](https://vultr.com)
[![AI](https://img.shields.io/badge/AI-Gemini%201.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Voice](https://img.shields.io/badge/Voice-ElevenLabs-FF6B35?style=for-the-badge&logo=audio&logoColor=white)](https://elevenlabs.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](https://tila-ai-api.01kbs9qyfs1fh8dnwn4k7g8mak.lmapp.run) • [Features](#-core-features) • [Quick Start](#-quick-start)

</div>

---

## 🎯 What is Tila AI?

**Tila AI** is a comprehensive AI-powered development platform that transforms how developers learn, write, and collaborate on code. Combining Google Gemini's intelligence with ElevenLabs' voice technology, Tila AI offers an immersive coding experience with features ranging from AI tutoring to community collaboration.

---

## ✨ Core Features

### � AI Tutior (Powered by ElevenLabs)

Your personal AI coding mentor with voice capabilities and syllabus-based learning.

| Feature | Description |
|---------|-------------|
| **💬 AI Chatbot** | Interactive chatbot for learning programming concepts |
| **🎤 Voice-to-Text** | Speak your questions using ElevenLabs voice recognition |
| **🗣️ Talk to Mentor** | Have real-time voice conversations with your AI mentor |
| **📚 Syllabus Upload** | Upload your syllabus and AI uses it as reference for personalized learning |
| **🎯 Context-Aware** | AI remembers your syllabus and tailors responses accordingly |
| **📖 Curriculum-Based** | Get explanations aligned with your course material |

---

### 💻 Smart Code Editor

A powerful AI-enhanced code editor that understands your intent and helps you write better code.

| Feature | Description |
|---------|-------------|
| **🔄 Auto Language Conversion** | Change language and AI converts your existing code automatically |
| **✨ Code Completion** | AI completes your code based on your written logic |
| **⚡ Code Optimization** | Get optimized versions of your code with one click |
| **🧪 Unit Test Generation** | AI generates comprehensive unit tests for your code |
| **� Code Ana lysis** | Deep analysis of code quality, complexity, and issues |
| **🐛 Bug Detection** | AI identifies potential bugs and suggests fixes |
| **📝 Code Documentation** | Auto-generate documentation for your functions |

---

### 📓 Interactive Notebooks

Create, edit, and share interactive coding notebooks with AI assistance.

| Feature | Description |
|---------|-------------|
| **📥 Export to Markdown** | Download your notebook as a `.md` file |
| **🤖 AI Cell Execution** | AI explains and runs code cells |
| **📊 Rich Output** | Support for code, text, and visualizations |
| **💾 Auto-save** | Never lose your work |

---

### 🗺️ Learning Roadmaps

AI-generated personalized learning paths to master any technology.

| Feature | Description |
|---------|-------------|
| **🎯 Custom Roadmaps** | Create roadmaps for any topic or technology |
| **📈 Progress Tracking** | Track your learning journey |
| **🔗 Connected Nodes** | Visual representation of learning dependencies |
| **✅ Milestone Completion** | Mark topics as completed |

---

### 🏆 Coding Challenges

Test and improve your skills with AI-generated coding challenges.

| Feature | Description |
|---------|-------------|
| **🎲 AI-Generated Challenges** | Fresh challenges created by AI |
| **📊 Difficulty Levels** | Easy, Medium, Hard challenges |
| **✔️ Solution Validation** | AI validates your solutions |
| **🏅 Progress Tracking** | Track completed challenges |

---

### 👥 Community Hub

Share, discover, and collaborate with other developers.

| Feature | Description |
|---------|-------------|
| **📤 Share Code** | Post your code snippets and projects |
| **❤️ Like & Fork** | Engage with community content |
| **🏷️ Tags & Categories** | Organize content by topics |
| **💬 Discussions** | Comment and discuss solutions |

---

### 💬 AI Chat Assistant

Context-aware AI chat that understands your code and provides intelligent assistance.

| Feature | Description |
|---------|-------------|
| **🧠 Context Retention** | AI remembers your conversation history |
| **💻 Code Understanding** | Paste code and get explanations |
| **🌐 Multi-language** | Support for 20+ programming languages |
| **📚 Save History** | Save and revisit past conversations |

---

### � Project Management

Organize your coding projects with AI-enhanced project management.

| Feature | Description |
|---------|-------------|
| **📂 Project Organization** | Create and manage multiple projects |
| **📝 Code Snippets** | Save reusable code snippets |
| **🔍 Smart Search** | AI-powered search across projects |
| **☁️ Cloud Sync** | Access projects from anywhere |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      TILA AI PLATFORM                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (React)                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │  Chat   │ │ Editor  │ │Notebook │ │    Roadmaps     │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │ Tutor   │ │Community│ │Challenges│ │    Projects    │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              RAINDROP BACKEND (Hono.js)                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │    API     │  │    Auth    │  │    AI Services     │  │  │
│  │  │  Service   │  │  Service   │  │  (Gemini + Voice)  │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │SmartMemory │  │SmartBucket │  │     KV Cache       │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │  Google Gemini │ │   ElevenLabs   │ │  Vultr Cloud   │      │
│  │   1.5 Flash    │ │   Voice AI     │ │ Infrastructure │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Raindrop CLI** - `npm install -g @liquidmetal-ai/raindrop`

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tila-ai.git
cd tila-ai

# Install dependencies
npm install
cd raindrop-backend && npm install && cd ..
```

### Environment Configuration

Create `.env.local`:

```env
# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# Voice AI (ElevenLabs)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_ELEVENLABS_AGENT_ID=your_agent_id

# Backend API
VITE_API_URL=https://tila-ai-api.01kbs9qyfs1fh8dnwn4k7g8mak.lmapp.run
```

### Run Locally

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd raindrop-backend
raindrop build deploy --start
```

---

## 📁 Project Structure

```
tila-ai/
├── 📂 raindrop-backend/        # Backend API
│   ├── src/api/index.ts       # API routes
│   └── raindrop.manifest      # Platform config
├── 📂 components/              # React Components
│   ├── ChatArea.tsx           # AI Chat
│   ├── CodeEditor.tsx         # Smart Editor
│   ├── Notebook.tsx           # Notebooks
│   ├── Sidebar.tsx            # Navigation
│   └── LandingPage.tsx        # Home
├── 📂 services/                # Services
│   ├── geminiService.ts       # Gemini AI
│   ├── elevenLabsService.ts   # Voice AI
│   └── apiService.ts          # API Client
├── App.tsx                    # Main App
└── .env.local                 # Config
```

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Hono.js, Raindrop Framework |
| **AI Engine** | Google Gemini 1.5 Flash |
| **Voice AI** | ElevenLabs Conversational AI |
| **Platform** | LiquidMetal AI Raindrop |
| **Infrastructure** | Vultr Cloud |

---

## 🚀 Deployment

```bash
cd raindrop-backend

# Deploy
raindrop build deploy --start

# Check status
raindrop build status

# View logs
raindrop logs tail
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

<div align="center">

### 🌧️ Tila AI - Where Intelligence Meets Code

**Learn • Code • Collaborate**

</div>
