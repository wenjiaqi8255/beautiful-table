import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { user, usageLogs } from '../db/schema';

const usage = new Hono<{ Bindings: Env }>();

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
    const db = getDb(c.env.DATABASE_URL);

    // Get current user credits
    const userResult = await db
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userResult[0]) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const currentCredits = userResult[0].credits;

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
        .update(user)
        .set({
          credits: sql`${user.credits} - ${creditCost}`,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(user.id, userId));
    }

    // Log usage event
    const logId = crypto.randomUUID();
    await db.insert(usageLogs).values({
      id: logId,
      userId,
      creditsUsed: creditCost,
      operation: action,
      createdAt: Math.floor(Date.now() / 1000),
    });

    // Get updated credits
    const updatedResult = await db
      .select({ credits: user.credits })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return c.json({
      success: true,
      creditsRemaining: updatedResult[0]?.credits || 0
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
    const db = getDb(c.env.DATABASE_URL);

    const logs = await db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(desc(usageLogs.createdAt))
      .limit(50);

    const history = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      creditsUsed: log.creditsUsed,
      operation: log.operation,
      createdAt: log.createdAt,
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
