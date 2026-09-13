// ============================================================================
// IELTS Vocabulary Mastery Module (30 Words per Topic + Speech Challenge)
// ============================================================================

let vocabTopics = [];
let currentTopicIndex = 0;
let currentWordIndex = 0;
let wordTimerInterval = null;
let wordSecondsRemaining = 180; // 3 minutes per word
let isWordTimerRunning = false;

// Sentence storage: topicIndex -> wordIndex -> { simple: ["", "", ""], complex: ["", "", ""], completed: bool }
let userSentencesData = {};

// Speech Challenge Timers
let prepSpeechTimer = null;
let speechDurationTimer = null;
let prepSecondsLeft = 60; // 1 min prep
let speechSecondsElapsed = 0; // 2 min speak
let isVocabSpeaking = false;
let vocabSpeechRecognition = null;

// Initialize Vocab Speech Engine
function initVocabSpeech() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    vocabSpeechRecognition = new SpeechRec();
    vocabSpeechRecognition.continuous = true;
    vocabSpeechRecognition.interimResults = true;
    vocabSpeechRecognition.lang = 'en-US';

    vocabSpeechRecognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      const box = document.getElementById('vocabSpeechTranscript');
      if (box) box.value = fullTranscript.trim();
    };

    vocabSpeechRecognition.onerror = (err) => {
      console.warn('Vocab speech recognition warning:', err.error);
      if (err.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions.');
        stopVocabSpeechRecording();
      }
    };

    vocabSpeechRecognition.onend = () => {
      if (isVocabSpeaking) {
        try { vocabSpeechRecognition.start(); } catch(e) {}
      }
    };
  }
}

// Load Vocab Bank
async function loadVocabBank() {
  try {
    const res = await fetch('/api/vocab');
    if (res.ok) {
      vocabTopics = await res.json();
    }
  } catch (e) {
    console.warn('Failed to load vocab from /api/vocab, using fallback.', e);
  }

  // Fallback if empty
  if (!vocabTopics || !vocabTopics.length) {
    vocabTopics = [
      {
        topicId: 'env_fallback',
        topicTitle: 'Environmental Sustainability & Climate Action',
        description: 'Band 8+ lexical items for ecological preservation and renewable solutions.',
        speechCueCard: {
          title: 'Describe an eco-friendly project or policy that could mitigate climate change.',
          prompts: [
            'What the project is and how it functions',
            'What environmental risks it addresses',
            'What challenges governments face in adopting it',
            'And explain why sustainable practices are of paramount importance.'
          ]
        },
        words: Array.from({ length: 30 }, (_, i) => ({
          id: i + 1,
          word: ['Mitigate', 'Biodiversity', 'Sustainable', 'Depletion', 'Detrimental', 'Unprecedented', 'Exacerbate', 'Paramount', 'Imperative', 'Proliferation', 'Resilience', 'Viable', 'Incentivize', 'Equitable', 'Ecosystem', 'Catastrophic', 'Rehabilitate', 'Negligent', 'Emissions', 'Subsidize', 'Pristine', 'Indispensable', 'Advocate', 'Contaminate', 'Degradation', 'Ubiquitous', 'Nuance', 'Autonomy', 'Cognitive', 'Profound'][i] || `Lexeme_${i+1}`,
          pos: 'academic',
          meaning: 'High-frequency Band 8+ IELTS academic descriptor.',
          example: 'Adopting forward-thinking policies is indispensable for ensuring long-term resilience.',
          collocations: ['play a pivotal role', 'paramount importance', 'mitigate risks']
        }))
      }
    ];
  }

  // Load saved sentences from localStorage
  try {
    const saved = localStorage.getItem('ielts_vocab_sentences_data');
    if (saved) userSentencesData = JSON.parse(saved);
  } catch (e) {}

  renderTopicSelector();
  renderWordGrid();
  loadActiveWord();
  setupCueCardView();
}

// Render Topic Selector Dropdown
function renderTopicSelector() {
  const sel = document.getElementById('vocabTopicSelect');
  if (!sel) return;
  sel.innerHTML = '';
  vocabTopics.forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = `${idx + 1}. ${t.topicTitle}`;
    sel.appendChild(opt);
  });
  sel.value = currentTopicIndex;
}

