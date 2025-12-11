import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Hono } from 'hono';
import { Env } from './raindrop.gen';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  c.env.logger.info(`${c.req.method} ${c.req.url}`, { status: c.res.status, duration: `${Date.now() - start}ms` });
});

app.get('/health', (c) => c.json({ status: 'ok', platform: 'raindrop', infrastructure: 'vultr', timestamp: new Date().toISOString() }));
app.get('/api/health', (c) => c.json({ status: 'ok', platform: 'raindrop', infrastructure: 'vultr', timestamp: new Date().toISOString() }));

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) return c.json({ error: 'Missing fields' }, 400);
    const userId = `user-${Date.now()}`;
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    await c.env.SESSIONS.put(token, JSON.stringify({ userId, email, name }), { expirationTtl: 604800 });
    return c.json({ token, user: { id: userId, email, name }, platform: 'raindrop' });
  } catch (error) {
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Missing fields' }, 400);
    const userId = `user-${Date.now()}`;
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    await c.env.SESSIONS.put(token, JSON.stringify({ userId, email }), { expirationTtl: 604800 });
    return c.json({ token, user: { id: userId, email, name: email.split('@')[0] }, platform: 'raindrop' });
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json({ error: 'No token' }, 401);
    const session = await c.env.SESSIONS.get(token);
    if (!session) return c.json({ error: 'Invalid token' }, 401);
    const data = JSON.parse(session);
    return c.json({ user: { id: data.userId, email: data.email, name: data.name }, platform: 'raindrop' });
  } catch { return c.json({ error: 'Auth failed' }, 401); }
});


// AI Generation using Gemini API
app.post('/api/ai/generate', async (c) => {
  try {
    const { prompt } = await c.req.json();
    if (!prompt) return c.json({ error: 'Prompt required' }, 400);
    const apiKey = c.env.GEMINI_API_KEY;
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are Tiva AI, a coding assistant.\n\nUser: ${prompt}` }] }],
          generationConfig: { maxOutputTokens: 1024 }
        })
      }
    );
    const data = await resp.json() as any;
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI response';
    return c.json({ content, platform: 'raindrop', infrastructure: 'vultr', model: 'gemini-1.5-flash', timestamp: new Date().toISOString() });
  } catch (error) {
    c.env.logger.error('AI error', { error: String(error) });
    return c.json({ error: 'AI failed', details: String(error) }, 500);
  }
});

app.post('/api/ai/code-generation', async (c) => {
  try {
    const { requirements, language, framework } = await c.req.json();
    const prompt = `Generate ${language || 'JavaScript'} code: ${requirements}. ${framework ? `Use ${framework}.` : ''}`;
    const apiKey = c.env.GEMINI_API_KEY;
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate code:\n\n${prompt}` }] }],
          generationConfig: { maxOutputTokens: 2048 }
        })
      }
    );
    const data = await resp.json() as any;
    const code = data?.candidates?.[0]?.content?.parts?.[0]?.text || '// Code';
    return c.json({ code, language: language || 'javascript', platform: 'raindrop', infrastructure: 'vultr', timestamp: new Date().toISOString() });
  } catch (error) {
    return c.json({ error: 'Code generation failed' }, 500);
  }
});

app.post('/api/ai/analyze', async (c) => {
  try {
    const { code, language } = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze this ${language || 'code'}:\n\n${code}` }] }],
          generationConfig: { maxOutputTokens: 1024 }
        })
      }
    );
    const data = await resp.json() as any;
    const analysis = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis complete';
    return c.json({ analysis, language, platform: 'raindrop', infrastructure: 'vultr', score: 85, timestamp: new Date().toISOString() });
  } catch (error) {
    return c.json({ error: 'Analysis failed' }, 500);
  }
});


// Projects
app.get('/api/projects', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const list = await c.env.SESSIONS.get(`projects:${userId}`);
    return c.json(list ? JSON.parse(list) : []);
  } catch { return c.json([]); }
});

app.post('/api/projects', async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const project = { id: `project-${Date.now()}`, ...body, userId, createdAt: new Date().toISOString(), platform: 'raindrop' };
    const list = await c.env.SESSIONS.get(`projects:${userId}`);
    const projects = list ? JSON.parse(list) : [];
    projects.push(project);
    await c.env.SESSIONS.put(`projects:${userId}`, JSON.stringify(projects));
    return c.json(project, 201);
  } catch { return c.json({ error: 'Failed' }, 500); }
});

// Chats
app.get('/api/chats', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const list = await c.env.SESSIONS.get(`chats:${userId}`);
    return c.json(list ? JSON.parse(list) : []);
  } catch { return c.json([]); }
});

app.post('/api/chats', async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const chat = { id: `chat-${Date.now()}`, ...body, userId, messages: [], createdAt: new Date().toISOString(), platform: 'raindrop' };
    const list = await c.env.SESSIONS.get(`chats:${userId}`);
    const chats = list ? JSON.parse(list) : [];
    chats.push(chat);
    await c.env.SESSIONS.put(`chats:${userId}`, JSON.stringify(chats));
    return c.json(chat, 201);
  } catch { return c.json({ error: 'Failed' }, 500); }
});

app.post('/api/chats/:id/messages', async (c) => {
  try {
    const chatId = c.req.param('id');
    const { content, role } = await c.req.json();
    const actorId = c.env.USER_STATE.idFromName(chatId);
    const actor = c.env.USER_STATE.get(actorId);
    const userMessage = await actor.processMessage(content);
    let aiMessage = null;
    if (role === 'user') {
      const apiKey = c.env.GEMINI_API_KEY;
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are Tiva AI.\n\nUser: ${content}` }] }],
            generationConfig: { maxOutputTokens: 1024 }
          })
        }
      );
      const data = await resp.json() as any;
      const aiContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI response';
      aiMessage = await actor.processMessage(aiContent);
    }
    const messages = await actor.getMessages();
    return c.json({ userMessage, aiMessage, messages, platform: 'raindrop', infrastructure: 'vultr' });
  } catch (error) {
    return c.json({ error: 'Failed', details: String(error) }, 500);
  }
});


