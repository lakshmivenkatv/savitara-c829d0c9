import { pipeline } from '@huggingface/transformers';

interface IndicNLPConfig {
  language: string;
  context?: string;
}

interface MessageAnalysis {
  intent: string;
  entities: string[];
  sentiment: string;
  topics: string[];
  questionType: string;
}

class IndicNLPEngine {
  private static instance: IndicNLPEngine;
  private isInitialized = false;
  private bertModel: any = null;
  private contextualTemplates: Record<string, Record<string, string[]>>;

  constructor() {
    // Enhanced contextual templates with more variety
    this.contextualTemplates = {
      hindi: {
        definition: [
          "{topic} का अर्थ और परिभाषा को समझते हैं तो यह आध्यात्मिक जीवन की आधारशिला है।",
          "वैदिक दर्शन में {topic} की स्पष्ट व्याख्या मिलती है जो जीवन को दिशा देती है।",
          "{topic} के मूल तत्वों को समझना आत्म-साक्षात्कार की ओर पहला कदम है।"
        ],
        process: [
          "{topic} का अभ्यास करने की पद्धति शास्त्रों में विस्तार से बताई गई है।",
          "गुरु परंपरा के अनुसार {topic} को इस प्रकार अपनाना चाहिए।",
          "{topic} की साधना में धैर्य और निरंतरता सबसे महत्वपूर्ण है।"
        ],
        explanation: [
          "{topic} के पीछे का गहरा दर्शन यह है कि सभी कुछ परस्पर जुड़ा हुआ है।",
          "हमारे ऋषि-मुनियों ने {topic} के माध्यम से जीवन की सच्चाई को समझाया है।",
          "{topic} केवल सिद्धांत नहीं बल्कि जीने का तरीका है।"
        ],
        calendar: [
          "आज का {topic} जानने के लिए पंचांग का अध्ययन आवश्यक है। वर्तमान में सटीक {topic} की गणना के लिए स्थान और समय की जानकारी चाहिए।",
          "{topic} हिंदू कैलेंडर का महत्वपूर्ण हिस्सा है। यह चंद्र गणना पर आधारित है और दैनिक जीवन में इसका विशेष महत्व है।",
          "वैदिक ज्योतिष के अनुसार {topic} का ज्ञान शुभ कार्यों के लिए अत्यंत महत्वपूर्ण है।"
        ],
        general: [
          "{topic} के बारे में शास्त्रों में गहन ज्ञान प्राप्त होता है।",
          "वैदिक परंपरा में {topic} का महत्वपूर्ण स्थान है।"
        ]
      },
      sanskrit: {
        definition: [
          "{topic} विषये वेदेषु स्पष्टं विवरणं प्राप्यते।",
          "धर्मशास्त्राणां मतेन {topic} आध्यात्मिकजीवनस्य मूलभूतं तत्वम् अस्ति।"
        ],
        process: [
          "{topic} अभ्यासस्य विधिः शास्त्रेषु विस्तारेण वर्णितः।",
          "गुरुपरम्परया {topic} साधनं कर्तव्यम्।"
        ],
        calendar: [
          "अद्य {topic} ज्ञानार्थं पञ्चाङ्गस्य अध्ययनम् आवश्यकम्।",
          "{topic} चन्द्रगणनायाः आधारेण निर्धार्यते।"
        ]
      },
      telugu: {
        definition: [
          "{topic} గురించి వేదాలలో స్పష్టమైన వివరణ లభిస్తుంది।",
          "ధర్మ శాస్త్రాల ప్రకారం {topic} ఆధ్యాత్మిక జీవితానికి పునాది।"
        ],
        process: [
          "{topic} అభ్యాసం చేసే పద్ధతి శాస్త్రాలలో వివరంగా చెప్పబడింది।",
          "గురు సంప్రదాయం ప్రకారం {topic} ని ఈ విధంగా అనుసరించాలి।"
        ],
        explanation: [
          "{topic} వెనుక ఉన్న లోతైన తత్వం అన్నీ పరస్పరం అనుసంధానించబడి ఉన్నాయి.",
          "{topic} కేవలం సిద్ధాంతం కాదు, జీవించే విధానం।"
        ],
        calendar: [
          "నేటి {topic} తెలుసుకోవాలంటే పంచాంగం చూడాలి।",
          "{topic} చంద్ర గణన ఆధారంగా నిర్ధారించబడుతుంది।"
        ]
      },
      kannada: {
        definition: [
          "{topic} ಬಗ್ಗೆ ವೇದಗಳಲ್ಲಿ ಸ್ಪಷ್ಟವಾದ ವಿವರಣೆ ಲಭಿಸುತ್ತದೆ।",
          "ಧರ್ಮ ಶಾಸ್ತ್ರಗಳ ಪ್ರಕಾರ {topic} ಆಧ್ಯಾತ್ಮಿಕ ಜೀವನಕ್ಕೆ ಅಡಿಪಾಯ।"
        ],
        process: [
          "{topic} ಅಭ್ಯಾಸ ಮಾಡುವ ವಿಧಾನ ಶಾಸ್ತ್ರಗಳಲ್ಲಿ ವಿಸ್ತಾರವಾಗಿ ಹೇಳಲಾಗಿದೆ।",
          "ಗುರು ಸಂಪ್ರದಾಯದ ಪ್ರಕಾರ {topic} ಅನ್ನು ಈ ರೀತಿ ಅನುಸರಿಸಬೇಕು।"
        ],
        explanation: [
          "{topic} ಹಿಂದಿರುವ ಆಳವಾದ ತತ್ವ ಎಲ್ಲವೂ ಪರಸ್ಪರ ಸಂಬಂಧಿತವಾಗಿದೆ.",
          "{topic} ಕೇವಲ ಸಿದ್ಧಾಂತವಲ್ಲ, ಬದುಕುವ ವಿಧಾನ।"
        ],
        calendar: [
          "ಇಂದಿನ {topic} ತಿಳಿಯಲು ಪಂಚಾಂಗ ನೋಡಬೇಕು।",
          "{topic} ಚಂದ್ರ ಗಣನೆಯ ಆಧಾರದ ಮೇಲೆ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ।"
        ]
      },
      english: {
        definition: [
          "Understanding {topic} reveals it as a fundamental principle of spiritual life.",
          "Vedic philosophy provides clear explanations of {topic} that guide our existence.",
          "Grasping the core elements of {topic} is the first step toward self-realization."
        ],
        process: [
          "The methodology for practicing {topic} is detailed extensively in the scriptures.",
          "According to the guru tradition, {topic} should be adopted in this manner.",
          "In the practice of {topic}, patience and consistency are most important."
        ],
        explanation: [
          "The profound philosophy behind {topic} is that everything is interconnected.",
          "Our sages have explained life's truth through {topic}.",
          "{topic} is not merely a principle but a way of living."
        ],
        calendar: [
          "To know today's {topic}, one needs to consult the Panchang (Hindu calendar). The accurate calculation requires location and time information.",
          "{topic} is an important aspect of the Hindu lunar calendar system and holds special significance in daily spiritual practices.",
          "According to Vedic astrology, knowledge of {topic} is essential for determining auspicious timings for various activities."
        ],
        general: [
          "The scriptures contain profound knowledge about {topic}.",
          "{topic} holds an important place in the Vedic tradition."
        ]
      }
    };
  }