function onTopicChanged() {
  const sel = document.getElementById('vocabTopicSelect');
  currentTopicIndex = parseInt(sel.value, 10) || 0;
  currentWordIndex = 0;
  resetWordTimer();
  renderWordGrid();
  loadActiveWord();
  setupCueCardView();
}

// Render 30 Word Grid Buttons
function renderWordGrid() {
  const grid = document.getElementById('wordGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const topic = vocabTopics[currentTopicIndex];
  if (!topic || !topic.words) return;

  let completedCount = 0;
  const topicData = userSentencesData[topic.topicId] || {};

  topic.words.forEach((w, idx) => {
    const isCompleted = topicData[w.id] && topicData[w.id].completed;
    if (isCompleted) completedCount++;

    const btn = document.createElement('button');
    btn.className = `word-grid-btn ${idx === currentWordIndex ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
    btn.innerHTML = `
      <div class="word-btn-top">
        <span class="word-num">#${w.id}</span>
        <span class="word-status">${isCompleted ? '✓' : '○'}</span>
      </div>
      <div class="word-btn-title">${w.word}</div>
      <div class="word-btn-pos">${w.pos || ''}</div>
    `;
    btn.onclick = () => {
      currentWordIndex = idx;
      resetWordTimer();
      renderWordGrid();
      loadActiveWord();
    };
    grid.appendChild(btn);
  });

  // Update progress bar
  const progressPercent = Math.round((completedCount / topic.words.length) * 100);
  const bar = document.getElementById('vocabProgressBar');
  const txt = document.getElementById('vocabProgressText');
  if (bar) bar.style.width = `${progressPercent}%`;
  if (txt) txt.innerText = `${completedCount} / ${topic.words.length} Words Completed (${progressPercent}%)`;
}

// Load Active Word Details & Sentences
function loadActiveWord() {
  const topic = vocabTopics[currentTopicIndex];
  if (!topic || !topic.words || !topic.words[currentWordIndex]) return;

  const w = topic.words[currentWordIndex];
  document.getElementById('activeWordTitle').innerText = `${w.id}. ${w.word}`;
  document.getElementById('activeWordPos').innerText = w.pos ? `(${w.pos})` : '';
  document.getElementById('activeWordMeaning').innerText = w.meaning || '';
  document.getElementById('activeWordExample').innerText = `“${w.example || ''}”`;

  // Collocations
  const collocContainer = document.getElementById('activeWordCollocations');
  if (collocContainer) {
    collocContainer.innerHTML = '';
    (w.collocations || []).forEach(c => {
      const pill = document.createElement('span');
      pill.className = 'colloc-pill';
      pill.innerText = c;
      collocContainer.appendChild(pill);
    });
  }

  // Load inputs from storage
  const topicData = userSentencesData[topic.topicId] || {};
  const wordData = topicData[w.id] || { simple: ['', '', ''], complex: ['', '', ''] };

  document.getElementById('simpleSentence1').value = wordData.simple[0] || '';
  document.getElementById('simpleSentence2').value = wordData.simple[1] || '';
  document.getElementById('simpleSentence3').value = wordData.simple[2] || '';

  document.getElementById('complexSentence1').value = wordData.complex[0] || '';
  document.getElementById('complexSentence2').value = wordData.complex[1] || '';
  document.getElementById('complexSentence3').value = wordData.complex[2] || '';

  document.getElementById('sentenceValidationNotice').innerHTML = '';
}

// 3-Minute Word Countdown Timer
function toggleWordTimer() {
  const btn = document.getElementById('wordTimerBtn');
  if (!isWordTimerRunning) {
    // Start
    isWordTimerRunning = true;
    btn.innerText = '⏸️ Pause';
    btn.classList.add('btn-danger');
    btn.classList.remove('btn-outline');

    clearInterval(wordTimerInterval);
    wordTimerInterval = setInterval(() => {
      wordSecondsRemaining--;
      updateWordTimerDisplay();

      if (wordSecondsRemaining <= 0) {
        clearInterval(wordTimerInterval);
        isWordTimerRunning = false;
        btn.innerText = '🔒 3-Min Expired';
        btn.disabled = true;
        playTimerChime();
        lockWordInputs(true);
        evaluateAndSaveSentences(true);
      }
    }, 1000);
  } else {
    // Pause
    isWordTimerRunning = false;
    btn.innerText = '▶️ Resume';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-outline');
    clearInterval(wordTimerInterval);
  }
}

function resetWordTimer() {
  lockWordInputs(false);
  clearInterval(wordTimerInterval);
  isWordTimerRunning = false;
  wordSecondsRemaining = 180;
  updateWordTimerDisplay();
  const btn = document.getElementById('wordTimerBtn');
  if (btn) {
    btn.innerText = '⏱️ Start 3-Min Timer';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-outline');
  }
}

function updateWordTimerDisplay() {
  const display = document.getElementById('wordTimerDisplay');
  if (!display) return;
  const m = String(Math.floor(wordSecondsRemaining / 60)).padStart(2, '0');
  const s = String(wordSecondsRemaining % 60).padStart(2, '0');
  display.innerText = `${m}:${s}`;
  if (wordSecondsRemaining <= 30) {
    display.style.color = 'var(--accent-rose)';
  } else {
    display.style.color = 'var(--primary)';
  }
}

// Validate & Save 6 Sentences
function validateAndSaveSentences() {
  const topic = vocabTopics[currentTopicIndex];
  const w = topic.words[currentWordIndex];
  const targetWord = w.word.toLowerCase();

  const s1 = document.getElementById('simpleSentence1').value.trim();
  const s2 = document.getElementById('simpleSentence2').value.trim();
  const s3 = document.getElementById('simpleSentence3').value.trim();

  const c1 = document.getElementById('complexSentence1').value.trim();
  const c2 = document.getElementById('complexSentence2').value.trim();
  const c3 = document.getElementById('complexSentence3').value.trim();

  const simpleList = [s1, s2, s3];
  const complexList = [c1, c2, c3];

  let missingWordErrors = [];
  let complexFeedback = [];

  // Check simple sentences
  simpleList.forEach((s, idx) => {
    if (!s) {
      missingWordErrors.push(`Simple Sentence #${idx + 1} is empty.`);
    } else if (!s.toLowerCase().includes(targetWord.slice(0, -1))) {
      missingWordErrors.push(`Simple Sentence #${idx + 1} does not include "${w.word}".`);
    }
  });

  // Check complex sentences
  const complexMarkers = /\b(although|even though|whereas|while|because|since|if|unless|provided that|had i|in spite of|despite|which means|whereby|not only|what is)\b/i;

  complexList.forEach((s, idx) => {
    if (!s) {
      missingWordErrors.push(`Complex Sentence #${idx + 1} is empty.`);
    } else {
      if (!s.toLowerCase().includes(targetWord.slice(0, -1))) {
        missingWordErrors.push(`Complex Sentence #${idx + 1} does not include "${w.word}".`);
      }
      if (!complexMarkers.test(s)) {
        complexFeedback.push(`Complex Sentence #${idx + 1} appears too simple. Use subordinate conjunctions like 'although', 'because', 'whereas', or conditionals ('if').`);
      }
    }
  });

  const notice = document.getElementById('sentenceValidationNotice');

  if (missingWordErrors.length > 0) {
    notice.innerHTML = `<div style="color: var(--accent-rose); background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 6px;">
      <strong>Please complete all 6 sentences using "${w.word}":</strong>
      <ul style="margin-left: 1.2rem; margin-top: 0.3rem;">${missingWordErrors.map(e => `<li>${e}</li>`).join('')}</ul>
    </div>`;
    return;
  }

  // Save successful
  if (!userSentencesData[topic.topicId]) {
    userSentencesData[topic.topicId] = {};
  }
  userSentencesData[topic.topicId][w.id] = {
    simple: simpleList,
    complex: complexList,
    completed: true,
    timestamp: new Date().toISOString()
  };

  try {
    localStorage.setItem('ielts_vocab_sentences_data', JSON.stringify(userSentencesData));
  } catch (e) {}

  renderWordGrid();

  let adviceHtml = '';
  if (complexFeedback.length > 0) {
    adviceHtml = `<div style="color: var(--accent-amber); margin-top: 0.5rem; font-size: 0.85rem;">
      <strong>Tip:</strong> ${complexFeedback.join(' ')}
    </div>`;
  }

  notice.innerHTML = `<div style="color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); padding: 0.75rem; border-radius: 6px;">
    ✓ <strong>Saved successfully!</strong> All 6 sentences recorded for "${w.word}".
    ${adviceHtml}
  </div>`;
}

