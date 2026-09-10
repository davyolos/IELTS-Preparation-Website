const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const questionsData = require('../data/questions.json');

app.get('/api/questions', (req, res) => {
  res.json(questionsData);
});

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
