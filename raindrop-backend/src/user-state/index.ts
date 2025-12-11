import { Actor, ActorState, ActorNamespace, type KvCachePutOptions } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

interface UserStateState {
  count: number;
  lastUpdated: string;
  userData: Record<string, any>;
  messages: Array<{
    id: string;
    content: string;
    timestamp: string;
  }>;
}

export class UserState extends Actor<Env> {
  constructor(state: ActorState, env: Env) {
    super(state, env);
  }

  // === Initialization ===

  async initialize(): Promise<void> {
    // Initialize default state if not exists
    const existing = await this.state.storage.get<UserStateState>('state');
    if (!existing) {
      await this.state.storage.put('state', {
        count: 0,
        lastUpdated: new Date().toISOString(),
        userData: {},
        messages: [],
      });
    }
  }

  // === Business Logic Methods ===

  async incrementCounter(): Promise<number> {
    const state = await this.state.storage.get<UserStateState>('state') || {
      count: 0,
      lastUpdated: new Date().toISOString(),
      userData: {},
      messages: [],
    };

    const newState = {
      ...state,
      count: state.count + 1,
      lastUpdated: new Date().toISOString(),
    };

    await this.state.storage.put('state', newState);
    this.env.logger.info('Counter incremented', { newCount: newState.count });
    return newState.count;
  }

  async getCounter(): Promise<number> {
    const state = await this.state.storage.get<UserStateState>('state');
    return state?.count || 0;
  }

  async processMessage(content: string): Promise<{ id: string; content: string; timestamp: string }> {
    const state = await this.state.storage.get<UserStateState>('state') || {
      count: 0,
      lastUpdated: new Date().toISOString(),
      userData: {},
      messages: [],
    };

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date().toISOString(),
    };

    const newState = {
      ...state,
      messages: [...state.messages, message],
      lastUpdated: new Date().toISOString(),
    };