function nextWord() {
  lockWordInputs(false);
  const topic = vocabTopics[currentTopicIndex];
  if (!topic || !topic.words) return;
  currentWordIndex = (currentWordIndex + 1) % topic.words.length;
  resetWordTimer();
  renderWordGrid();
  loadActiveWord();
}

// ----------------------------------------------------------------------------
// End-of-Session 3-Minute Speech Challenge (Cue Card Style)
// ----------------------------------------------------------------------------

// Audio Chime Alert via Web Audio API
function playTimerChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}

function lockWordInputs(shouldLock) {
  const inputIds = [
    'simpleSentence1', 'simpleSentence2', 'simpleSentence3',
    'complexSentence1', 'complexSentence2', 'complexSentence3'
  ];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = shouldLock;
      if (shouldLock) el.classList.add('locked-input');
      else el.classList.remove('locked-input');
    }
  });

  const banner = document.getElementById('inputLockBanner');
  if (banner) banner.style.display = shouldLock ? 'flex' : 'none';

  const saveBtn = document.getElementById('saveSentencesBtn');
  if (saveBtn) {
    if (shouldLock) {
      saveBtn.innerText = '🔒 Inputs Locked (Evaluated)';
      saveBtn.disabled = true;
    } else {
      saveBtn.innerText = '💾 Validate & Save 6 Sentences';
      saveBtn.disabled = false;
    }
  }
}

