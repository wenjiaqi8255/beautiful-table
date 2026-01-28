import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { usage } from './usage';

// Mock DB binding
const mockDb = {
  prepare: vi.fn(),
} as any;

const mockEnv = {
  DB: mockDb,
};

describe('Usage Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/', usage);
    vi.clearAllMocks();
  });

  it('should log usage and deduct credits for export', async () => {
    const userId = 'test-user-1';
    const mockResult = { meta: { last_row_id: 1 } };
    const mockUserResult = { credits_remaining: 10 };
    const mockUpdatedResult = { credits_remaining: 9 };

    mockDb.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(mockUserResult) // Initial credits check
          .mockResolvedValueOnce(mockUpdatedResult), // After deduction
        run: vi.fn().mockResolvedValue(mockResult),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    });

    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'export',
        metadata: { format: 'png', rows: 10 }
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    const data = await response.json() as { success: boolean; creditsRemaining: number };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.creditsRemaining).toBe(9);
  });

  it('should not deduct credits for parse action', async () => {
    const userId = 'test-user-2';
    const mockUserResult = { credits_remaining: 10 };
    const mockUpdatedResult = { credits_remaining: 10 };

    mockDb.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(mockUserResult)
          .mockResolvedValueOnce(mockUpdatedResult),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    });

    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'parse',
        metadata: { format: 'tsv' }
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    const data = await response.json() as { success: boolean; creditsRemaining: number };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.creditsRemaining).toBe(10); // Should still be 10
  });

  it('should return 404 for non-existent user', async () => {
    mockDb.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    });

    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'non-existent',
        action: 'export',
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    const data = await response.json() as { success: boolean; error: string };

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('User not found');
  });

  it('should return 402 when insufficient credits', async () => {
    const userId = 'poor-user';
    const mockUserResult = { credits_remaining: 0 };

    // Reset mock before setting up new behavior
    mockDb.prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockUserResult),
        run: vi.fn(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    });

    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'export',
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    const data = await response.json() as { success: boolean; error: string; creditsRemaining: number };

    expect(response.status).toBe(402);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Insufficient credits');
    expect(data.creditsRemaining).toBe(0);
  });

  it('should retrieve usage history', async () => {
    const userId = 'test-user-3';
    const mockHistory = [
      { id: 1, user_id: userId, action: 'export', metadata: '{}', created_at: '2024-01-01' },
      { id: 2, user_id: userId, action: 'parse', metadata: '{}', created_at: '2024-01-02' },
    ];

    mockDb.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn(),
        run: vi.fn(),
        all: vi.fn().mockResolvedValue({ results: mockHistory }),
      }),
    });

    const request = new Request(`http://localhost/api/usage/history/${userId}`);

    const response = await usage.fetch(request, mockEnv);
    const data = await response.json() as { success: boolean; history: Array<any> };

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.history)).toBe(true);
    expect(data.history.length).toBe(2);
  });

  it('should validate request body - missing userId', async () => {
    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId: '', // Invalid: empty string
        action: 'export',
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    // Zod validator should catch this
    expect([400, 422]).toContain(response.status);
  });

  it('should validate request body - invalid action', async () => {
    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-user',
        action: 'invalid-action',
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    expect([400, 422]).toContain(response.status);
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'error-user';

    mockDb.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        run: vi.fn(),
        all: vi.fn().mockResolvedValue({ results: [] }),
      }),
    });

    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'export',
      }),
    });

    const response = await usage.fetch(request, mockEnv);
    const data = await response.json() as { success: boolean; error: string };

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to log usage');
  });

  it('should store metadata correctly', async () => {
    const userId = 'test-user-4';
    const metadata = {
      format: 'jpg',
      quality: 0.95,
      dimensions: { width: 1920, height: 1080 }
    };

    const mockUserResult = { credits_remaining: 10 };
    const mockUpdatedResult = { credits_remaining: 9 };

    mockDb.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(mockUserResult)
          .mockResolvedValueOnce(mockUpdatedResult),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } }),
        all: vi.fn().mockResolvedValue({
          results: [{
            id: 1,
            user_id: userId,
            action: 'export',
            metadata: JSON.stringify(metadata),
            created_at: '2024-01-01'
          }]
        }),
      }),
    });

    const request = new Request('http://localhost/api/usage/log', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        action: 'export',
        metadata
      }),
    });

    await usage.fetch(request, mockEnv);

    // Verify bind was called with metadata JSON string
    expect(mockDb.prepare).toHaveBeenCalled();
    const bindCalls = mockDb.prepare().bind.mock.calls;
    const metadataCall = bindCalls.find(call =>
      call[1] === userId && call[2] === 'export'
    );
    expect(metadataCall).toBeDefined();
  });
});
