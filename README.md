<div align="center">

# 🌧️ Tila AI

### Your Intelligent AI-Powered Coding Companion

**Built on LiquidMetal AI Raindrop Platform | Powered by Vultr Infrastructure**

[![Platform](https://img.shields.io/badge/Platform-Raindrop-0066FF?style=for-the-badge&logo=cloud&logoColor=white)](https://liquidmetal.ai)
[![Infrastructure](https://img.shields.io/badge/Infrastructure-Vultr-007BFC?style=for-the-badge&logo=vultr&logoColor=white)](https://vultr.com)
[![AI](https://img.shields.io/badge/AI-Gemini%201.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](https://tila-ai-api.01kbs9qyfs1fh8dnwn4k7g8mak.lmapp.run) • [Features](#-ai-powered-features) • [Quick Start](#-quick-start) • [Documentation](#-api-documentation)

</div>

---

## 🎯 What is Tila AI?

**Tila AI** is a next-generation AI-powered coding assistant that revolutionizes how developers write, analyze, and debug code. Built on LiquidMetal AI's cutting-edge Raindrop Platform and deployed on Vultr's robust cloud infrastructure, Tila AI brings the power of advanced AI directly into your development workflow.

---

## 🤖 AI-Powered Features

### 💬 Intelligent AI Chat
Transform your coding experience with context-aware conversations. Tila AI understands your code, remembers your context, and provides intelligent responses tailored to your specific needs.

- **Context Retention** - AI remembers previous conversations using SmartMemory
- **Multi-Language Support** - Works with 20+ programming languages
- **Code-Aware Responses** - Understands code snippets shared in chat
- **Natural Language Processing** - Ask questions in plain English

### 🔧 AI Code Generation
Generate production-ready code from natural language descriptions. Simply describe what you want, and Tila AI creates clean, efficient code.

- **Natural Language to Code** - Describe functionality, get working code
- **Framework-Aware** - Generates code for React, Node.js, Python, and more
- **Best Practices** - Follows coding standards and conventions
- **Customizable Output** - Specify language, framework, and style preferences

### 🔍 AI Code Analysis
Get instant, intelligent feedback on your code quality, performance, and potential issues.

- **Code Review** - AI-powered analysis of code quality
- **Bug Detection** - Identifies potential issues before they become problems
- **Performance Insights** - Suggestions for optimization
- **Security Scanning** - Highlights potential vulnerabilities

### 🐛 AI Debug Assistant
Stuck on a bug? Tila AI helps you identify, understand, and fix issues faster than ever.

- **Error Explanation** - Understand what went wrong and why
- **Fix Suggestions** - Get actionable solutions
- **Stack Trace Analysis** - AI interprets complex error messages
- **Root Cause Detection** - Find the source of issues quickly

### 📚 AI Learning Mode
Tila AI adapts to your coding style and preferences over time, providing increasingly personalized assistance.

- **Style Learning** - Adapts to your coding conventions
- **Preference Memory** - Remembers your technology preferences
- **Progressive Assistance** - Gets smarter with each interaction
- **Personalized Suggestions** - Recommendations based on your history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TILA AI ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐                      ┌─────────────────────────┐  │
│   │   React Frontend│                      │    Vultr Cloud          │  │
│   │   ─────────────│                      │    Infrastructure       │  │
│   │   • Chat UI     │                      │    ─────────────────    │  │
│   │   • Code Editor │                      │    • Auto-scaling       │  │
│   │   • Projects    │                      │    • Load Balancing     │  │
│   │   • Community   │                      │    • SSL/TLS            │  │
│   └────────┬────────┘                      │    • Global CDN         │  │
│            │                               └───────────┬─────────────┘  │
│            │ HTTPS                                     │                │
│            ▼                                           │                │
│   ┌─────────────────────────────────────────┐         │                │
│   │         Raindrop Backend (Hono.js)      │◄────────┘                │
│   │         ───────────────────────────     │                          │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐   │                          │
│   │   │   API   │ │  Auth   │ │   AI    │   │                          │
│   │   │ Service │ │ Service │ │ Service │   │                          │
│   │   └────┬────┘ └────┬────┘ └────┬────┘   │                          │
│   │        │           │           │        │                          │
│   │   ┌────▼───────────▼───────────▼────┐   │                          │
│   │   │     Raindrop Platform Layer     │   │                          │
│   │   │  ┌──────────┐  ┌──────────────┐ │   │                          │
│   │   │  │SmartMemory│  │ SmartBucket │ │   │                          │
│   │   │  └──────────┘  └──────────────┘ │   │                          │
│   │   │  ┌──────────┐  ┌──────────────┐ │   │                          │
│   │   │  │ KV Cache │  │    Actor     │ │   │                          │
│   │   │  └──────────┘  └──────────────┘ │   │                          │
│   │   └─────────────────────────────────┘   │                          │
│   └─────────────────┬───────────────────────┘                          │
│                     │                                                   │
│                     ▼                                                   │
│            ┌─────────────────┐                                          │
│            │  Google Gemini  │                                          │
│            │   1.5 Flash AI  │                                          │
│            │  ─────────────  │                                          │
│            │  • Generation   │                                          │
│            │  • Analysis     │                                          │
│            │  • Chat         │                                          │
│            └─────────────────┘                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Raindrop CLI** - `npm install -g @liquidmetal-ai/raindrop`
- **Google Gemini API Key** - [Get one here](https://ai.google.dev)

### Installation

```bash
# Clone the repository
git clone https://github.com/SatyaPujith/tila-ai.git
cd tila-ai

# Install frontend dependencies
npm install

# Install backend dependencies
cd raindrop-backend
npm install
cd ..
```

### Environment Configuration

Create `.env.local` in the project root:

```env
# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API URL (use deployed URL or localhost for development)
VITE_API_URL=https://tila-ai-api.01kbs9qyfs1fh8dnwn4k7g8mak.lmapp.run

# Optional: ElevenLabs for voice features
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_ELEVENLABS_AGENT_ID=your_agent_id
```

### Running Locally

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd raindrop-backend
raindrop build deploy --start
```

Visit `http://localhost:3000` to start using Tila AI!

---

## 📁 Project Structure

```
tila-ai/
│
├── 📂 raindrop-backend/           # Raindrop Platform Backend
│   ├── 📂 src/
│   │   ├── 📂 api/
│   │   │   ├── index.ts          # Main API routes & AI endpoints
│   │   │   └── raindrop.gen.ts   # Generated types
│   │   ├── 📂 user-state/
│   │   │   └── index.ts          # Actor for state management
│   │   └── 📂 _app/
│   │       ├── auth.ts           # JWT authentication
│   │       └── cors.ts           # CORS configuration
│   ├── raindrop.manifest         # Application manifest
│   ├── package.json
│   └── tsconfig.json
│
├── 📂 components/                 # React UI Components
│   ├── ChatArea.tsx              # AI Chat interface
│   ├── CodeEditor.tsx            # Code editing with AI
│   ├── Notebook.tsx              # Interactive notebooks
│   ├── Sidebar.tsx               # Navigation
│   └── LandingPage.tsx           # Welcome screen
│
├── 📂 services/                   # Frontend Services
│   ├── api.ts                    # API client
│   ├── apiService.ts             # Extended API service
│   ├── geminiService.ts          # Gemini AI integration
│   └── audioUtils.ts             # Voice features
│
├── App.tsx                       # Main React application
├── types.ts                      # TypeScript definitions
├── .env.local                    # Environment configuration
├── package.json
└── README.md
```

---

## 📡 API Documentation

### Base URL
```
Production: https://tila-ai-api.01kbs9qyfs1fh8dnwn4k7g8mak.lmapp.run
Development: http://localhost:5000
```

### Health Check
```http
GET /health
GET /api/health
```

### 🔐 Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 🤖 AI Endpoints

#### Generate AI Response
```http
POST /api/ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Explain how async/await works in JavaScript"
}
```

#### Generate Code
```http
POST /api/ai/code-generation
Authorization: Bearer <token>
Content-Type: application/json

{
  "requirements": "Create a function to validate email addresses",
  "language": "typescript",
  "framework": "none"
}
```

#### Analyze Code
```http
POST /api/ai/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

### 📊 Data Management

#### Projects
```http
GET    /api/projects              # List all projects
POST   /api/projects              # Create project
```

#### Chat Sessions
```http
GET    /api/chats                 # List chat sessions
POST   /api/chats                 # Create chat session
POST   /api/chats/:id/messages    # Send message (triggers AI response)
```

#### Chat History
```http
GET    /api/chat-history          # List saved histories
POST   /api/chat-history          # Save chat history
GET    /api/chat-history/:id      # Get specific history
PUT    /api/chat-history/:id      # Update history
DELETE /api/chat-history/:id      # Delete history
```

#### Community
```http
GET    /api/community             # List community posts
POST   /api/community             # Create post
```

---

## 🌧️ Raindrop Platform Integration

### Manifest Configuration

```hcl
application "tila-ai" {
  
  # Public API Service
  service "api" {
    visibility = "public"
    domain {
      cname = "tila-ai-api"
    }
  }
  
  # AI-Powered Document Storage
  smartbucket "documents" {}
  
  # Context-Aware AI Memory
  smartmemory "chat-memory" {}
  
  # Fast Session Storage
  kv_cache "sessions" {}
  
  # Stateful User Management
  actor "user-state" {}
  
  # Secure Environment Variables
  env "GEMINI_API_KEY" { secret = true }
  env "JWT_SECRET" { secret = true }
}
```

### Raindrop Components Used

| Component | Purpose | AI Enhancement |
|-----------|---------|----------------|
| **Service** | HTTP API endpoints | Serves AI-powered responses |
| **SmartMemory** | Conversation context | Enables context-aware AI chat |
| **SmartBucket** | Document storage | AI-searchable code storage |
| **KV Cache** | Session management | Fast AI response caching |
| **Actor** | User state | Personalized AI learning |

---

## 🚀 Deployment

### Deploy to Raindrop Cloud

```bash
cd raindrop-backend

# Authenticate (first time only)
raindrop auth login

# Deploy application
raindrop build deploy --start

# Check deployment status
raindrop build status

# View logs
raindrop logs tail --lines 20
```

### Environment Variables

```bash
# Set Gemini API Key
raindrop build env set GEMINI_API_KEY "your-api-key"

# Set JWT Secret
raindrop build env set JWT_SECRET "your-secret"

# Redeploy with new variables
raindrop build deploy --amend --start
```

### Useful Commands

```bash
# Stop application
raindrop build stop

# View all logs
raindrop logs tail

# Query specific logs
raindrop logs query --since 1h

# Check service URLs
raindrop build find
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, TypeScript, Vite | Modern, fast UI |
| **Styling** | TailwindCSS | Responsive design |
| **Backend** | Hono.js | Fast, lightweight API |
| **Platform** | Raindrop Framework | Serverless infrastructure |
| **AI Engine** | Google Gemini 1.5 Flash | Code generation & analysis |
| **Infrastructure** | Vultr Cloud | Scalable hosting |
| **Auth** | JWT | Secure authentication |
| **Storage** | KV Cache, SmartBucket | Data persistence |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **LiquidMetal AI** - For the amazing Raindrop Platform
- **Vultr** - For reliable cloud infrastructure
- **Google** - For Gemini AI capabilities

---

<div align="center">

### 🌧️ Tila AI - Where Intelligence Meets Code

[⬆ Back to Top](#-tila-ai)

</div>