// Deep Linguistic Evaluation & Scoring of 6 Sentences
function evaluateAndSaveSentences(autoTriggered = false) {
  const topic = vocabTopics[currentTopicIndex];
  const w = topic.words[currentWordIndex];
  const targetWord = w.word.toLowerCase();
  const wordStem = targetWord.length > 5 ? targetWord.slice(0, targetWord.length - 2) : targetWord.slice(0, targetWord.length - 1);

  const s1 = document.getElementById('simpleSentence1').value.trim();
  const s2 = document.getElementById('simpleSentence2').value.trim();
  const s3 = document.getElementById('simpleSentence3').value.trim();

  const c1 = document.getElementById('complexSentence1').value.trim();
  const c2 = document.getElementById('complexSentence2').value.trim();
  const c3 = document.getElementById('complexSentence3').value.trim();

  const simpleList = [s1, s2, s3];
  const complexList = [c1, c2, c3];
  const complexMarkers = /(although|even though|whereas|while|because|since|if|unless|provided that|had i|in spite of|despite|which|whose|whereby|not only|what is|were it not)/i;

  let totalValid = 0;
  let sentenceReports = [];

  simpleList.forEach((s, idx) => {
    let status = 'valid';
    let note = 'Accurate simple sentence construction.';
    if (!s) {
      status = 'empty';
      note = 'Sentence is blank.';
    } else if (!s.toLowerCase().includes(wordStem)) {
      status = 'missing_word';
      note = 'Does not incorporate target word "' + w.word + '".';
    } else if (s.split(/\s+/).length < 4) {
      status = 'too_short';
      note = 'Too short to form a complete thought.';
    } else {
      totalValid++;
    }
    sentenceReports.push({ type: 'Simple', num: idx + 1, text: s, status, note });
  });

  complexList.forEach((s, idx) => {
    let status = 'valid';
    let note = 'Demonstrates sophisticated complex clause linking.';
    if (!s) {
      status = 'empty';
      note = 'Sentence is blank.';
    } else if (!s.toLowerCase().includes(wordStem)) {
      status = 'missing_word';
      note = 'Does not incorporate target word "' + w.word + '".';
    } else if (!complexMarkers.test(s)) {
      status = 'lacks_complexity';
      note = 'Lacks complex markers. Use subordinate conjunctions or conditionals.';
    } else {
      totalValid++;
    }
    sentenceReports.push({ type: 'Complex', num: idx + 1, text: s, status, note });
  });

  let bandScore = '5.5';
  if (totalValid === 6) bandScore = '9.0';
  else if (totalValid === 5) bandScore = '8.5';
  else if (totalValid === 4) bandScore = '7.5';
  else if (totalValid >= 2) bandScore = '6.5';

  const wordRecord = {
    word: w.word,
    pos: w.pos,
    meaning: w.meaning,
    example: w.example,
    collocations: w.collocations,
    simple: simpleList,
    complex: complexList,
    completed: totalValid >= 4,
    score: bandScore,
    totalValid: totalValid,
    reports: sentenceReports,
    timestamp: new Date().toISOString()
  };

  if (!userSentencesData[topic.topicId]) {
    userSentencesData[topic.topicId] = {};
  }
  userSentencesData[topic.topicId][w.id] = wordRecord;

  try {
    localStorage.setItem('ielts_vocab_sentences_data', JSON.stringify(userSentencesData));
  } catch (e) {}

  renderWordGrid();
  displaySentenceEvaluationScorecard(wordRecord, autoTriggered);
}

