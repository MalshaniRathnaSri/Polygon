require('dotenv').config()
const express = require('express')
const pool = require('./db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator')

const app = express()
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

app.post('/api/auth/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    const { email, password, name } = req.body
    try {
      const hashed = await bcrypt.hash(password, 10)
      const [result] = await pool.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashed, name])
      const id = result.insertId
      const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: process.env.JWT_EXP || '1h' })
      res.status(201).json({ token })
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' })
      console.error(err); res.status(500).json({ message: 'Server error' })
    }
  })

app.post('/api/auth/login',
  body('email').isEmail(),
  body('password').exists(),
  async (req, res) => {
    const { email, password } = req.body
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: process.env.JWT_EXP || '1h' })
    res.json({ token })
  })

app.put('/api/users/me', authMiddleware, async (req, res) => {
  const { name, email, password } = req.body
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10)
      await pool.query('UPDATE users SET name=?, email=?, password=? WHERE id=?', [name, email, hashed, req.user.id])
    } else {
      await pool.query('UPDATE users SET name=?, email=? WHERE id=?', [name, email, req.user.id])
    }
    const [rows] = await pool.query('SELECT id, email, name, created_at FROM users WHERE id=?', [req.user.id])
    res.json(rows[0])
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' })
  }
})

app.post('/api/posts', authMiddleware, body('title').notEmpty(), async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  const { title, body: content } = req.body
  try {
    const [result] = await pool.query('INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)', [req.user.id, title, content])
    const insertId = result.insertId
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [insertId])
    res.status(201).json(rows[0])
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.*, u.email as author_email FROM posts p JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC')
    res.json(rows)
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

app.get('/api/posts/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.*, u.email as author_email FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id = ?', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Not found' })
    res.json(rows[0])
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

app.put('/api/posts/:id', authMiddleware, body('title').optional().notEmpty(), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id])
    const post = rows[0]
    if (!post) return res.status(404).json({ message: 'Not found' })
    if (post.user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' })

    const { title, body: content } = req.body
    await pool.query('UPDATE posts SET title = COALESCE(?, title), body = COALESCE(?, body) WHERE id = ?', [title, content, req.params.id])
    const [updated] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id])
    res.json(updated[0])
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }) }
})

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id])
    const post = rows[0]
    if (!post) return res.status(404).json({ message: 'Not found' })
    if (post.user_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' })
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id])
    res.status(204).send()
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' })}
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Server running on ${port}`))
