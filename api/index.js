const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const QUESTIONS_PATH = path.join(__dirname, '..', 'data', 'questions.json');

app.get('/api/questions', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read questions', details: err.message });
  }
});

// Ephemeral fallback for serverless
let inMemoryHistory = [];

app.get('/api/history', (req, res) => {
  res.json(inMemoryHistory);
});

app.post('/api/history', (req, res) => {
  const newSession = {
    id: 'session_' + Date.now(),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  inMemoryHistory.unshift(newSession);
  res.status(201).json({ success: true, session: newSession });
});

module.exports = app;