function displaySentenceEvaluationScorecard(data, autoTriggered = false) {
  const notice = document.getElementById('sentenceValidationNotice');
  if (!notice) return;

  const autoBadge = autoTriggered ? '<div style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-bottom: 8px; font-weight: bold;">⏱️ Evaluated Automatically at 3:00 Expiration (Inputs Locked)</div>' : '';

  let listHtml = '';
  (data.reports || []).forEach(r => {
    let icon = '✓';
    let color = 'var(--accent-emerald)';
    if (r.status === 'empty' || r.status === 'missing_word') {
      icon = '✗';
      color = 'var(--accent-rose)';
    } else if (r.status === 'lacks_complexity' || r.status === 'too_short') {
      icon = '⚠';
      color = 'var(--accent-amber)';
    }

    listHtml += '<div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0; border-top: 1px solid var(--border-color); font-size: 0.85rem;">' +
      '<div><strong style="color: #fff;">' + r.type + ' #' + r.num + ':</strong> ' +
      '<span style="color: ' + (r.text ? 'var(--text-primary)' : 'var(--text-muted)') + ';">' + (r.text ? '“' + r.text + '”' : '(Empty)') + '</span>' +
      '<div style="font-size: 0.78rem; color: ' + color + '; margin-top: 2px;">' + r.note + '</div></div>' +
      '<span style="font-weight: 800; color: ' + color + '; font-size: 1rem; padding-left: 8px;">' + icon + '</span></div>';
  });

  notice.innerHTML = '<div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-top: 1rem;">' +
    '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">' +
    '<div>' + autoBadge + '<h4 style="color: #fff; font-size: 1.1rem; margin: 0;">Sentence Practice Evaluation</h4>' +
    '<span style="font-size: 0.8rem; color: var(--text-secondary);">' + (data.totalValid || 0) + ' / 6 Sentences Met Band 8+ Criteria</span></div>' +
    '<div style="text-align: right;"><span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block;">Sentence Score</span>' +
    '<span style="font-family: monospace; font-size: 1.8rem; font-weight: 800; color: var(--accent-emerald);">Band ' + (data.score || '8.0') + '</span></div></div>' +
    '<div>' + listHtml + '</div></div>';
}

