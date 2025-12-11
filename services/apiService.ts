const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(name: string, email: string, password: string) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  logout() {
    this.clearToken();
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(title: string, description: string) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  async updateProject(id: string, project: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
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

  // Challenges
  async getChallenges() {
    return this.request('/challenges');
  }

  async getChallengesByTopic(topic: string) {
    return this.request(`/challenges/topic/${encodeURIComponent(topic)}`);
  }

  async createChallenge(challenge: any) {
    return this.request('/challenges', {
      method: 'POST',
      body: JSON.stringify(challenge),
    });
  }

  async solveChallenge(id: string) {
    return this.request(`/challenges/${id}/solve`, {
      method: 'POST',
    });
  }

  async startChallenge(id: string) {
    return this.request(`/challenges/${id}/start`, {
      method: 'POST',
    });
  }

  async completeChallenge(id: string, solution: string) {
    return this.request(`/challenges/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ solution }),
    });
  }

  async getGlobalChallenges() {
    return this.request('/challenges/global');
  }

  // Chat Sessions
  async getChatSessions() {
    return this.request('/chats');
  }

  async getChatSession(id: string) {
    return this.request(`/chats/${id}`);
  }

  async createChatSession(session: any) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async addMessageToChat(sessionId: string, message: any) {
    return this.request(`/chats/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async deleteChatSession(id: string) {
    return this.request(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectChatHistory(projectId: string) {
    return this.request(`/chats/${projectId}/messages`);
  }

  async sendMessage(projectId: string, content: string, role: string = 'user') {
    return this.addMessageToChat(projectId, { content, role });
  }

  // Roadmaps
  async getRoadmaps() {
    return this.request('/roadmaps');
  }

  async createRoadmap(topic: string, nodes: any[], links: any[]) {
    return this.request('/roadmaps', {
      method: 'POST',
      body: JSON.stringify({ topic, nodes, links }),
    });
  }

  async updateRoadmapNode(roadmapId: string, nodeId: string, status: string) {
    return this.request(`/roadmaps/${roadmapId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async generateChallengesForNode(roadmapId: string, nodeId: string, nodeLabel: string) {
    return this.request(`/roadmaps/${roadmapId}/nodes/${nodeId}/challenges`, {
      method: 'POST',
      body: JSON.stringify({ nodeLabel }),
    });
  }

  // Save generated challenges
  async saveChallenges(challenges: any[], topic: string) {
    return this.request('/challenges/bulk', {
      method: 'POST',
      body: JSON.stringify({ challenges, topic }),
    });
  }

  // Snippets
  async getSnippets() {
    const grouped = await this.request('/snippets');
    // Flatten grouped snippets into array
    const snippets: any[] = [];
    Object.values(grouped).forEach((topicSnippets: any) => {
      snippets.push(...topicSnippets);
    });
    return snippets;
  }

  async getSnippetsByTopic(topic: string) {
    return this.request(`/snippets/topic/${encodeURIComponent(topic)}`);
  }

  async createSnippet(snippet: any) {
    return this.request('/snippets', {
      method: 'POST',
      body: JSON.stringify(snippet),
    });
  }

  async updateSnippet(id: string, snippet: any) {
    return this.request(`/snippets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(snippet),
    });
  }

  async deleteSnippet(id: string) {
    return this.request(`/snippets/${id}`, {
      method: 'DELETE',
    });
  }

  async getTopics() {
    return this.request('/snippets/topics/list');
  }

  // Chat History
  async getChatHistories() {
    return this.request('/chat-history');
  }

  async getChatHistory(id: string) {
    return this.request(`/chat-history/${id}`);
  }

  async saveChatHistory(title: string, messages: any[]) {
    return this.request('/chat-history', {
      method: 'POST',
      body: JSON.stringify({ title, messages }),
    });
  }

  async updateChatHistory(id: string, messages?: any[], title?: string) {
    const body: any = {};
    if (messages !== undefined) body.messages = messages;
    if (title !== undefined) body.title = title;
    
    return this.request(`/chat-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async deleteChatHistory(id: string) {
    return this.request(`/chat-history/${id}`, {
      method: 'DELETE',
    });
  }

  // Community
  async getCommunityPosts() {
    return this.request('/community');
  }

  async getCommunityPostsByTag(tag: string) {
    return this.request(`/community/tag/${encodeURIComponent(tag)}`);
  }

  async getMyPosts() {
    return this.request('/community/my-posts');
  }

  async getCommunityPost(id: string) {
    return this.request(`/community/${id}`);
  }

  async createCommunityPost(post: { title: string; description?: string; code?: string; language?: string; tags?: string[] }) {
    return this.request('/community', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async updateCommunityPost(id: string, post: any) {
    return this.request(`/community/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
    });
  }

  async deleteCommunityPost(id: string) {
    return this.request(`/community/${id}`, {
      method: 'DELETE',
    });
  }

  async likeCommunityPost(id: string) {
    return this.request(`/community/${id}/like`, {
      method: 'POST',
    });
  }

  async forkCommunityPost(id: string) {
    return this.request(`/community/${id}/fork`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