// Chat History
app.get('/api/chat-history', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const list = await c.env.SESSIONS.get(`chat-history:${userId}`);
    return c.json(list ? JSON.parse(list) : []);
  } catch { return c.json([]); }
});

app.post('/api/chat-history', async (c) => {
  try {
    const { title, messages } = await c.req.json();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const history = { id: `history-${Date.now()}`, title, messages: messages || [], userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), platform: 'raindrop' };
    const list = await c.env.SESSIONS.get(`chat-history:${userId}`);
    const histories = list ? JSON.parse(list) : [];
    histories.push(history);
    await c.env.SESSIONS.put(`chat-history:${userId}`, JSON.stringify(histories));
    return c.json(history, 201);
  } catch { return c.json({ error: 'Failed to save chat history' }, 500); }
});

app.get('/api/chat-history/:id', async (c) => {
  try {
    const historyId = c.req.param('id');
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const list = await c.env.SESSIONS.get(`chat-history:${userId}`);
    const histories = list ? JSON.parse(list) : [];
    const history = histories.find((h: any) => h.id === historyId);
    if (!history) return c.json({ error: 'Not found' }, 404);
    return c.json(history);
  } catch { return c.json({ error: 'Failed' }, 500); }
});

app.put('/api/chat-history/:id', async (c) => {
  try {
    const historyId = c.req.param('id');
    const { title, messages } = await c.req.json();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const list = await c.env.SESSIONS.get(`chat-history:${userId}`);
    const histories = list ? JSON.parse(list) : [];
    const idx = histories.findIndex((h: any) => h.id === historyId);
    if (idx === -1) return c.json({ error: 'Not found' }, 404);
    if (title !== undefined) histories[idx].title = title;
    if (messages !== undefined) histories[idx].messages = messages;
    histories[idx].updatedAt = new Date().toISOString();
    await c.env.SESSIONS.put(`chat-history:${userId}`, JSON.stringify(histories));
    return c.json(histories[idx]);
  } catch { return c.json({ error: 'Failed to update' }, 500); }
});

app.delete('/api/chat-history/:id', async (c) => {
  try {
    const historyId = c.req.param('id');
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) userId = JSON.parse(s).userId; }
    const list = await c.env.SESSIONS.get(`chat-history:${userId}`);
    const histories = list ? JSON.parse(list) : [];
    const filtered = histories.filter((h: any) => h.id !== historyId);
    await c.env.SESSIONS.put(`chat-history:${userId}`, JSON.stringify(filtered));
    return c.json({ success: true });
  } catch { return c.json({ error: 'Failed to delete' }, 500); }
});

// Community
app.get('/api/community', async (c) => {
  try {
    const list = await c.env.SESSIONS.get('community:posts');
    return c.json(list ? JSON.parse(list) : []);
  } catch { return c.json([]); }
});

app.post('/api/community', async (c) => {
  try {
    const body = await c.req.json();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    let userId = 'demo-user';
    let userName = 'Anonymous';
    if (token) { const s = await c.env.SESSIONS.get(token); if (s) { const d = JSON.parse(s); userId = d.userId; userName = d.name || d.email?.split('@')[0] || 'Anonymous'; } }
    const post = { id: `post-${Date.now()}`, ...body, userId, userName, likes: 0, forks: 0, createdAt: new Date().toISOString(), platform: 'raindrop' };
    const list = await c.env.SESSIONS.get('community:posts');
    const posts = list ? JSON.parse(list) : [];
    posts.unshift(post);
    await c.env.SESSIONS.put('community:posts', JSON.stringify(posts));
    return c.json(post, 201);
  } catch { return c.json({ error: 'Failed' }, 500); }
});

class ApiService extends Service<Env> {
  async fetch(request: Request, env: Env, ctx: unknown): Promise<Response> {
    return app.fetch(request, env, ctx as any);
  }
}

export default ApiService;