  static getInstance(): IndicNLPEngine {
    if (!IndicNLPEngine.instance) {
      IndicNLPEngine.instance = new IndicNLPEngine();
    }
    return IndicNLPEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("Initializing advanced Indic NLP with multilingual BERT...");
      
      // Try to load multilingual BERT model for better understanding
      this.bertModel = await pipeline(
        'feature-extraction',
        'Xenova/multilingual-e5-small',
        { device: 'webgpu' }
      );
      
      console.log("Multilingual BERT model loaded successfully");
    } catch (error) {
      console.warn("Failed to load BERT model, using enhanced template system:", error);
    }

    // Simulate initialization time for UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isInitialized = true;
    console.log("Advanced Indic NLP engine initialized with contextual understanding");
  }

  async generateResponse(message: string, config: IndicNLPConfig): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log("=== INDIC NLP PROCESSING ===");
      console.log("Input message:", message);
      console.log("Language:", config.language);
      
      const { documentProcessor } = await import('./documentProcessor');
      
      // First check if we have any documents uploaded
      const documentStats = documentProcessor.getDocumentStats();
      console.log("Document stats:", documentStats);
      
      if (documentStats.totalChunks > 0) {
        console.log("Documents available, searching for relevant content...");
        const documentContext = documentProcessor.findRelevantContext(message, config.language, 3);
        console.log("Found document context:", documentContext.length, "chunks");
        
        if (documentContext.length > 0) {
          // Try to find a direct answer in the documents
          const directAnswer = this.findBestAnswer(message, documentContext, config.language);
          if (directAnswer && directAnswer.length > 15) {
            console.log("Found direct answer:", directAnswer.substring(0, 100));
            return directAnswer;
          }
        }
      }
      
      // If no documents or no relevant context, analyze message for template response
      console.log("No relevant documents found, using template response");
      const analysis = await this.analyzeMessage(message, config.language);
      const primaryTopic = analysis.topics[0] || this.extractMainTopic(message);
      
      return this.getContextualTemplate(analysis, config.language, primaryTopic);
      
    } catch (error) {
      console.error("Error generating response with Indic NLP:", error);
      return this.getFallbackResponse(config.language);
    }
  }

  private async analyzeMessage(message: string, language: string): Promise<MessageAnalysis> {
    console.log("Analyzing message:", message);
    
    // Enhanced message analysis using NLP techniques
    const questionType = this.classifyQuestionType(message);
    const entities = this.extractEntities(message);
    const intent = this.classifyIntent(message);
    const topics = this.extractAllTopics(message);
    const sentiment = this.analyzeSentiment(message);
    
    console.log("Analysis result:", { questionType, entities, intent, topics, sentiment });
    
    return {
      intent,
      entities,
      sentiment,
      topics,
      questionType
    };
  }


  // Built-in contextual analysis methods
  private classifyQuestionType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("what") || lowerMessage.includes("क्या") || lowerMessage.includes("ఏమిటి") || lowerMessage.includes("ಏನು")) {
      return "definition";
    } else if (lowerMessage.includes("how") || lowerMessage.includes("कैसे") || lowerMessage.includes("ఎలా") || lowerMessage.includes("ಹೇಗೆ")) {
      return "process";
    } else if (lowerMessage.includes("why") || lowerMessage.includes("क्यों") || lowerMessage.includes("ఎందుకు") || lowerMessage.includes("ಯಾಕೆ")) {
      return "explanation";
    } else if (lowerMessage.includes("when") || lowerMessage.includes("कब") || lowerMessage.includes("ఎప్పుడు") || lowerMessage.includes("ಯಾವಾಗ")) {
      return "timing";
    } else if (lowerMessage.includes("where") || lowerMessage.includes("कहाँ") || lowerMessage.includes("ఎక్కడ") || lowerMessage.includes("ಎಲ್ಲಿ")) {
      return "location";
    }
    return "general";
  }

  private extractEntities(message: string): string[] {
    const entities: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Hindu deities, scriptures, concepts
    const allEntities = [
      "dharma", "karma", "yoga", "meditation", "puja", "mantra", "vedas", "upanishads",
      "धर्म", "कर्म", "योग", "ध्यान", "पूजा", "मंत्र", "वेद", "उपनिषद्",
      "krishna", "rama", "shiva", "vishnu", "कृष्ण", "राम", "शिव", "विष्णु"
    ];
    
    for (const entity of allEntities) {
      if (lowerMessage.includes(entity.toLowerCase())) {
        entities.push(entity);
      }
    }
    
    return entities;
  }

  private classifyIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("tell me") || lowerMessage.includes("explain") || lowerMessage.includes("बताइए")) {
      return "information_seeking";
    } else if (lowerMessage.includes("help") || lowerMessage.includes("guide") || lowerMessage.includes("मदद")) {
      return "guidance_seeking";
    } else if (lowerMessage.includes("ritual") || lowerMessage.includes("पूजा")) {
      return "ritual_inquiry";
    } else if (lowerMessage.includes("scripture") || lowerMessage.includes("शास्त्र")) {
      return "scriptural_inquiry";
    } else if (lowerMessage.includes("today") || lowerMessage.includes("आज") || lowerMessage.includes("tithi") || lowerMessage.includes("panchang") || lowerMessage.includes("nakshatra")) {
      return "calendar_inquiry";
    }
    return "general_inquiry";
  }

  private extractAllTopics(message: string): string[] {
    const topics: string[] = [];
    const topicPatterns = [
      // Core dharmic concepts
      { pattern: /dharma|धर्म|ధర్మం|ಧರ್ಮ/gi, topic: "dharma" },
      { pattern: /karma|कर्म|కర్మ|ಕರ್ಮ/gi, topic: "karma" },
      { pattern: /yoga|योग|యోగ|ಯೋಗ/gi, topic: "yoga" },
      { pattern: /meditation|ध्यान|dhyana/gi, topic: "meditation" },
      { pattern: /puja|पूजा|పూజ|ಪೂಜೆ|worship/gi, topic: "puja" },
      { pattern: /mantra|मंत्र/gi, topic: "mantra" },
      { pattern: /vedas?|वेद/gi, topic: "vedas" },
      { pattern: /upanishads?|उपनिषद्/gi, topic: "upanishads" },
      
      // Hindu calendar and astronomy
      { pattern: /tithi|तिथि|తిథి|ತಿಥಿ/gi, topic: "tithi" },
      { pattern: /nakshatra|नक्षत्र|నక్షత్రం|ನಕ್ಷತ್ರ/gi, topic: "nakshatra" },
      { pattern: /panchang|पंचांग|పంచాంగం|ಪಂಚಾಂಗ/gi, topic: "panchang" },
      { pattern: /rashifal|राशिफल|రాశిఫలం|ರಾಶಿಫಲ/gi, topic: "rashifal" },
      { pattern: /graha|ग्रह|గ్రహ|ಗ್ರಹ|planet/gi, topic: "graha" },
      { pattern: /muhurat|मुहूर्त|ముహూర్తం|ಮುಹೂರ್ತ/gi, topic: "muhurat" },
      { pattern: /ekadashi|एकादशी|ఏకాదశి|ಏಕಾದಶಿ/gi, topic: "ekadashi" },
      { pattern: /amavasya|अमावस्या|అమావస్య|ಅಮಾವಸ್ಯೆ/gi, topic: "amavasya" },
      { pattern: /purnima|पूर्णिमा|పూర్ణిమ|ಪೂರ್ಣಿಮೆ/gi, topic: "purnima" },
      
      // Festivals and occasions
      { pattern: /diwali|दिवाली|దీవాలి|ದೀಪಾವಳಿ/gi, topic: "diwali" },
      { pattern: /holi|होली|హోళి|ಹೋಳಿ/gi, topic: "holi" },
      { pattern: /navratri|नवरात्रि|నవరాత్రి|ನವರಾತ್ರಿ/gi, topic: "navratri" },
      
      // Deities
      { pattern: /krishna|कृष्ण|కృష్ణ|ಕೃಷ್ಣ/gi, topic: "krishna" },
      { pattern: /rama|राम|రామ|ರಾಮ/gi, topic: "rama" },
      { pattern: /shiva|शिव|శివ|ಶಿವ/gi, topic: "shiva" },
      { pattern: /vishnu|विष्णु|విష్ణు|ವಿಷ್ಣು/gi, topic: "vishnu" },
      { pattern: /ganesh|गणेश|గణేశ|ಗಣೇಶ/gi, topic: "ganesh" },
      { pattern: /hanuman|हनुमान|హనుమాన్|ಹನುಮಾನ್/gi, topic: "hanuman" }
    ];
    
    for (const { pattern, topic } of topicPatterns) {
      if (pattern.test(message) && !topics.includes(topic)) {
        topics.push(topic);
      }
    }
    
    if (topics.length === 0) {
      const words = message.split(/\s+/).filter(word => word.length > 3);
      topics.push(words[0] || "dharma");
    }
    
    return topics;
  }

  private analyzeSentiment(message: string): string {
    const lowerMessage = message.toLowerCase();
    const questionWords = ["what", "how", "why", "क्या", "कैसे", "क्यों"];
    
    if (questionWords.some(word => lowerMessage.includes(word))) {
      return "inquisitive";
    }
    return "neutral";
  }

  private getContextualTemplate(analysis: MessageAnalysis, language: string, topic: string): string {
    console.log(`Getting template for language: ${language}, questionType: ${analysis.questionType}, topic: ${topic}, intent: ${analysis.intent}`);
    
    const langTemplates = this.contextualTemplates[language];
    if (!langTemplates) {
      console.log("Language not found, using English");
      const englishTemplates = this.getTemplatesByIntent(this.contextualTemplates.english, analysis);
      const selectedTemplate = englishTemplates[0].replace("{topic}", topic);
      console.log("Selected English template:", selectedTemplate);
      return selectedTemplate;
    }
    
    const questionTemplates = this.getTemplatesByIntent(langTemplates, analysis);
    if (!questionTemplates) {
      console.log("No templates found for question type, using fallback");
      return `${topic} के बारे में विस्तार से जानकारी उपलब्ध है।`;
    }
    
    const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
    const finalResponse = template.replace("{topic}", topic);
    console.log("Final contextual response:", finalResponse);
    return finalResponse;
  }

  private getTemplatesByIntent(langTemplates: Record<string, string[]>, analysis: MessageAnalysis): string[] {
    console.log("Getting templates by intent:", analysis.intent, "Available template keys:", Object.keys(langTemplates));
    
    // Check for calendar-specific queries first (highest priority)
    if (analysis.intent === "calendar_inquiry" && langTemplates.calendar) {
      console.log("Using calendar templates");
      return langTemplates.calendar;
    }
    
    // Then check question type
    if (langTemplates[analysis.questionType]) {
      console.log("Using question type templates:", analysis.questionType);
      return langTemplates[analysis.questionType];
    }
    
    // Fallback hierarchy
    if (langTemplates.definition) {
      console.log("Using definition templates as fallback");
      return langTemplates.definition;
    }
    
    if (langTemplates.general) {
      console.log("Using general templates as fallback");
      return langTemplates.general;
    }
    
    console.log("No templates found, returning empty array");
    return [];
  }

  private getEntityContext(entities: string[], language: string): string {
    if (entities.length === 0) return "";
    
    const contexts: Record<string, string> = {
      hindi: ` विशेष रूप से ${entities.join(", ")} के संदर्भ में यह और भी महत्वपूर्ण हो जाता है।`,
      english: ` Particularly in the context of ${entities.join(", ")}, this becomes even more significant.`
    };
    return contexts[language] || contexts.english;
  }

  // Simplified direct answer extraction
  private findBestAnswer(question: string, documentContext: string[], language: string): string | null {
    console.log("Looking for best answer in", documentContext.length, "chunks");
    
    const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = '';
    let bestScore = 0;
    
    for (const context of documentContext) {
      // Check for key-value pairs first (JSON data)
      if (context.includes(':')) {
        const lines = context.split('\n');
        for (const line of lines) {
          if (line.includes(':')) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value && value.length > 5) {
              const keyScore = questionWords.filter(word => 
                key.toLowerCase().includes(word) || word.includes(key.toLowerCase().substring(0, Math.max(3, key.length - 2)))
              ).length;
              
              if (keyScore > bestScore) {
                bestScore = keyScore;
                bestMatch = value.replace(/["\[\]{}]/g, '').trim();
                console.log("New best match from key-value:", key, "->", bestMatch);
              }
            }
          }
        }
      }
      
      // Check for sentence matches
      const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 10);
      for (const sentence of sentences) {
        const sentenceScore = questionWords.filter(word => 
          sentence.toLowerCase().includes(word)
        ).length;
        
        if (sentenceScore > bestScore && sentence.trim().length > 20) {
          bestScore = sentenceScore;
          bestMatch = sentence.trim();
          console.log("New best match from sentence:", bestMatch.substring(0, 50));
        }
      }
    }
    
    return bestMatch.length > 15 ? bestMatch : null;
  }


  private extractMainTopic(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced topic extraction
    const topicKeywords = {
      meditation: ['meditation', 'dhyana', 'ध्यान', 'ध्यान', 'meditate'],
      prayer: ['prayer', 'pray', 'प्रार्थना', 'पूजा', 'worship'],
      scripture: ['scripture', 'veda', 'वेद', 'shastra', 'शास्त्र', 'gita'],
      festival: ['festival', 'celebration', 'त्योहार', 'उत्सव'],
      ritual: ['ritual', 'ceremony', 'संस्कार', 'कर्म'],
      philosophy: ['philosophy', 'darshan', 'दर्शन', 'truth', 'सत्य']
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return topic;
      }
    }
    
    // Extract any capitalized words or nouns
    const words = message.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && (word[0] === word[0].toUpperCase() || word.length > 6)) {
        return word.toLowerCase();
      }
    }
    
    return "dharma";
  }

  private getFallbackResponse(language: string): string {
    const fallbacks: Record<string, string> = {
      hindi: "क्षमा करें, मैं वर्तमान में आपके प्रश्न का उत्तर नहीं दे सकता। कृपया अपना प्रश्न दोबारा पूछें।",
      english: "I apologize, but I'm currently unable to answer your question. Please try rephrasing your question."
    };
    
    return fallbacks[language] || fallbacks.english;
  }
}

export const indicNLP = IndicNLPEngine.getInstance();