    await this.state.storage.put('state', newState);
    this.env.logger.info('Message processed', { messageId: message.id });
    return message;
  }

  async getMessages(): Promise<Array<{ id: string; content: string; timestamp: string }>> {
    const state = await this.state.storage.get<UserStateState>('state');
    return state?.messages || [];
  }

  async clearMessages(): Promise<void> {
    const state = await this.state.storage.get<UserStateState>('state') || {
      count: 0,
      lastUpdated: new Date().toISOString(),
      userData: {},
      messages: [],
    };

    const newState = {
      ...state,
      messages: [],
      lastUpdated: new Date().toISOString(),
    };

    await this.state.storage.put('state', newState);
    this.env.logger.info('Messages cleared');
  }

  async getState(): Promise<UserStateState | null> {
    return await this.state.storage.get<UserStateState>('state') || null;
  }

  // === Storage Integration ===

  // Example: Save data to bucket
  async saveToBucket(key: string, data: any): Promise<{ success: boolean; key?: string; error?: string }> {
    try {
      // Use bucket binding (add bucket to manifest to use this feature)
      const bucket = (this.env as any).FILES;
      if (!bucket) {
        return { success: false, error: 'Bucket not configured - add bucket to manifest to use this feature' };
      }
      
      await bucket.put(key, JSON.stringify(data));
      this.env.logger.info('Data saved to bucket', { key });
      return { success: true, key };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.env.logger.error('Failed to save to bucket', { error: errorMessage, key });
      return { success: false, error: errorMessage };
    }
  }

  // Example: Load data from bucket
  async loadFromBucket(key: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use bucket binding (add bucket to manifest to use this feature)
      const bucket = (this.env as any).FILES;
      if (!bucket) {
        return { success: false, error: 'Bucket not configured - add bucket to manifest to use this feature' };
      }
      
      const object = await bucket.get(key);
      
      if (!object) {
        return { success: false, error: 'Not found' };
      }

      const text = await object.text();
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.env.logger.error('Failed to load from bucket', { error: errorMessage, key });
      return { success: false, error: errorMessage };
    }
  }

  // Example: List bucket contents (no search API exists)
  async listBucketContents(prefix?: string): Promise<{ success: boolean; items?: string[]; error?: string }> {
    try {
      // Use bucket binding (add bucket to manifest to use this feature)
      const bucket = (this.env as any).FILES;
      if (!bucket) {
        return { success: false, error: 'Bucket not configured - add bucket to manifest to use this feature' };
      }
      
      const options = prefix ? { prefix } : undefined;
      const result = await bucket.list(options);
      
      const items = result.objects.map((obj: any) => obj.key);
      return { success: true, items };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.env.logger.error('Failed to list bucket contents', { error: errorMessage, prefix });
      return { success: false, error: errorMessage };
    }
  }

  // === Cache Integration ===

  async cacheResult(key: string, result: any, ttlSeconds?: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Use KV cache binding (add kv_cache to manifest to use this feature)
      const cache = (this.env as any).CACHE || this.env.mem; // mem is always available
      
      const options: KvCachePutOptions = {};
      if (ttlSeconds) {
        options.expirationTtl = ttlSeconds;
      }

      await cache.put(key, JSON.stringify(result), options);
      this.env.logger.info('Result cached', { key, ttl: ttlSeconds });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.env.logger.error('Failed to cache result', { error: errorMessage, key });
      return { success: false, error: errorMessage };
    }
  }

  async getCachedResult(key: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use KV cache binding (add kv_cache to manifest to use this feature)
      const cache = (this.env as any).CACHE || this.env.mem; // mem is always available
      const cached = await cache.get(key);
      
      if (cached === null) {
        return { success: false, error: 'Not found in cache' };
      }

      const data = JSON.parse(cached);
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.env.logger.error('Failed to get cached result', { error: errorMessage, key });
      return { success: false, error: errorMessage };
    }
  }

  // === Queue Integration ===

  // Note: Queue requires adding queue to manifest
  async sendToQueue(message: any, delaySeconds?: number): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Queue not configured - add queue to manifest to use this feature' };
  }

  // === Alarm Scheduling ===

  async schedulePeriodicTask(taskName: string, intervalSeconds: number, taskData?: any): Promise<void> {
    const scheduledTime = new Date(Date.now() + intervalSeconds * 1000);
    
    // Store alarm context
    await this.state.storage.put('alarm:context', {
      name: taskName,
      data: { intervalSeconds, taskData }
    });
    
    // Set alarm using storage API
    await this.state.storage.setAlarm(scheduledTime);

    this.env.logger.info('Periodic task scheduled', { 
      taskName, 
      scheduledFor: scheduledTime.toISOString() 
    });
  }

  // Alarm handler (called automatically when alarm triggers)
  async alarm(): Promise<void> {
    try {
      const alarmContext = await this.state.storage.get<{
        name: string;
        data: any;
      }>('alarm:context');
      
      if (!alarmContext) {
        this.env.logger.warn('No alarm context found');
        return;
      }
      
      this.env.logger.info('Alarm triggered', { name: alarmContext.name, data: alarmContext.data });
      
      switch (alarmContext.name) {
        case 'periodic-count':
          const newCount = await this.incrementCounter();
          this.env.logger.info('Incremented count via alarm', { newCount });
          await this.schedulePeriodicTask('periodic-count', alarmContext.data.intervalSeconds);
          break;
        
        case 'cleanup':
          await this.clearMessages();
          this.env.logger.info('Completed cleanup task via alarm');
          await this.schedulePeriodicTask('cleanup', alarmContext.data.intervalSeconds);
          break;
        
        default:
          this.env.logger.warn('Unknown alarm type', { alarmType: alarmContext.name });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.env.logger.error('Error in alarm handler', { error: errorMessage });
    }
  }

  // === Required Test Methods ===

  async processUserData(userData: any): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      if (!userData.userId || !userData.email) {
        return { success: false, error: 'Missing required fields' };
      }

      // Increment counter
      await this.incrementCounter();

      // Save to bucket
      await this.saveToBucket(`user:${userData.userId}`, userData);

      // Cache the result
      await this.cacheResult(`user:${userData.userId}`, userData);

      // Send to queue (if configured)
      await this.sendToQueue({ type: 'user_processed', userId: userData.userId });

      return { success: true, userId: userData.userId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async getUserData(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Try cache first
      const cached = await this.getCachedResult(`user:${userId}`);
      if (cached.success) {
        return cached;
      }

      // Try bucket
      const bucketResult = await this.loadFromBucket(`user:${userId}`);
      if (bucketResult.success) {
        // Cache for future requests
        await this.cacheResult(`user:${userId}`, bucketResult.data);
        return bucketResult;
      }

      return { success: false, error: 'User not found' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async expensiveComputation(input: number): Promise<number> {
    const cacheKey = `compute:${input}`;
    
    // Try cache first
    const cached = await this.getCachedResult(cacheKey);
    if (cached.success) {
      return cached.data;
    }

    // Simulate expensive computation as expected by tests
    const result = Math.pow(input, 2) + Math.sqrt(input);
    
    // Cache the result
    await this.cacheResult(cacheKey, result);
    
    return result;
  }

  async batchProcessMessages(messages: string[]): Promise<{ processed: number; errors: string[] }> {
    let processed = 0;
    const errors: string[] = [];

    for (const message of messages) {
      try {
        await this.processMessage(message);
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMessage);
        this.env.logger.error('Failed to process message', { message, error: errorMessage });
      }
    }

    return { processed, errors };
  }
}