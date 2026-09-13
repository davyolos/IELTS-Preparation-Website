// ============================================================================
// IELTS AI Question Generator (Procedural & Gemini LLM)
// ============================================================================

const IELTS_AI_GENERATOR = {
  // Built-in combinatorial knowledge bank across diverse IELTS domains
  domains: [
    {
      theme: "Artificial Intelligence & Future of Work",
      p1: [
        "Do you use artificial intelligence or automated digital assistants in your daily routine?",
        "Do you believe automation will make human job markets more creative or more precarious?",
        "What technological skill do you believe will be most vital over the next decade?"
      ],
      p2: {
        title: "Describe an AI tool or digital innovation that altered how you work or study.",
        prompts: [
          "What the tool is and when you first encountered it",
          "What specific workflows or creative tasks you utilize it for",
          "How it has streamlined your cognitive efficiency",
          "And explain whether you believe it could eventually lead to over-dependence."
        ]
      },
      p3: [
        "Will algorithmic decision-making erode human autonomy and critical thinking?",
        "Should governments establish binding international treaties on autonomous AI systems?",
        "How can educational institutions adapt evaluation methods in an era of automated synthesis?"
      ]
    },
    {
      theme: "Space Exploration & Astrophysics",
      p1: [
        "Did you ever enjoy looking at the night sky or astronomy when you were younger?",
        "Do you find scientific documentaries about the universe engaging?",
        "Would you consider traveling to outer space if commercial spaceflight becomes affordable?"
      ],
      p2: {
        title: "Describe an exciting scientific discovery or space mission that fascinated you.",
        prompts: [
          "What the discovery or mission was and when you learned about it",
          "Which space agency or scientists were responsible for it",
          "What groundbreaking data or images it uncovered",
          "And explain why this particular milestone left such a profound impression on you."
        ]
      },
      p3: [
        "Is public expenditure on deep space exploration justifiable when urgent socio-economic problems persist on Earth?",
        "Who should hold territorial and resource rights on celestial bodies like Mars and the Moon?",
        "How does contemplating the vastness of the cosmos influence human philosophical outlook?"
      ]
    },
    {
      theme: "Sustainable Urban Design & Future Cities",
      p1: [
        "What is the public transit system like in your hometown?",
        "Do you prefer living in modern high-rise apartments or traditional suburban residences?",
        "Are there sufficient pedestrian zones and cycle paths where you currently reside?"
      ],
      p2: {
        title: "Describe an eco-friendly city or sustainable architectural project you admire.",
        prompts: [
          "Where this city or project is situated",
          "What innovative green designs or renewable features it integrates",
          "How it enhances the quality of life for its inhabitants",
          "And explain why you consider it a model for future human urbanization."
        ]
      },
      p3: [
        "How can densely populated megacities strike a balance between rapid expansion and ecological preservation?",
        "Should private automobiles be completely phased out of metropolitan city centers?",
        "In what ways does physical urban architecture influence the psychological happiness of citizens?"
      ]
    },
    {
      theme: "Psychology & The Pursuit of Happiness",
      p1: [
        "What activities bring you genuine contentment when you feel overwhelmed?",
        "Do you believe people today place more emphasis on work-life balance than past generations did?",
        "How do you maintain a positive disposition during prolonged periods of stress?"
      ],
      p2: {
        title: "Describe a lifestyle adjustment or conscious habit you adopted that improved your well-being.",
        prompts: [
          "What the habit or adjustment was and when you instituted it",
          "What motivated you to make this deliberate change",
          "What obstacles you faced in remaining consistent",
          "And explain how this habit transformed your mental clarity and outlook."
        ]
      },
      p3: [
        "Does commercial consumerism correlate with or detract from long-term emotional fulfillment?",
        "Why do many contemporary societies experience rising anxiety despite unprecedented material abundance?",
        "Should national progress be measured by Gross National Happiness rather than Gross Domestic Product?"
      ]
    },
    {
      theme: "Cultural Heritage & Globalization",
      p1: [
        "Do you enjoy celebrating traditional cultural festivals with your extended family?",
        "Are young people in your country still enthusiastic about folk arts and historical heritage?",
        "What traditional dish from your culture would you recommend to an international visitor?"
      ],
      p2: {
        title: "Describe an ancient historical site or monument that you visited and found captivating.",
        prompts: [
          "Where the historical site is situated and when you visited",
          "What architectural or historical significance it represents",
          "What you observed and learned while exploring the monument",
          "And explain why preserving this particular site is crucial for future generations."
        ]
      },
      p3: [
        "Is globalization inexorably diluting unique indigenous languages and regional cultures?",
        "How can commercial tourism be managed so it does not destroy fragile cultural relics?",
        "Should stolen cultural antiquities housed in foreign museums be repatriated to their countries of origin?"
      ]
    }
  ],

  // Generate either procedural or Gemini-powered questions
  async generate(customTopic = "", apiKey = "") {
    if (apiKey && apiKey.trim().length > 10) {
      try {
        return await this.generateViaGemini(customTopic, apiKey.trim());
      } catch (err) {
        console.warn("Gemini generation failed, falling back to procedural engine:", err);
      }
    }
    return this.generateProcedural(customTopic);
  },

  // Procedural generator
  generateProcedural(customTopic = "") {
    let domain;
    if (customTopic) {
      // Find matching domain or synthesize
      domain = this.domains.find(d => d.theme.toLowerCase().includes(customTopic.toLowerCase())) || this.synthesizeCustomDomain(customTopic);
    } else {
      const idx = Math.floor(Math.random() * this.domains.length);
      domain = this.domains[idx];
    }

    const randomP1 = domain.p1[Math.floor(Math.random() * domain.p1.length)];

    return {
      isAIGenerated: true,
      category: `AI: ${domain.theme}`,
      part1Question: randomP1,
      part2CueCard: {
        title: domain.p2.title,
        prompts: domain.p2.prompts
      },
      part3Questions: domain.p3
    };
  },

  synthesizeCustomDomain(topic) {
    return {
      theme: topic,
      p1: [
        `How did you first develop an interest in ${topic}?`,
        `Do you believe ${topic} plays a prominent role in modern society?`,
        `What do you foresee being the most substantial breakthrough in ${topic} over the next decade?`
      ],
      p2: {
        title: `Describe a pivotal experience or fascinating aspect of ${topic} that influenced you.`,
        prompts: [
          `What this aspect or experience was regarding ${topic}`,
          `When and where you first encountered it`,
          `What challenges or unique insights you derived from it`,
          `And explain why this particular dimension of ${topic} is of paramount importance to you.`
        ]
      },
      p3: [
        `How has public awareness and governmental policy toward ${topic} shifted over recent years?`,
        `What ethical or economic dilemmas arise when societies confront issues surrounding ${topic}?`,
        `To what extent should international collaboration take precedence over national interests regarding ${topic}?`
      ]
    };
  },

  // LLM generation via Gemini
  async generateViaGemini(customTopic, apiKey) {
    const prompt = `You are a Senior Cambridge IELTS Speaking Examiner.
Generate a complete, brand-new, authentic IELTS Speaking Exam set for Band 8.5+ practice.
${customTopic ? `Theme requested: "${customTopic}"` : "Choose a fresh, intellectually engaging theme (e.g., behavioral economics, cognitive science, environmental legislation, digital art, autonomous robotics, global migration)."}

Provide:
1. One Part 1 Intro Question (probing, familiar).
2. One Part 2 Cue Card (Title + 4 specific bullet prompts: "You should say: ...").
3. Three Part 3 Analytical Discussion Questions (abstract, societal, critical thinking).

Return pure JSON only:
{
  "category": "Theme Name",
  "part1Question": "...",
  "part2CueCard": {
    "title": "Describe ...",
    "prompts": [
      "...",
      "...",
      "...",
      "And explain ..."
    ]
  },
  "part3Questions": [
    "...",
    "...",
    "..."
  ]
}`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await resp.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return {
      isAIGenerated: true,
      category: `AI: ${parsed.category}`,
      part1Question: parsed.part1Question,
      part2CueCard: parsed.part2CueCard,
      part3Questions: parsed.part3Questions
    };
  },

  // Generate 30 Vocabulary Words for IELTS Topic
  async generate30VocabTopic(customTopic = "", apiKey = "") {
    if (apiKey && apiKey.trim().length > 10) {
      try {
        return await this.generate30VocabViaGemini(customTopic, apiKey.trim());
      } catch (err) {
        console.warn("Gemini vocab generation failed, falling back to procedural:", err);
      }
    }
    return this.generate30VocabProcedural(customTopic);
  },

  generate30VocabProcedural(customTopic = "") {
    // If empty, generate a fresh dynamic topic
    const dynamicThemes = [
      {
        title: "Public Health, Epidemiology & Modern Medicine",
        desc: "Essential C1/C2 vocabulary for medical advancements, healthcare access, and global epidemics.",
        cueTitle: "Describe a public health policy or medical innovation that significantly improved lives.",
        prompts: ["What the policy or innovation is", "How it combats widespread health vulnerabilities", "What obstacles hindered its universal deployment", "And explain why equitable healthcare remains of paramount importance."]
      },
      {
        title: "Global Economics, Wealth Disparity & Future of Labor",
        desc: "Academic vocabulary for fiscal policies, income inequality, trade, and economic mobility.",
        cueTitle: "Describe an economic trend or employment challenge confronting modern workers.",
        prompts: ["What the economic trend is", "What underlying systemic factors drove this development", "How it impacts vulnerable demographics", "And explain what measures could ensure equitable economic prosperity."]
      },
      {
        title: "Art, Cultural Preservation & Architecture",
        desc: "Band 8+ lexical resource for aesthetic appreciation, historical restoration, and creative arts.",
        cueTitle: "Describe an architectural masterpiece or cultural monument of profound historical value.",
        prompts: ["Where the monument is situated and its cultural significance", "What distinct aesthetic features define it", "Why maintaining cultural heritage is vital in a globalized era", "And explain how encountering this artwork influenced your perception."]
      }
    ];

    const sel = customTopic 
      ? { title: customTopic, desc: "Specialized Band 8.5 vocabulary and collocations tailored for " + customTopic, cueTitle: "Describe a significant challenge or development related to " + customTopic + ".", prompts: ["What the development or challenge is", "Why it has garnered substantial public discourse", "What consequences it holds for broader society", "And explain your perspective on resolving issues regarding " + customTopic + "."] }
      : dynamicThemes[Math.floor(Math.random() * dynamicThemes.length)];

    // Curate 30 high-frequency C1/C2 IELTS vocabulary words
    const baseWords = [
      { word: "Substantial", pos: "adjective", meaning: "Of considerable importance, size, or worth.", collocations: ["substantial increase", "substantial evidence", "substantial progress"] },
      { word: "Pivotal", pos: "adjective", meaning: "Of crucial importance in relation to the development or success of something else.", collocations: ["play a pivotal role", "pivotal moment", "pivotal decision"] },
      { word: "Detrimental", pos: "adjective", meaning: "Tending to cause harm or damage.", collocations: ["detrimental effect", "detrimental impact", "highly detrimental"] },
      { word: "Mitigate", pos: "verb", meaning: "To make something less severe, serious, or painful.", collocations: ["mitigate risks", "mitigate the impact", "mitigate consequences"] },
      { word: "Proliferation", pos: "noun", meaning: "Rapid increase in the number or amount of something.", collocations: ["rapid proliferation", "proliferation of technology", "proliferation of tools"] },
      { word: "Indispensable", pos: "adjective", meaning: "Absolutely necessary; essential.", collocations: ["indispensable asset", "indispensable tool", "indispensable role"] },
      { word: "Paramount", pos: "adjective", meaning: "More important than anything else; supreme.", collocations: ["paramount importance", "paramount concern", "hold paramount"] },
      { word: "Exacerbate", pos: "verb", meaning: "To make a problem, bad situation, or negative feeling worse.", collocations: ["exacerbate the problem", "exacerbate tensions", "exacerbate disparity"] },
      { word: "Ubiquitous", pos: "adjective", meaning: "Present, appearing, or found everywhere.", collocations: ["ubiquitous presence", "become ubiquitous", "ubiquitous nature"] },
      { word: "Resilience", pos: "noun", meaning: "The capacity to withstand or recover quickly from difficulties.", collocations: ["build resilience", "demonstrate resilience", "remarkable resilience"] },
      { word: "Equitable", pos: "adjective", meaning: "Fair and impartial; just.", collocations: ["equitable distribution", "equitable access", "equitable society"] },
      { word: "Viable", pos: "adjective", meaning: "Capable of working successfully; feasible.", collocations: ["viable alternative", "economically viable", "viable solution"] },
      { word: "Imperative", pos: "adjective", meaning: "Of vital importance; crucial.", collocations: ["moral imperative", "imperative to act", "economic imperative"] },
      { word: "Incentivize", pos: "verb", meaning: "To provide an incentive or motivation for doing something.", collocations: ["incentivize innovation", "incentivize workers", "incentivize adoption"] },
      { word: "Precipitate", pos: "verb", meaning: "To cause an event or situation (typically bad) to happen suddenly or unexpectedly.", collocations: ["precipitate a crisis", "precipitate decline", "precipitate change"] },
      { word: "Cognitive", pos: "adjective", meaning: "Relating to mental action or process of acquiring knowledge.", collocations: ["cognitive skills", "cognitive faculties", "cognitive load"] },
      { word: "Disparity", pos: "noun", meaning: "A great difference or inequality.", collocations: ["growing disparity", "wealth disparity", "regional disparity"] },
      { word: "Homogenize", pos: "verb", meaning: "To make uniform or similar, diminishing diversity.", collocations: ["homogenize culture", "homogenize opinion", "risk homogenizing"] },
      { word: "Unprecedented", pos: "adjective", meaning: "Never done or known before; without parallel.", collocations: ["unprecedented scale", "unprecedented growth", "unprecedented crisis"] },
      { word: "Disseminate", pos: "verb", meaning: "To spread or disperse information widely.", collocations: ["disseminate knowledge", "disseminate information", "widely disseminate"] },
      { word: "Facilitate", pos: "verb", meaning: "To make an action or process smooth or easier.", collocations: ["facilitate dialogue", "facilitate progress", "facilitate access"] },
      { word: "Stifle", pos: "verb", meaning: "To restrain, suppress, or prevent from flourishing.", collocations: ["stifle creativity", "stifle innovation", "stifle growth"] },
      { word: "Intrinsically", pos: "adverb", meaning: "In an essential or natural manner; inherently.", collocations: ["intrinsically linked", "intrinsically valuable", "intrinsically motivated"] },
      { word: "Nuance", pos: "noun", meaning: "A subtle distinction or variation in meaning or tone.", collocations: ["subtle nuance", "appreciate nuances", "grasp the nuance"] },
      { word: "Accountability", pos: "noun", meaning: "The condition of being responsible and answerable for actions.", collocations: ["ensure accountability", "hold accountable", "lack of accountability"] },
      { word: "Discrepancy", pos: "noun", meaning: "A noticeable lack of compatibility between two facts.", collocations: ["glaring discrepancy", "reconcile discrepancy", "apparent discrepancy"] },
      { word: "Harmonious", pos: "adjective", meaning: "Forming a pleasing or consistent whole.", collocations: ["harmonious coexistence", "harmonious relationship", "harmonious society"] },
      { word: "Deteriorate", pos: "verb", meaning: "To become progressively worse.", collocations: ["deteriorate rapidly", "conditions deteriorate", "cause to deteriorate"] },
      { word: "Consensus", pos: "noun", meaning: "A general agreement among a group of people.", collocations: ["reach a consensus", "scientific consensus", "broad consensus"] },
      { word: "Epitome", pos: "noun", meaning: "A person or thing that is a perfect example of a quality.", collocations: ["the epitome of", "serve as the epitome", "stand as the epitome"] }
    ];

    const words = baseWords.map((w, idx) => ({
      id: idx + 1,
      word: w.word,
      pos: w.pos,
      meaning: w.meaning,
      example: "In the context of " + sel.title.toLowerCase() + ", " + w.word.toLowerCase() + " dynamics play a significant role.",
      collocations: w.collocations
    }));

    return {
      topicId: "custom_" + Date.now(),
      topicTitle: sel.title,
      description: sel.desc,
      speechCueCard: {
        title: sel.cueTitle,
        prompts: sel.prompts
      },
      words: words
    };
  },

  async generate30VocabViaGemini(customTopic, apiKey) {
    const prompt = `You are an expert Cambridge IELTS lexicographer.
Generate a cohesive 30-word academic IELTS vocabulary module for Band 8.5+ test preparation.
Theme: "${customTopic || "Modern Technological Disruption & Ethics"}"

Provide:
1. topicTitle: A concise, academic topic name.
2. description: One sentence explaining why this topic is frequent in IELTS.
3. speechCueCard: A 2-minute IELTS Part 2 Cue Card prompt testing this topic (title + 4 bullet prompts).
4. words: Exactly 30 C1/C2 Band 8+ academic words/idiomatic phrases. For each word provide:
   - id: 1 to 30
   - word: capitalized target word
   - pos: part of speech (noun, verb, adjective, adverb, idiom)
   - meaning: precise definition
   - example: Band 8.5 example sentence specifically addressing the topic
   - collocations: array of 3 natural collocations

Return pure JSON only:
{
  "topicTitle": "...",
  "description": "...",
  "speechCueCard": {
    "title": "...",
    "prompts": ["...", "...", "...", "..."]
  },
  "words": [
    { "id": 1, "word": "...", "pos": "...", "meaning": "...", "example": "...", "collocations": ["...", "...", "..."] }
  ]
}`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await resp.json();
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return {
      topicId: "gemini_" + Date.now(),
      topicTitle: parsed.topicTitle,
      description: parsed.description,
      speechCueCard: parsed.speechCueCard,
      words: parsed.words
    };
  }

};
