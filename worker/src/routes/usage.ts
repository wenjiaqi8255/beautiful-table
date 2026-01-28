import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const usage = new Hono();

// Schema for usage logging
const usageLogSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['export', 'parse']),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/usage/log
 *
 * Logs a usage event and deducts credits
 * Request body: { userId: string, action: 'export' | 'parse', metadata?: any }
 * Returns: { success: boolean, creditsRemaining: number }
 */
usage.post('/api/usage/log', zValidator('json', usageLogSchema), async (c) => {
  const { userId, action, metadata } = c.req.valid('json');

  try {
    const db = c.env.DB;

    // Get current user credits
    const userResult = await db
      .prepare('SELECT credits_remaining FROM users WHERE id = ?')
      .bind(userId)
      .first<{ credits_remaining: number }>();

    if (!userResult) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const currentCredits = userResult.credits_remaining;

    // Check if user has enough credits
    if (currentCredits <= 0) {
      return c.json({
        success: false,
        error: 'Insufficient credits',
        creditsRemaining: 0
      }, 402);
    }

    // Determine credit cost (export costs 1 credit, parsing is free)
    const creditCost = action === 'export' ? 1 : 0;

    // Deduct credit if needed
    if (creditCost > 0) {
      await db
        .prepare('UPDATE users SET credits_remaining = credits_remaining - ?, updated_at = datetime("now") WHERE id = ?')
        .bind(creditCost, userId)
        .run();
    }

    // Log usage event
    await db
      .prepare(`
        INSERT INTO usage_logs (user_id, action, metadata, created_at)
        VALUES (?, ?, ?, datetime("now"))
      `)
      .bind(userId, action, JSON.stringify(metadata || {}))
      .run();

    // Get updated credits
    const updatedResult = await db
      .prepare('SELECT credits_remaining FROM users WHERE id = ?')
      .bind(userId)
      .first<{ credits_remaining: number }>();

    return c.json({
      success: true,
      creditsRemaining: updatedResult?.credits_remaining || 0
    });
  } catch (error) {
    console.error('Usage logging error:', error);
    return c.json({
      success: false,
      error: 'Failed to log usage',
      creditsRemaining: 0
    }, 500);
  }
});

/**
 * GET /api/usage/history/:userId
 *
 * Retrieves usage history for a user
 * Returns: { success: boolean, history: UsageLog[] }
 */
usage.get('/api/usage/history/:userId', async (c) => {
  const userId = c.req.param('userId');

  try {
    const db = c.env.DB;

    const logs = await db
      .prepare(`
        SELECT id, user_id, action, metadata, created_at
        FROM usage_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `)
      .bind(userId)
      .all<{
        id: number;
        user_id: string;
        action: string;
        metadata: string;
        created_at: string;
      }>();

    const history = logs.results.map(log => ({
      id: log.id,
      userId: log.user_id,
      action: log.action,
      metadata: JSON.parse(log.metadata || '{}'),
      createdAt: log.created_at
    }));

    return c.json({ success: true, history });
  } catch (error) {
    console.error('Usage history error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch usage history',
      history: []
    }, 500);
  }
});

export { usage };
