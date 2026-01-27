import { Hono } from 'hono';
import { verifyAuth } from '../lib/auth';

type Bindings = {
  DB: D1Database;
};

const userRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/users - Get current user
userRoutes.get('/', verifyAuth, async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  try {
    const user = await db
      .prepare('SELECT id, email, credits, created_at FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /api/users - Create new user
userRoutes.post('/', verifyAuth, async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  try {
    const body = await c.req.json();
    const { id, email } = body;

    if (!id || !email) {
      return c.json({ error: 'Missing required fields: id and email' }, 400);
    }

    // Check if user already exists
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE id = ? OR email = ?')
      .bind(id, email)
      .first();

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }

    // Create user with free tier credits
    await db
      .prepare(
        'INSERT INTO users (id, email, credits, created_at) VALUES (?, ?, ?, datetime("now"))'
      )
      .bind(id, email, 5) // 5 free credits
      .run();

    const newUser = await db
      .prepare('SELECT id, email, credits, created_at FROM users WHERE id = ?')
      .bind(id)
      .first();

    return c.json(newUser, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { userRoutes };
