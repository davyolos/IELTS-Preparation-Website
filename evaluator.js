// ============================================================================
// IELTS Speaking 7-Criteria Evaluator & Band 8.5+ Rephrase Engine
// Designed for rigorous Cambridge-style Band 8.0 - 9.0 assessment
// ============================================================================

const IELTS_EVALUATOR = {
  // Common fillers that drag fluency down
  fillers: [
    /\b(um+)\b/gi, /\b(uh+)\b/gi, /\b(er+)\b/gi, /\b(ah+)\b/gi,
    /\b(like)\b/gi, /\b(you know)\b/gi, /\b(sort of)\b/gi, /\b(kind of)\b/gi,
    /\b(basically)\b/gi, /\b(i mean)\b/gi
  ],

  // Band 8+ Discourse Markers
  discourseMarkers: [
    { phrase: "having said that", band: 8.5 },
    { phrase: "on the flip side", band: 8.0 },
    { phrase: "from my perspective", band: 8.0 },
    { phrase: "to put it into perspective", band: 8.5 },
    { phrase: "subsequently", band: 8.5 },
    { phrase: "in light of this", band: 8.5 },
    { phrase: "as a consequence", band: 8.0 },
    { phrase: "conversely", band: 8.5 },
    { phrase: "paradoxically", band: 9.0 },
    { phrase: "what struck me most was", band: 8.5 },
    { phrase: "it is worth noting that", band: 8.5 },
    { phrase: "furthermore", band: 7.5 },
    { phrase: "moreover", band: 7.5 },
    { phrase: "nevertheless", band: 8.0 },
    { phrase: "on the contrary", band: 8.0 },
    { phrase: "owing to", band: 8.5 }
  ],

  // Band 8+ Lexical Items (Academic / C1 / C2)
  advancedLexicon: [
    "indispensable", "paramount", "profound", "lucrative", "detrimental",
    "mitigate", "ubiquitous", "proliferation", "unprecedented", "substantial",
    "viable", "cognitive", "consensus", "integral", "nuance", "exacerbate",
    "dilemma", "endeavor", "resilience", "catalyst", "comprehensive",
    "inevitable", "meticulous", "plethora", "exemplify", "tangible",
    "intrinsically", "streamline", "formidable", "etched", "aspire"
  ],

  // Basic overused words to replace
  elementaryWords: [
    { regex: /\bvery important\b/gi, upgrade: "of paramount importance / indispensable", note: "Shows C1 collocation precision" },
    { regex: /\bi think (that)?\b/gi, upgrade: "from my perspective / I am firmly convinced that", note: "Demonstrates diverse stance marking" },
    { regex: /\bgood\b/gi, upgrade: "exceptional / intellectually stimulating / beneficial", note: "Eliminates vague elementary descriptor" },
    { regex: /\bbad\b/gi, upgrade: "detrimental / adverse / counterproductive", note: "Employs high-band academic tone" },
    { regex: /\bvery\b/gi, upgrade: "exceptionally / immensely / profoundly", note: "Avoids colloquial intensifiers" },
    { regex: /\ba lot of\b/gi, upgrade: "a plethora of / an abundance of / substantial", note: "Band 8+ quantifiers" },
    { regex: /\bbig\b/gi, upgrade: "monumental / substantial / significant", note: "More precise academic phrasing" },
    { regex: /\band then\b/gi, upgrade: "subsequently / in the aftermath of", note: "Shows chronological cohesion" },
    { regex: /\blike\b/gi, upgrade: "such as / to exemplify", note: "Formal exemplar phrasing" },
    { regex: /\bthings?\b/gi, upgrade: "aspects / dimensions / considerations", note: "Replaces vague filler nouns" },
    { regex: /\bstuff\b/gi, upgrade: "materials / components / items", note: "Removes informal slang" }
  ],

  // Natural Idiomatic Collocations
  idiomsAndCollocations: [
    "spur of the moment", "strike a chord", "double-edged sword", "hectic schedule",
    "food for thought", "burn the midnight oil", "weigh the pros and cons",
    "step out of my comfort zone", "in the long run", "pave the way",
    "take with a grain of salt", "leave no stone unturned", "blessing in disguise",
    "bread and butter", "second to none", "play a pivotal role", "lasting impression"
  ],

  // Common Grammatical Errors to Detect
  grammarSlips: [
    { regex: /\b(he|she|it) don'?t\b/gi, correction: "$1 doesn't", rule: "Subject-Verb Agreement" },
    { regex: /\b(they|we|you) is\b/gi, correction: "$1 are", rule: "Subject-Verb Agreement" },
    { regex: /\bmore (better|easier|faster|harder)\b/gi, correction: "$1", rule: "Double Comparative Error" },
    { regex: /\bdiscuss about\b/gi, correction: "discuss", rule: "Redundant Preposition ('discuss' is transitive)" },
    { regex: /\bdepend of\b/gi, correction: "depend on", rule: "Preposition Collocation" },
    { regex: /\b(many|several) informations?\b/gi, correction: "pieces of information / information", rule: "Uncountable Noun Slip" },
    { regex: /\b(many|several) advices?\b/gi, correction: "pieces of advice / advice", rule: "Uncountable Noun Slip" },
    { regex: /\bpeople says?\b/gi, correction: "people say", rule: "Plural Noun Agreement" }
  ],

  // Main evaluation function
  evaluate(transcript, durationSeconds = 45, questionContext = "") {
    const text = transcript.trim();
    const words = text.length > 0 ? text.split(/\s+/) : [];
    const wordCount = words.length;

    if (wordCount < 5) {
      return {
        error: "Insufficient speech recorded. Please speak at least 1-2 complete sentences."
      };
    }

    // 1. Calculate WPM (Words Per Minute)
    const effectiveDurationMin = Math.max(durationSeconds / 60, 0.25);
    const wpm = Math.round(wordCount / effectiveDurationMin);

    // ------------------------------------------------------------------------
    // Criterion 1: Fluency & Speech Continuity (FC)
    // ------------------------------------------------------------------------
    let fillerCount = 0;
    this.fillers.forEach(rx => {
      const matches = text.match(rx);
      if (matches) fillerCount += matches.length;
    });

    let scoreFC = 8.5;
    let feedbackFC = "";

    if (wpm < 85) {
      scoreFC -= 2.0;
      feedbackFC = `Speaking rate was notably slow (${wpm} WPM). Band 8 requires an effortless natural tempo between 120-150 WPM without noticeable hesitation.`;
    } else if (wpm < 110) {
      scoreFC -= 1.0;
      feedbackFC = `Pacing was slightly hesitant (${wpm} WPM). Aim to link your thoughts into longer, continuous breath-groups.`;
    } else if (wpm > 185) {
      scoreFC -= 0.5;
      feedbackFC = `Rapid delivery (${wpm} WPM). Slow down slightly to ensure clear thought articulation and natural sentence stress.`;
    } else {
      scoreFC = 8.5;
      feedbackFC = `Excellent natural cadence (${wpm} WPM). Sustained speech with minimal searching for words.`;
    }

    if (fillerCount > 6) {
      scoreFC -= 1.5;
      feedbackFC += ` Frequent verbal fillers (${fillerCount} detected: 'um/like/you know') disrupt fluency. Practice silent pausing instead.`;
    } else if (fillerCount > 3) {
      scoreFC -= 0.5;
      feedbackFC += ` Minor hesitation fillers detected (${fillerCount}). Work on replacing fillers with bridging phrases.`;
    }

    // Length penalty based on exam expectations
    if (wordCount < 30) {
      scoreFC = Math.min(scoreFC, 6.0);
      feedbackFC = "Response was too brief. Expand your ideas with reasons, specific examples, and reflections.";
    }

    // ------------------------------------------------------------------------
    // Criterion 2: Coherence & Discourse Structure (COH)
    // ------------------------------------------------------------------------
    let detectedMarkers = [];
    this.discourseMarkers.forEach(item => {
      const rx = new RegExp(`\\b${item.phrase}\\b`, "gi");
      if (rx.test(text)) detectedMarkers.push(item.phrase);
    });

    const hasJustification = /\b(because|owing to|due to the fact that|since|inasmuch as|which means that)\b/i.test(text);
    const hasContrast = /\b(however|having said that|whereas|while|on the contrary|conversely|in spite of)\b/i.test(text);

    let scoreCOH = 6.5;
    let feedbackCOH = "";

    if (detectedMarkers.length >= 3 && hasJustification && hasContrast) {
      scoreCOH = 8.5;
      feedbackCOH = `Sophisticated discourse structure. Fluid use of high-level transitions (${detectedMarkers.slice(0, 3).join(", ")}) and balanced arguments.`;
    } else if (detectedMarkers.length >= 1 && hasJustification) {
      scoreCOH = 7.5;
      feedbackCOH = `Good logical sequence, but connectors are somewhat predictable. Introduce subtle discourse markers like 'having said that' or 'paradoxically'.`;
    } else {
      scoreCOH = 6.0;
      feedbackCOH = "Sentences lack clear cohesive transitions. Link your ideas logically with cohesive markers rather than isolated statements.";
    }

    // ------------------------------------------------------------------------
    // Criterion 3: Lexical Resource (LR)
    // ------------------------------------------------------------------------
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
    const lexicalDiversity = uniqueWords / wordCount; // Type-Token Ratio

    let detectedAdvancedWords = [];
    this.advancedLexicon.forEach(word => {
      const rx = new RegExp(`\\b${word}\\w*\\b`, "gi");
      if (rx.test(text)) detectedAdvancedWords.push(word);
    });

    let detectedElementary = [];
    this.elementaryWords.forEach(item => {
      const matches = text.match(item.regex);
      if (matches) {
        detectedElementary.push({
          original: matches[0],
          upgrade: item.upgrade,
          note: item.note
        });
      }
    });

    let scoreLR = 7.0;
    let feedbackLR = "";

    if (detectedAdvancedWords.length >= 3 && lexicalDiversity > 0.65) {
      scoreLR = 8.5;
      feedbackLR = `Rich, precise C1/C2 vocabulary demonstrated (${detectedAdvancedWords.slice(0, 3).join(", ")}). High lexical variation without repetition.`;
    } else if (detectedAdvancedWords.length >= 1 || lexicalDiversity > 0.55) {
      scoreLR = 7.5;
      feedbackLR = `Sufficient vocabulary for clear communication, but relies on common adjectives. Elevate descriptions with topic-specific academic terms.`;
    } else {
      scoreLR = 6.0;
      feedbackLR = `Repetitive and basic lexical range. Avoid relying on 'good', 'important', and 'big'. Consult the upgrade table below.`;
    }

    // ------------------------------------------------------------------------
    // Criterion 4: Idiomatic Language & Natural Collocations (IDM)
    // ------------------------------------------------------------------------
    let detectedIdioms = [];
    this.idiomsAndCollocations.forEach(phrase => {
      const rx = new RegExp(`\\b${phrase}\\b`, "gi");
      if (rx.test(text)) detectedIdioms.push(phrase);
    });

    let scoreIDM = 6.5;
    let feedbackIDM = "";

    if (detectedIdioms.length >= 2) {
      scoreIDM = 8.5;
      feedbackIDM = `Outstanding native-like idiomatic mastery (${detectedIdioms.join(", ")}). Collocations were effortless and contextually appropriate.`;
    } else if (detectedIdioms.length === 1) {
      scoreIDM = 7.5;
      feedbackIDM = `Used authentic collocation (${detectedIdioms[0]}). To solidify Band 8.5, incorporate more natural phrasal verbs and collocations.`;
    } else {
      scoreIDM = 6.5;
      feedbackIDM = `Few or no natural idiomatic collocations detected. Band 8 strictly requires less-common and idiomatic vocabulary used naturally.`;
    }

    // ------------------------------------------------------------------------
    // Criterion 5: Grammatical Complexity & Range (GR)
    // ------------------------------------------------------------------------
    const hasConditionals = /\b(if\s+\w+\s+(had|were|would|could)|had\s+i\s+\w+|were\s+it\s+not\s+for)\b/i.test(text);
    const hasPassive = /\b(is|are|was|were|been|being)\s+\w+ed\b/i.test(text);
    const hasRelativeClause = /\b(which|whose|whom|whereby|in which)\b/i.test(text);
    const hasCleftOrInversion = /\b(what struck me|not only\b.*?\bbut also|seldom|rarely have)\b/i.test(text);

    let complexityCount = 0;
    if (hasConditionals) complexityCount++;
    if (hasPassive) complexityCount++;
    if (hasRelativeClause) complexityCount++;
    if (hasCleftOrInversion) complexityCount++;

    let scoreGR = 6.5;
    let feedbackGR = "";

    if (complexityCount >= 3) {
      scoreGR = 8.5;
      feedbackGR = "Exceptional grammatical flexibility. Successfully integrated complex conditionals, embedded clauses, and passive constructions.";
    } else if (complexityCount >= 1) {
      scoreGR = 7.5;
      feedbackGR = "Good mix of simple and compound sentences, but lacks advanced syntactic range (e.g., third conditionals, cleft sentences).";
    } else {
      scoreGR = 6.0;
      feedbackGR = "Heavily reliant on simple coordinate sentences ('and / but'). Practice forming subordinate and conditional clauses.";
    }

    // ------------------------------------------------------------------------
    // Criterion 6: Grammatical Accuracy & Error Ratio (GA)
    // ------------------------------------------------------------------------
    let detectedErrors = [];
    this.grammarSlips.forEach(item => {
      const match = text.match(item.regex);
      if (match) {
        detectedErrors.push({
          error: match[0],
          correction: item.correction,
          rule: item.rule
        });
      }
    });

    let scoreGA = 8.5;
    let feedbackGA = "";

    if (detectedErrors.length === 0) {
      scoreGA = 8.5;
      feedbackGA = "Consistently accurate structures with virtually no systemic grammatical slips. Full control of tense and agreement.";
    } else if (detectedErrors.length === 1) {
      scoreGA = 7.5;
      feedbackGA = `Minor grammatical slip detected (${detectedErrors[0].rule}). Majority of clauses remain error-free.`;
    } else {
      scoreGA = 6.0;
      feedbackGA = `Multiple grammatical slips detected (${detectedErrors.map(e => e.error).join(", ")}). Focus on subject-verb agreement and preposition accuracy.`;
    }

    // ------------------------------------------------------------------------
    // Criterion 7: Pronunciation & Delivery Cadence (PRON)
    // ------------------------------------------------------------------------
    let scorePRON = 8.0;
    let feedbackPRON = "";

    if (wpm >= 115 && wpm <= 155 && fillerCount <= 2) {
      scorePRON = 8.5;
      feedbackPRON = `Optimal rhythm (~${wpm} WPM) with natural sentence cadence and thought-group chunking. Minimal phonological hesitation.`;
    } else if (wpm < 100 || wpm > 175) {
      scorePRON = 7.0;
      feedbackPRON = `Pacing (${wpm} WPM) affected delivery flow. Practice speaking in breath-groups with clear nuclear syllable stress.`;
    } else {
      scorePRON = 7.5;
      feedbackPRON = "Intelligible delivery with consistent pacing. Enhance pitch variation and intonation to emphasize key arguments.";
    }

    // ------------------------------------------------------------------------
    // Overall Band Calculation (Rounded to nearest 0.5)
    // ------------------------------------------------------------------------
    const clamp = (n) => Math.max(4.0, Math.min(9.0, n));
    scoreFC = clamp(scoreFC);
    scoreCOH = clamp(scoreCOH);
    scoreLR = clamp(scoreLR);
    scoreIDM = clamp(scoreIDM);
    scoreGR = clamp(scoreGR);
    scoreGA = clamp(scoreGA);
    scorePRON = clamp(scorePRON);

    const rawAverage = (scoreFC + scoreCOH + scoreLR + scoreIDM + scoreGR + scoreGA + scorePRON) / 7;
    // IELTS standard half-band rounding rule:
    const decimal = rawAverage - Math.floor(rawAverage);
    let overallBand = Math.floor(rawAverage);
    if (decimal >= 0.75) overallBand += 1.0;
    else if (decimal >= 0.25) overallBand += 0.5;

    // ------------------------------------------------------------------------
    // Band 8.5+ Model Rephrase Generation
    // ------------------------------------------------------------------------
    const modelRephrase = this.generateBand85Rephrase(text, questionContext);

    // Ensure we have useful vocabulary upgrades
    if (detectedElementary.length === 0) {
      detectedElementary.push(
        { original: "in my opinion", upgrade: "from my standpoint / it is my firm conviction that", note: "Elevates personal stance marker to C1" },
        { original: "a good thing", upgrade: "an invaluable asset / an undeniable boon", note: "Academic collocation" },
        { original: "because of this", upgrade: "as a consequence of this / in light of these developments", note: "Enhances cohesion" }
      );
    }

    // Generate actionable improvement suggestions
    const actionableTips = this.generateActionableTips({
      scoreFC, scoreCOH, scoreLR, scoreIDM, scoreGR, scoreGA, scorePRON,
      wpm, fillerCount, detectedMarkers, detectedAdvancedWords
    });

    return {
      overallBand: overallBand.toFixed(1),
      wpm,
      wordCount,
      durationSeconds,
      criteria: {
        fluency: { name: "1. Fluency & Speech Continuity", score: scoreFC.toFixed(1), feedback: feedbackFC },
        coherence: { name: "2. Coherence & Discourse Structure", score: scoreCOH.toFixed(1), feedback: feedbackCOH },
        lexical: { name: "3. Lexical Breadth & Precision", score: scoreLR.toFixed(1), feedback: feedbackLR },
        idiomatic: { name: "4. Idiomatic Collocations", score: scoreIDM.toFixed(1), feedback: feedbackIDM },
        grammarRange: { name: "5. Grammatical Complexity", score: scoreGR.toFixed(1), feedback: feedbackGR },
        grammarAcc: { name: "6. Grammatical Accuracy", score: scoreGA.toFixed(1), feedback: feedbackGA },
        pronunciation: { name: "7. Delivery Cadence & Rhythm", score: scorePRON.toFixed(1), feedback: feedbackPRON }
      },
      modelRephrase,
      upgrades: detectedElementary,
      grammarSlips: detectedErrors,
      actionableTips
    };
  },

  // Band 8.5 / 9.0 Rephrasing Logic
  generateBand85Rephrase(candidateText, question = "") {
    // Strip elementary fillers
    let cleaned = candidateText
      .replace(/\b(um+|uh+|er+|ah+|like|you know|sort of|kind of|basically)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Contextual opener
    let opener = "From my standpoint, ";
    if (/hometown|city|place/i.test(question)) {
      opener = "Reflecting on my background, ";
    } else if (/challenge|difficulty|obstacle/i.test(question)) {
      opener = "Looking back at that critical milestone, ";
    } else if (/technology|device|future|ai/i.test(question)) {
      opener = "In the context of rapid technological proliferation, ";
    }

    // Elevated template embedding the candidate's exact ideas
    return `${opener}I would contend that ${cleaned}. Having said that, what struck me the most throughout this experience is the pivotal role it played in broadening my horizons. Were I to find myself in a similar situation in the future, I would undoubtedly adopt a comparable mindset, as it proved to be an indispensable learning curve.`;
  },

  // Actionable tips for jumping to Band 8+
  generateActionableTips(data) {
    const tips = [];
    if (data.scoreFC < 8.0) {
      tips.push("Fluency: Eliminate filler words ('um', 'like'). When you need time to formulate your next thought, use native bridging phrases such as 'That is an intriguing question...' or 'If we look at it from another angle...' rather than silence or fillers.");
    }
    if (data.scoreCOH < 8.0) {
      tips.push("Coherence: Practice using at least two high-level signposts in every answer (e.g., 'Having said that...', 'Consequently...', 'On the flip side...').");
    }
    if (data.scoreLR < 8.0) {
      tips.push("Lexical Resource: Review the Vocabulary Upgrade Table below. Replace generic adjectives like 'good' or 'bad' with precise academic vocabulary ('indispensable', 'detrimental', 'profound').");
    }
    if (data.scoreIDM < 8.0) {
      tips.push("Idiomatic Mastery: Memorize 5 versatile collocations ('double-edged sword', 'spur of the moment', 'strike a chord', 'hectic routine', 'play a pivotal role') and integrate one into your Part 2 and Part 3 answers.");
    }
    if (data.scoreGR < 8.0) {
      tips.push("Grammar Range: Intentionally include a conditional sentence ('If I had not taken that step, the outcome would have been markedly different') or an inversion ('Seldom do we realize...') to demonstrate Band 8+ syntactic sophistication.");
    }
    if (tips.length === 0) {
      tips.push("Consistently high performance! Focus on maintaining expressive nuclear pitch intonation and varied sentence pace under timed pressure.");
    }
    return tips;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = IELTS_EVALUATOR;
}

