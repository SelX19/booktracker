import express from 'express';
import { pool } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/books - get all books for current user, optional ?status= filter
router.get('/', async (req, res) => {
  const { status } = req.query;
  const userId = req.user.id;

  try {
    let query = 'SELECT * FROM books WHERE user_id = $1';
    const params = [userId];

    if (status && ['want_to_read', 'reading', 'finished'].includes(status)) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/:id - get a single book
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST /api/books - create a new book
router.post('/', async (req, res) => {
  const { title, author, genre, status, rating, notes } = req.body;
  const userId = req.user.id;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const validStatuses = ['want_to_read', 'reading', 'finished'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO books (user_id, title, author, genre, status, rating, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, author, genre || null, status || 'want_to_read', rating || null, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// PUT /api/books/:id - update a book
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, genre, status, rating, notes } = req.body;
  const userId = req.user.id;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const validStatuses = ['want_to_read', 'reading', 'finished'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const result = await pool.query(
      `UPDATE books 
       SET title = $1, author = $2, genre = $3, status = $4, rating = $5, notes = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, author, genre || null, status || 'want_to_read', rating || null, notes || null, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /api/books/:id - delete a book
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// GET /api/books/stats/summary - get stats for dashboard
router.get('/stats/summary', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'want_to_read') AS want_to_read,
        COUNT(*) FILTER (WHERE status = 'reading') AS reading,
        COUNT(*) FILTER (WHERE status = 'finished') AS finished,
        COUNT(*) AS total,
        ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 1) AS avg_rating
       FROM books WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
