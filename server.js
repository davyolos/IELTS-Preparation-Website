const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');
const HISTORY_PATH = path.join(__dirname, 'storage', 'history.json');

// Ensure history file exists
if (!fs.existsSync(HISTORY_PATH)) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify([], null, 2), 'utf-8');
}

// 1. Get Questions
const VOCAB_PATH = path.join(__dirname, 'data', 'vocab-bank.json');

app.get('/api/vocab', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read vocab bank', details: err.message });
  }
});

app.get('/api/questions', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read questions', details: err.message });
  }
});

// 2. Get Practice History
app.get('/api/history', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read history', details: err.message });
  }
});

// 3. Save Practice Session
app.post('/api/history', (req, res) => {
  try {
    const sessions = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    const newSession = {
      id: 'session_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...req.body
    };
    sessions.unshift(newSession); // Newest first
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(sessions.slice(0, 100), null, 2), 'utf-8');
    res.status(201).json({ success: true, session: newSession });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save history', details: err.message });
  }
});

// 4. Clear History
app.delete('/api/history', (req, res) => {
  try {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify([], null, 2), 'utf-8');
    res.json({ success: true, message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(' IELTS Speaking Band 8+ Mastery Platform Running');
  console.log(' Access URL: http://localhost:' + PORT);
  console.log('====================================================');
});
