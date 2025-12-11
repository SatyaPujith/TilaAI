// Raindrop Backend API Service
const API_BASE_URL = import.meta.env.local.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async register(userData: { email: string; password: string; name: string }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Projects (Raindrop Platform)
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(projectData: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async saveSnippet(projectId: string, snippet: any) {
    return this.request(`/projects/${projectId}/snippets`, {
      method: 'POST',
      body: JSON.stringify(snippet),
    });
  }

  // Chat (AI-Powered via Raindrop)
  async getChatSessions() {
    return this.request('/chats');
  }

  async getChatSession(id: string) {
    return this.request(`/chats/${id}`);
  }

  async createChatSession(sessionData: any) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async addMessage(sessionId: string, message: any) {
    return this.request(`/chats/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async getChatMessages(sessionId: string) {
    return this.request(`/chats/${sessionId}/messages`);
  }

  async deleteChatSession(id: string) {
    return this.request(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Services (Raindrop Platform)
  async generateAIResponse(prompt: string, context?: any) {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    });
  }

  async generateCode(requirements: any) {
    return this.request('/ai/code-generation', {
      method: 'POST',
      body: JSON.stringify(requirements),
    });
  }

  async analyzeCode(code: string, language: string) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async optimizeCode(code: string, language: string, goals?: string[]) {
    return this.request('/ai/optimize', {
      method: 'POST',
      body: JSON.stringify({ code, language, goals }),
    });
  }

  async debugCode(code: string, error: string, language: string) {
    return this.request('/ai/debug', {
      method: 'POST',
      body: JSON.stringify({ code, error, language }),
    });
  }

  async explainCode(code: string, language: string) {
    return this.request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async reviewCode(code: string, language: string, focusAreas?: string[]) {
    return this.request('/ai/code-review', {
      method: 'POST',
      body: JSON.stringify({ code, language, focusAreas }),
    });
  }

  async generateProjectStructure(projectType: string, framework: string, features?: string[]) {
    return this.request('/ai/project-structure', {
      method: 'POST',
      body: JSON.stringify({ projectType, framework, features }),
    });
  }

  // Deployment (Vultr Integration)
  async deployToVultr(projectId: string, config?: any) {
    return this.request('/deploy/vultr', {
      method: 'POST',
      body: JSON.stringify({ projectId, config }),
    });
  }

  async getDeploymentStatus(projectId: string) {
    return this.request(`/deploy/status/${projectId}`);
  }

  async scaleDeployment(projectId: string, plan: string) {
    return this.request(`/deploy/scale/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async deleteDeployment(projectId: string) {
    return this.request(`/deploy/${projectId}`, {
      method: 'DELETE',
    });
  }

  async getDeploymentMetrics(projectId: string) {
    return this.request(`/deploy/metrics/${projectId}`);
  }

  async getDeployments() {
    return this.request('/deploy');
  }

  // Platform Status
  async getHealthStatus() {
    return this.request('/health');
  }

  async getPlatformStatus() {
    return this.request('/platform/status');
  }
}

export const apiService = new ApiService();
export default apiService;