import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import booksRouter from '../src/routes/books.js';
import * as dbModule from '../src/db/index.js';

// Fully mock authentication middleware to bypass real JWT checks
vi.mock('../src/middleware/auth.js', () => {
    const mockMiddleware = (req, res, next) => {
        req.user = { id: 42 };
        next();
    };
    return {
        authenticateToken: mockMiddleware,
        default: mockMiddleware
    };
});

// Mock database pool structure
vi.mock('../src/db/index.js', () => {
    const mockPool = {
        query: vi.fn()
    };
    return {
        pool: mockPool,
        default: mockPool
    };
});

const app = express();
app.use(express.json());
app.use('/api/books', booksRouter);

describe('Books Core Route Unit Tests (src/routes/books.js)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // GET /api/books - LIST ALL BOOKS WITH FILTERS
    // ==========================================
    describe('GET /api/books', () => {
        it('should fetch all books for the active user sorted by recent entries', async () => {
            const mockRows = [
                { id: 1, title: 'Book One', author: 'Author A', status: 'finished' },
                { id: 2, title: 'Book Two', author: 'Author B', status: 'reading' }
            ];
            dbModule.pool.query.mockResolvedValueOnce({ rows: mockRows });

            const res = await request(app).get('/api/books');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockRows);
        });

        it('should safely append database filters if a valid status query parameter is passed', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Book One', status: 'reading' }] });

            const res = await request(app).get('/api/books?status=reading');

            expect(res.statusCode).toBe(200);
        });

        it('should bubble up a 500 error if fetching books fails at the database level', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('Query execution failure'));

            const res = await request(app).get('/api/books');

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to fetch books');
        });
    });

    // ==========================================
    // GET /api/books/:id - FETCH SINGLE BOOK
    // ==========================================
    describe('GET /api/books/:id', () => {
        it('should return 200 and the book matching the requested parameter ID', async () => {
            const mockBook = { id: 10, user_id: 42, title: 'Target Book', author: 'Jane Doe' };
            dbModule.pool.query.mockResolvedValueOnce({ rows: [mockBook] });

            const res = await request(app).get('/api/books/10');

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Target Book');
        });

        it('should return 404 if the book ID does not exist or belongs to another user', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app).get('/api/books/999');

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Book not found');
        });

        it('should bubble up a 500 server error if database lookup fails', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('DB Lookup Timeout'));

            const res = await request(app).get('/api/books/10');

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to fetch book');
        });
    });

    // ==========================================
    // POST /api/books - CREATE BOOK RECORD
    // ==========================================
    describe('POST /api/books', () => {
        it('should block creation with 400 if title or author fields are missing', async () => {
            const res = await request(app)
                .post('/api/books')
                .send({ title: '', author: 'Some Author' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Title and author are required');
        });

        it('should block creation with 400 if numeric score rating falls below 1 or above 5', async () => {
            const res = await request(app)
                .post('/api/books')
                .send({ title: 'Title', author: 'Author', rating: 6 });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Rating must be between 1 and 5');
        });

        it('should block creation with 400 if the status text string value is not supported', async () => {
            const res = await request(app)
                .post('/api/books')
                .send({ title: 'Title', author: 'Author', status: 'not-supported-value' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Invalid status value');
        });

        it('should create a book record and pass default values if valid parameters are sent', async () => {
            const mockInsertedBook = { id: 50, title: 'New Book', author: 'Writer', status: 'want_to_read' };
            dbModule.pool.query.mockResolvedValueOnce({ rows: [mockInsertedBook] });

            const res = await request(app)
                .post('/api/books')
                .send({ title: 'New Book', author: 'Writer', status: 'want_to_read', rating: 4 });

            expect(res.statusCode).toBe(201);
            expect(res.body.id).toBe(50);
        });

        it('should return a 500 server error if the entry insertion fails', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('Insert lock constraint failed'));

            const res = await request(app)
                .post('/api/books')
                .send({ title: 'Valid Title', author: 'Valid Author' });

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to create book');
        });
    });

    // ==========================================
    // PUT /api/books/:id - EDIT/UPDATE BOOK DETAILS
    // ==========================================
    describe('PUT /api/books/:id', () => {
        it('should validate parameter checks exactly like creation endpoints before executing queries', async () => {
            const res = await request(app)
                .put('/api/books/101')
                .send({ title: 'Title Only', author: '', rating: 0 });

            expect(res.statusCode).toBe(400);
        });

        it('should update database row properties and return the altered book profile', async () => {
            const updatedProfile = { id: 101, title: 'Altered Title', author: 'Same Author', status: 'finished' };
            dbModule.pool.query.mockResolvedValueOnce({ rows: [updatedProfile] });

            const res = await request(app)
                .put('/api/books/101')
                .send({ title: 'Altered Title', author: 'Same Author', status: 'finished', rating: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Altered Title');
        });

        it('should return 404 error message if trying to edit a book that does not exist', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .put('/api/books/999')
                .send({ title: 'Title', author: 'Author', status: 'reading' });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Book not found');
        });

        it('should return 500 error message if update execution queries crash', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('DB internal fail'));

            const res = await request(app)
                .put('/api/books/101')
                .send({ title: 'Title', author: 'Author' });

            expect(res.statusCode).toBe(500);
        });
    });

    // ==========================================
    // DELETE /api/books/:id - REMOVE BOOK
    // ==========================================
    describe('DELETE /api/books/:id', () => {
        it('should issue a 404 resource message if the target record ID to delete is not found', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app).delete('/api/books/999');

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Book not found');
        });

        it('should return 200 message when a valid target record row is successfully deleted', async () => {
            dbModule.pool.query.mockResolvedValueOnce({ rows: [{ id: 101 }], rowCount: 1 });

            const res = await request(app).delete('/api/books/101');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Book deleted successfully');
        });

        it('should return 500 error if delete operation query execution crashes', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('Database delete constraint error'));

            const res = await request(app).delete('/api/books/101');

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to delete book');
        });
    });

    // ==========================================
    // GET /api/books/stats/summary - SUMMARY AGGREGATES
    // ==========================================
    describe('GET /api/books/stats/summary', () => {
        it('should fetch the aggregate summary calculations for user dashboard rendering', async () => {
            const mockStats = { want_to_read: '5', reading: '2', finished: '12', total: '19', avg_rating: '4.3' };
            dbModule.pool.query.mockResolvedValueOnce({ rows: [mockStats] });

            const res = await request(app).get('/api/books/stats/summary');

            expect(res.statusCode).toBe(200);
            expect(res.body.total).toBe('19');
            expect(res.body.avg_rating).toBe('4.3');
        });

        it('should capture dashboard failures and issue standard server error states', async () => {
            dbModule.pool.query.mockRejectedValueOnce(new Error('Aggregate calculation mathematical fault'));

            const res = await request(app).get('/api/books/stats/summary');

            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to fetch stats');
        });
    });
});