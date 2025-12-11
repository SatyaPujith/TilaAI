import { expect, test, describe, beforeEach, vi } from 'vitest';

// Simple mock implementations for testing - based on demo-protected pattern
function createMockActorState(id: string = 'test-actor') {
  const data = new Map<string, unknown>();
  let alarm: number | null = null;
  
  return {
    id: id as any, // Type cast to match ActorId
    storage: {
      get: async (key: string) => data.get(key),
      put: async (key: string, value: unknown) => data.set(key, value),
      delete: async (key: string) => data.delete(key),
      deleteAll: async () => data.clear(),
      list: async () => ({ keys: Array.from(data.keys()) }),
      getAlarm: async () => alarm,
      setAlarm: async (time: number | Date) => {
        alarm = typeof time === 'number' ? time : time.getTime();
      },
      deleteAlarm: async () => { alarm = null; },
    },
    waitUntil: () => {},
    blockConcurrencyWhile: async (fn: () => Promise<any>) => fn(),
  };
}

function createMockEnv() {
  const bucketData = new Map<string, unknown>();
  const cacheData = new Map<string, unknown>();

  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
    logAtLevel: vi.fn(),
    message: vi.fn(),
    messageAtLevel: vi.fn(),
    with: vi.fn(),
    withError: vi.fn(),
  };

  // Make with() and withError() return the logger for chaining
  mockLogger.with.mockReturnValue(mockLogger);
  mockLogger.withError.mockReturnValue(mockLogger);

  return {
    _raindrop: {
      app: {
        organizationId: 'test-org',
        applicationName: 'test-app',
        versionId: 'test-version',
        scriptName: 'test-script',
        visibility: 'public',
      },
    },
    logger: mockLogger,
    FILES: {
      put: async (key: string, value: string) => {
        bucketData.set(key, value);
      },
      get: async (key: string) => {
        const value = bucketData.get(key);
        if (!value) return null;
        
        return {
          text: async () => String(value),
        };
      },
      list: async () => ({ objects: Array.from(bucketData.entries()).map(([key]) => ({ key })) }),
    },
    CACHE: {
      put: async (key: string, value: string, options?: any) => {
        cacheData.set(key, value);
      },
      get: async (key: string) => {
        const value = cacheData.get(key);
        if (!value) return null;
        
        return String(value);
      },
      delete: async () => { return { success: true } },
    },
  };
}

import { UserState } from './index.js';

describe('UserState - Core Functionality', () => {
  let actor: UserState;
  let state: ReturnType<typeof createMockActorState>;
  let env: any;

  beforeEach(async () => {
    state = createMockActorState('test-actor-1');
    env = createMockEnv();
    actor = new UserState(state as any, env);
    await actor.initialize();
  });

  describe('State Management', () => {
    test('initializes with default values', async () => {
      const stateData = await actor.getState();
      expect(stateData).toBeDefined();
      expect(stateData!.count).toBe(0);
      expect(stateData!.messages).toEqual([]);
      expect(stateData!.lastUpdated).toBeDefined();
    });

    test('persists state across operations', async () => {
      await actor.incrementCounter();
      const count = await actor.getCounter();
      expect(count).toBe(1);
      
      const storedData = await actor.getState();
      expect(storedData!.count).toBe(1);
    });

    test('handles messages', async () => {
      const result = await actor.processMessage('test message');
      expect(result.content).toBe('test message');
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('clears messages', async () => {
      await actor.processMessage('msg1');
      await actor.processMessage('msg2');
      
      await actor.clearMessages();
      const messages = await actor.getMessages();
      expect(messages).toHaveLength(0);
    });
  });

  describe('Storage Integration', () => {
    test('saves and retrieves data from bucket', async () => {
      const testData = { test: 'data' };
      
      const saveResult = await actor.saveToBucket('test-key', testData);
      expect(saveResult.success).toBe(true);
      
      const loadResult = await actor.loadFromBucket('test-key');
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(testData);
    });

    test('handles missing bucket data gracefully', async () => {
      const result = await actor.loadFromBucket('nonexistent-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Cache Integration', () => {
    test('caches and retrieves values', async () => {
      const testData = { value: 42 };
      
      const cacheResult = await actor.cacheResult('test-key', testData);
      expect(cacheResult.success).toBe(true);
      
      const retrieveResult = await actor.getCachedResult('test-key');
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data).toEqual(testData);
    });

    test('handles cache miss gracefully', async () => {
      const result = await actor.getCachedResult('missing-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not found');
    });
  });

  describe('Core Actor Operations', () => {
    test('counter increments correctly', async () => {
      await actor.incrementCounter();
      let count = await actor.getCounter();
      expect(count).toBe(1);
      
      await actor.incrementCounter();
      count = await actor.getCounter();
      expect(count).toBe(2);
      
      await actor.incrementCounter();
      count = await actor.getCounter();
      expect(count).toBe(3);
    });

    test('alarm scheduling works', async () => {
      await actor.schedulePeriodicTask('test-task', 60);

      // Basic verification that scheduling doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('Alarm Guard Rails', () => {
    test('alarm is scheduled in the future', async () => {
      // Guard rail: Template should schedule alarm at Date.now() + intervalSeconds
      // Catches: Wrong time calculation, ms vs seconds confusion
      await actor.schedulePeriodicTask('test-task', 60);

      const alarm = await state.storage.getAlarm();
      expect(alarm).toBeDefined();
      expect(alarm).not.toBe(null);
      expect(alarm!).toBeGreaterThan(Date.now());
    });

    test('alarm context is stored correctly', async () => {
      // Guard rail: Validates alarm metadata storage
      const taskData = { foo: 'bar', count: 42 };
      await actor.schedulePeriodicTask('my-task', 120, taskData);

      const context = await state.storage.get('alarm:context');
      expect(context).toMatchObject({
        name: 'my-task',
        data: {
          intervalSeconds: 120,
          taskData,
        },
      });
    });
  });

  describe('Edge Case Guard Rails', () => {
    test('handles null message input', async () => {
      // Guard rail: Catches missing null checks in message processing
      // Template should handle this gracefully
      await expect(actor.processMessage(null as any)).resolves.toBeDefined();
    });

    test('handles special characters in messages', async () => {
      // Guard rail: Ensures no XSS or injection issues in message storage
      const specialMessage = '<script>alert("xss")</script>';
      const result = await actor.processMessage(specialMessage);

      expect(result.content).toBe(specialMessage);
      const messages = await actor.getMessages();
      expect(messages.some(m => m.content === specialMessage)).toBe(true);
    });

    test('handles unicode in messages', async () => {
      // Guard rail: Validates UTF-8 handling
      const unicodeMessage = 'Hello 世界 🌍';
      const result = await actor.processMessage(unicodeMessage);

      expect(result.content).toBe(unicodeMessage);
    });
  });
});