function exportWordToPDF() {
  const topic = vocabTopics[currentTopicIndex];
  const w = topic.words[currentWordIndex];
  const topicData = userSentencesData[topic.topicId] || {};
  const wordRecord = topicData[w.id] || {
    simple: [
      document.getElementById('simpleSentence1').value.trim(),
      document.getElementById('simpleSentence2').value.trim(),
      document.getElementById('simpleSentence3').value.trim()
    ],
    complex: [
      document.getElementById('complexSentence1').value.trim(),
      document.getElementById('complexSentence2').value.trim(),
      document.getElementById('complexSentence3').value.trim()
    ],
    score: '8.0',
    reports: []
  };

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site to generate PDF.');
    return;
  }

  const htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<title>IELTS Vocabulary Study Sheet - ' + w.word + '</title>' +
    '<style>' +
    '@page { size: A4; margin: 20mm; }' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 20px; }' +
    '.header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }' +
    '.header h1 { font-size: 22px; color: #1e3a8a; margin: 0; }' +
    '.header .meta { font-size: 13px; color: #64748b; }' +
    '.word-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }' +
    '.word-title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }' +
    '.word-pos { font-size: 14px; color: #64748b; font-style: italic; margin-left: 6px; }' +
    '.model-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 14px; margin-top: 10px; font-size: 14px; color: #1e40af; border-radius: 4px; }' +
    '.colloc-tag { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-top: 4px; }' +
    '.section-title { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }' +
    '.sentence-item { margin-bottom: 10px; padding: 10px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }' +
    '.sentence-label { font-weight: 700; color: #2563eb; margin-right: 6px; }' +
    '.footer { margin-top: 35px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }' +
    '.score-badge { float: right; background: #dcfce7; color: #166534; font-size: 18px; font-weight: 800; padding: 6px 14px; border-radius: 6px; border: 1px solid #bbf7d0; }' +
    '</style></head><body>' +
    '<div class="header"><div><h1>IELTS Band 8.5+ Vocabulary Study Record</h1>' +
    '<div class="meta">Topic: <strong>' + topic.topicTitle + '</strong></div></div>' +
    '<div class="meta">Date: ' + new Date().toLocaleDateString() + '</div></div>' +
    '<div class="word-card"><div class="score-badge">Score: Band ' + (wordRecord.score || '8.0') + '</div>' +
    '<div class="word-title">' + w.id + '. ' + w.word + ' <span class="word-pos">(' + (w.pos || 'academic') + ')</span></div>' +
    '<div style="margin-top: 8px;"><strong>Definition:</strong> ' + w.meaning + '</div>' +
    '<div class="model-box"><strong>Band 8.5 Model Sentence:</strong> “' + w.example + '”</div>' +
    '<div style="margin-top: 10px;"><strong>Key Collocations:</strong> ' +
    (w.collocations || []).map(c => '<span class="colloc-tag">' + c + '</span>').join('') +
    '</div></div>' +
    '<div class="section-title">Part A: 3 Simple Sentences (Candidate Practice)</div>' +
    '<div class="sentence-item"><span class="sentence-label">Simple #1:</span> ' + (wordRecord.simple[0] || '(Not entered)') + '</div>' +
    '<div class="sentence-item"><span class="sentence-label">Simple #2:</span> ' + (wordRecord.simple[1] || '(Not entered)') + '</div>' +
    '<div class="sentence-item"><span class="sentence-label">Simple #3:</span> ' + (wordRecord.simple[2] || '(Not entered)') + '</div>' +
    '<div class="section-title">Part B: 3 Complex Sentences (Candidate Practice)</div>' +
    '<div class="sentence-item"><span class="sentence-label">Complex #1 (Subordinate):</span> ' + (wordRecord.complex[0] || '(Not entered)') + '</div>' +
    '<div class="sentence-item"><span class="sentence-label">Complex #2 (Conditional):</span> ' + (wordRecord.complex[1] || '(Not entered)') + '</div>' +
    '<div class="sentence-item"><span class="sentence-label">Complex #3 (Relative/Cleft):</span> ' + (wordRecord.complex[2] || '(Not entered)') + '</div>' +
    '<div class="footer">IELTS Mastery Platform • Target Band 8.5+ • Cambridge Standard Lexical Resource</div>' +
    '<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>' +
    '</body></html>';

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function setupCueCardView() {
  const topic = vocabTopics[currentTopicIndex];
  if (!topic) return;

  document.getElementById('vocabCueTopicTitle').innerText = topic.speechCueCard ? topic.speechCueCard.title : `Speak about ${topic.topicTitle}`;
  
  const bulletsEl = document.getElementById('vocabCueBullets');
  if (topic.speechCueCard && topic.speechCueCard.prompts) {
    bulletsEl.innerHTML = `<strong>You should mention:</strong><ul>${topic.speechCueCard.prompts.map(p => `<li>${p}</li>`).join('')}</ul>`;
  } else {
    bulletsEl.innerHTML = '';
  }

  // Word Checklist helper
  const wordChecklist = document.getElementById('vocabWordChecklist');
  if (wordChecklist && topic.words) {
    wordChecklist.innerHTML = '';
    topic.words.forEach(w => {
      const span = document.createElement('span');
      span.className = 'target-word-chip';
      span.id = `chip-${w.word.toLowerCase()}`;
      span.innerText = w.word;
      wordChecklist.appendChild(span);
    });
  }
}

// Read Cue Card Aloud (Examiner Text-to-Speech)
function speakVocabCueCard() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const topic = vocabTopics[currentTopicIndex];
    const text = "Here is your vocabulary speech cue card. " + (topic.speechCueCard ? topic.speechCueCard.title : topic.topicTitle);
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }
}

