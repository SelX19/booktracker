import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth.js';
import * as dbModule from '../src/db/index.js';
// Spy and mock bcrypt.compare directly to return true for this happy path
import bcrypt from 'bcryptjs';
process.env.JWT_SECRET = 'svvt_project_test_secret_key_123';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

vi.mock('../src/db/index.js', () => {
    const mockPool = {
        query: vi.fn()
    };
    return {
        pool: mockPool,
        default: mockPool
    };
});

describe('Authentication Route Unit Tests (src/routes/auth.js)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // POST /api/auth/register TESTS
    // ==========================================
    describe('POST /api/auth/register', () => {
        it('should return 400 Bad Request if mandatory registration fields are empty', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: '', username: '', password: '' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Username, email, and password are required');
        });

        it('should reject a password exactly 5 characters long (Below Boundary)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@burch.edu', username: 'tester', password: '12345' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Password must be at least 6 characters');
        });

        it('should return 400 Bad Request if the email format is invalid', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid-email-format', username: 'tester', password: '123456' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Invalid email format');
        });

        it('should accept a password exactly 6 characters long (Exact Boundary)', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [] });
            dbModule.pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@burch.edu', username: 'tester' }] });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@burch.edu', username: 'tester', password: '123456' });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 409 if the email address is already registered', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [{ id: 9, email: 'duplicate@burch.edu' }] });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'duplicate@burch.edu', username: 'newuser', password: 'securepassword' });

            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe('Email or username already exists');
        });

        it('should bubble up a 500 Server Error if database fails during registration', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('DB Crash'));

            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'crash@burch.edu', username: 'crasher', password: 'validpassword' });

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Server error during registration');
        });
    });

    // ==========================================
    // POST /api/auth/login TESTS
    // ==========================================
    describe('POST /api/auth/login', () => {
        it('should reject requests lacking email or password with 400', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: '', password: '' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Email and password are required');
        });

        it('should return 401 when authenticating with a non-existent email', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unknown@burch.edu', password: 'somepassword' });

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Invalid email or password');
        });

        it('should return 401 if the password does not match the stored hash', async () => {
            dbModule.pool.query.mockResolvedValueOnce({
                rows: [{
                    id: 3,
                    email: 'user@burch.edu',
                    password_hash: '$2b$10$abcdefghijklmnopqrstuvwx7891011121314151617181920'
                }]
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'user@burch.edu', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Invalid email or password');
        });

        it('should return 200 and a valid token on successful authentication', async () => {
            const mockUser = {
                id: 12,
                username: 'selma',
                email: 'selma@burch.edu',
                password_hash: '$2a$10$dummyhashformockingpurposesonly',
                created_at: '2026-06-09T12:00:00.000Z'
            };

            // Program the DB mock to return our user profile row
            dbModule.pool.query.mockResolvedValueOnce({ rows: [mockUser] });

            const bcryptSpy = vi.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'selma@burch.edu', password: 'secure123' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.username).toBe('selma');
            expect(res.body.user.email).toBe('selma@burch.edu');
            expect(res.body.user).not.toHaveProperty('password_hash'); // Asserts security schema design

            // Clean up the spy
            bcryptSpy.mockRestore();
        });

        it('should bubble up a 500 Server Error if database fails during login lookup', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('Login DB Connection Drop'));

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'error@burch.edu', password: 'anypassword' });

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Server error during login');
        });
    });
});