import { Hono } from 'hono';
import { verifyAuth } from '../lib/auth';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { user } from '../db/schema';

const userRoutes = new Hono<{ Bindings: Env }>();

// GET /api/users/me - Get current user
userRoutes.get('/me', verifyAuth, async (c) => {
  const userId = c.get('userId');
  const db = getDb(c.env.DATABASE_URL);

  try {
    const result = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        credits: user.credits,
        totalPurchased: user.totalPurchased,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!result[0]) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { userRoutes };