// 1-Minute Prep Countdown
function startVocabPrepTimer() {
  clearInterval(prepSpeechTimer);
  clearInterval(speechDurationTimer);
  prepSecondsLeft = 60;

  const display = document.getElementById('vocabSpeechTimerDisplay');
  const label = document.getElementById('vocabSpeechTimerLabel');
  label.innerText = 'PREPARATION COUNTDOWN (1 MINUTE)';
  display.style.color = '#f59e0b';

  prepSpeechTimer = setInterval(() => {
    prepSecondsLeft--;
    const m = String(Math.floor(prepSecondsLeft / 60)).padStart(2, '0');
    const s = String(prepSecondsLeft % 60).padStart(2, '0');
    display.innerText = `${m}:${s}`;

    if (prepSecondsLeft <= 0) {
      clearInterval(prepSpeechTimer);
      display.innerText = '00:00';
      display.style.color = '#ef4444';
      label.innerText = "TIME IS UP! START 2-MIN SPEECH";
      // Auto-start speaking
      toggleVocabSpeechRecording();
    }
  }, 1000);
}

// 2-Minute Speech Recording
function toggleVocabSpeechRecording() {
  const btn = document.getElementById('vocabRecordBtn');
  const liveTag = document.getElementById('vocabLiveTag');
  const display = document.getElementById('vocabSpeechTimerDisplay');
  const label = document.getElementById('vocabSpeechTimerLabel');

  if (!isVocabSpeaking) {
    // Start Speaking
    isVocabSpeaking = true;
    btn.innerText = '⏹️ Finish & Evaluate Speech';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-danger');
    liveTag.style.display = 'inline-flex';
    label.innerText = 'SPEAKING DURATION (2 MINUTES MAX)';
    display.style.color = '#3b82f6';

    clearInterval(prepSpeechTimer);
    clearInterval(speechDurationTimer);
    speechSecondsElapsed = 0;

    speechDurationTimer = setInterval(() => {
      speechSecondsElapsed++;
      const m = String(Math.floor(speechSecondsElapsed / 60)).padStart(2, '0');
      const s = String(speechSecondsElapsed % 60).padStart(2, '0');
      display.innerText = `${m}:${s}`;

      if (speechSecondsElapsed >= 120) {
        clearInterval(speechDurationTimer);
        display.style.color = '#f59e0b';
        label.innerText = '2 MINUTES COMPLETED (FULL LONG TURN)';
      }
    }, 1000);

    if (vocabSpeechRecognition) {
      try { vocabSpeechRecognition.start(); } catch(e) {}
    }
  } else {
    // Stop & Evaluate
    stopVocabSpeechRecording();
    evaluateVocabSpeech();
  }
}

function stopVocabSpeechRecording() {
  isVocabSpeaking = false;
  const btn = document.getElementById('vocabRecordBtn');
  btn.innerText = '🎙️ Start 2-Min Speaking';
  btn.classList.remove('btn-danger');
  btn.classList.add('btn-primary');
  document.getElementById('vocabLiveTag').style.display = 'none';

  clearInterval(speechDurationTimer);
  if (vocabSpeechRecognition) {
    try { vocabSpeechRecognition.stop(); } catch(e) {}
  }
}

