import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateId,
  hashPassword,
  verifyPassword,
  signJWT,
  verifyJWT,
  createSession,
  deleteSession,
  validateSession,
} from './auth';

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    importKey: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    digest: vi.fn(),
  },
  getRandomValues: vi.fn(),
};

// Set up global crypto mock
global.crypto = mockCrypto as any;

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateId', () => {
    it('should generate a unique ID with correct format', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate different IDs on multiple calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!';
      mockCrypto.subtle.digest.mockResolvedValue(
        new ArrayBuffer(32) as any
      );

      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for the same password (salt)', async () => {
      const password = 'testPassword123!';
      mockCrypto.subtle.digest.mockResolvedValue(
        new ArrayBuffer(32) as any
      );

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      mockCrypto.subtle.digest.mockResolvedValue(
        new ArrayBuffer(32) as any
      );

      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password successfully', async () => {
      const password = 'testPassword123!';
      const salt = 'randomsalt123';
      const passwordHash = `${salt}.${Buffer.from('hashedpassword').toString('base64')}`;

      mockCrypto.subtle.digest.mockResolvedValue(
        Buffer.from('hashedpassword').buffer as any
      );

      const isValid = await verifyPassword(password, passwordHash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'wrongPassword';
      const salt = 'randomsalt123';
      const passwordHash = `${salt}.${Buffer.from('hashedpassword').toString('base64')}`;

      mockCrypto.subtle.digest.mockResolvedValue(
        Buffer.from('differenthash').buffer as any
      );

      const isValid = await verifyPassword(password, passwordHash);
      expect(isValid).toBe(false);
    });

    it('should handle malformed hash format', async () => {
      const password = 'testPassword123!';
      const invalidHash = 'invalidformat';

      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('signJWT', () => {
    it('should create a valid JWT token', async () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

      const token = await signJWT(payload, secret);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should include expiration in token', async () => {
      const payload = { userId: 'user-123' };
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

      const token = await signJWT(payload, secret, 3600); // 1 hour
      const encodedPayload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(encodedPayload));

      expect(decodedPayload.exp).toBeDefined();
      expect(decodedPayload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should include issued at (iat) claim', async () => {
      const payload = { userId: 'user-123' };
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

      const token = await signJWT(payload, secret);
      const encodedPayload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(encodedPayload));

      expect(decodedPayload.iat).toBeDefined();
    });
  });

  describe('verifyJWT', () => {
    it('should verify a valid JWT token', async () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);
      mockCrypto.subtle.verify.mockResolvedValue(true);

      const token = await signJWT(payload, secret);
      const decoded = await verifyJWT(token, secret);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject token with invalid signature', async () => {
      const token = 'header.payload.invalidsignature';
      const secret = 'test-secret';

      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.verify.mockResolvedValue(false);

      await expect(verifyJWT(token, secret)).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      const payload = { userId: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 };
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);
      mockCrypto.subtle.verify.mockResolvedValue(true);

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload));
      const signature = btoa('signature');
      const token = `${header}.${encodedPayload}.${signature}`;

      await expect(verifyJWT(token, secret)).rejects.toThrow('Token expired');
    });

    it('should reject malformed token', async () => {
      const token = 'invalid-token-format';
      const secret = 'test-secret';

      await expect(verifyJWT(token, secret)).rejects.toThrow();
    });
  });

  describe('createSession', () => {
    it('should create a session with valid JWT', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      } as any;

      const userId = 'user-123';
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

      const session = await createSession(mockDb, userId, secret);

      expect(session).toBeDefined();
      expect(session.token).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions')
      );
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should set session expiration', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      } as any;

      const userId = 'user-123';
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

      const session = await createSession(mockDb, userId, secret, 3600);

      expect(session.expiresAt).toBeDefined();
      const expiresAtDate = new Date(session.expiresAt);
      const now = new Date();
      const diff = expiresAtDate.getTime() - now.getTime();
      expect(diff).toBeGreaterThan(3500 * 1000); // Approximately 1 hour
      expect(diff).toBeLessThan(3700 * 1000);
    });

    it('should hash session token before storing', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      } as any;

      const userId = 'user-123';
      const secret = 'test-secret';

      const mockSignature = new ArrayBuffer(64);
      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);

      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32) as any);

      const session = await createSession(mockDb, userId, secret);

      expect(mockDb.prepare).toHaveBeenCalled();
      const bindCall = mockDb.bind as any;
      expect(bindCall.mock.calls[0][0]).not.toBe(session.token); // Token should be hashed
    });
  });

  describe('deleteSession', () => {
    it('should delete session by token hash', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { rows_read: 1 } }),
      } as any;

      const token = 'session-token';
      const secret = 'test-secret';

      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32) as any);

      await deleteSession(mockDb, token, secret);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sessions')
      );
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should handle non-existent session gracefully', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { rows_read: 0 } }),
      } as any;

      const token = 'non-existent-token';
      const secret = 'test-secret';

      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32) as any);

      await expect(deleteSession(mockDb, token, secret)).resolves.not.toThrow();
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }),
      } as any;

      const token = 'valid-token';
      const secret = 'test-secret';

      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.verify.mockResolvedValue(true);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32) as any);

      const session = await validateSession(mockDb, token, secret);

      expect(session).toBeDefined();
      expect(session.userId).toBe('user-123');
    });

    it('should reject expired session', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          user_id: 'user-123',
          expires_at: new Date(Date.now() - 3600000).toISOString(),
        }),
      } as any;

      const token = 'expired-token';
      const secret = 'test-secret';

      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.verify.mockResolvedValue(true);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32) as any);

      await expect(validateSession(mockDb, token, secret)).rejects.toThrow(
        'Session expired'
      );
    });

    it('should reject non-existent session', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      } as any;

      const token = 'non-existent-token';
      const secret = 'test-secret';

      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.verify.mockResolvedValue(true);
      mockCrypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32) as any);

      await expect(validateSession(mockDb, token, secret)).rejects.toThrow(
        'Session not found'
      );
    });

    it('should reject invalid JWT', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      } as any;

      const token = 'invalid-jwt';
      const secret = 'test-secret';

      mockCrypto.subtle.importKey.mockResolvedValue({} as any);
      mockCrypto.subtle.verify.mockResolvedValue(false);

      await expect(validateSession(mockDb, token, secret)).rejects.toThrow();
    });
  });
});