// Comprehensive Vocabulary & Speaking Evaluation
function evaluateVocabSpeech() {
  const text = document.getElementById('vocabSpeechTranscript').value.trim();
  if (!text || text.split(/\s+/).length < 5) {
    alert('Please speak or type a speech response of at least 5 words before evaluating.');
    return;
  }

  const topic = vocabTopics[currentTopicIndex];
  const questionTitle = topic.speechCueCard ? topic.speechCueCard.title : topic.topicTitle;

  // 1. Evaluate using IELTS 7-criteria evaluator
  const evalResult = IELTS_EVALUATOR.evaluate(text, speechSecondsElapsed || 45, questionTitle);

  // 2. Calculate Target Vocabulary Density
  let usedWords = [];
  topic.words.forEach(w => {
    const root = w.word.toLowerCase().slice(0, -1);
    if (text.toLowerCase().includes(root)) {
      usedWords.push(w.word);
      // Highlight chip in UI
      const chip = document.getElementById(`chip-${w.word.toLowerCase()}`);
      if (chip) chip.classList.add('used');
    }
  });

  const vocabCoveragePercent = Math.round((usedWords.length / topic.words.length) * 100);

  // Render Vocab Evaluation Card
  const evalCard = document.getElementById('vocabEvalCard');
  document.getElementById('vocabOverallBand').innerText = evalResult.overallBand;
  document.getElementById('vocabUsedCount').innerText = `${usedWords.length} / ${topic.words.length} Target Words (${vocabCoveragePercent}%)`;
  document.getElementById('vocabWpmStat').innerText = `${evalResult.wpm} WPM`;

  // Render used words list
  const usedListEl = document.getElementById('vocabUsedWordsList');
  if (usedWords.length > 0) {
    usedListEl.innerHTML = usedWords.map(w => `<span class="pill-upgraded">${w}</span>`).join(' ');
  } else {
    usedListEl.innerHTML = '<span style="color: var(--text-muted);">None of the 30 topic target words were detected in your speech. Try incorporating at least 4-5 words on your next attempt!</span>';
  }

  // Render Criteria Matrix
  const grid = document.getElementById('vocabCriteriaGrid');
  grid.innerHTML = '';
  Object.keys(evalResult.criteria).forEach(k => {
    const c = evalResult.criteria[k];
    const box = document.createElement('div');
    box.className = 'criterion-box';
    box.innerHTML = `
      <div class="criterion-header">
        <span class="criterion-name">${c.name}</span>
        <span class="criterion-grade">Band ${c.score}</span>
      </div>
      <p class="criterion-desc">${c.feedback}</p>
    `;
    grid.appendChild(box);
  });

  // Model Rephrase
  document.getElementById('vocabModelRephrase').innerText = evalResult.modelRephrase;

  // Upgrades
  const tbody = document.getElementById('vocabUpgradeTbody');
  tbody.innerHTML = '';
  (evalResult.upgrades || []).forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="pill-original">${u.original}</span></td>
      <td><span class="pill-upgraded">${u.upgrade}</span></td>
      <td style="color: var(--text-secondary);">${u.note}</td>
    `;
    tbody.appendChild(tr);
  });

  evalCard.style.display = 'flex';
  evalCard.scrollIntoView({ behavior: 'smooth' });
}

// AI Generate 30 New Words for Custom/Random Topic
async function generateNewAIVocab() {
  const custom = prompt('Enter a topic for the 30-word vocabulary set (e.g., Space Exploration, Medical Ethics, Global Economics):', '');
  const apiKey = document.getElementById('geminiKeyInput') ? document.getElementById('geminiKeyInput').value.trim() : '';

  const btn = document.getElementById('aiVocabGenBtn');
  const originalText = btn.innerText;
  btn.innerText = '✨ Generating 30 Words...';
  btn.disabled = true;

  try {
    const generated = await IELTS_AI_GENERATOR.generate30VocabTopic(custom, apiKey);
    vocabTopics.unshift(generated);
    currentTopicIndex = 0;
    currentWordIndex = 0;
    renderTopicSelector();
    renderWordGrid();
    loadActiveWord();
    setupCueCardView();
    alert(`✨ Generated 30 Band 8+ Vocabulary Words on: "${generated.topicTitle}"!`);
  } catch (err) {
    alert('Failed to generate AI vocabulary. Please try again.');
    console.error(err);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

// Navigation between Dashboard & Modules
function showView(viewId) {
  const views = {
    'dashboardView': 'flex',
    'speakingView': 'grid',
    'vocabsView': 'flex'
  };
  Object.keys(views).forEach(v => {
    const el = document.getElementById(v);
    if (el) {
      el.style.display = (v === viewId) ? views[v] : 'none';
    }
  });

  // Highlight active nav tab if exists
  document.querySelectorAll('.top-nav-link').forEach(link => {
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showUnderDevModal(moduleName, description) {
  const modal = document.getElementById('underDevModal');
  const title = document.getElementById('underDevModalTitle');
  const desc = document.getElementById('underDevModalDesc');

  if (title) title.innerText = `${moduleName} Module - Under Development`;
  if (desc) desc.innerText = description;
  if (modal) modal.style.display = 'flex';
}

function closeUnderDevModal() {
  const modal = document.getElementById('underDevModal');
  if (modal) modal.style.display = 'none';
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  initVocabSpeech();
  loadVocabBank();
});
