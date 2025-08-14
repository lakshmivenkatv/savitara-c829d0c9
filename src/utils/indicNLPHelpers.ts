interface MessageAnalysis {
  intent: string;
  entities: string[];
  sentiment: string;
  topics: string[];
  questionType: string;
}

export const classifyQuestionType = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('what') || lowerMessage.includes('क्या') || lowerMessage.includes('ఏమిటి') || lowerMessage.includes('ಏನು')) {
    return 'definition';
  } else if (lowerMessage.includes('how') || lowerMessage.includes('कैसे') || lowerMessage.includes('ఎలా') || lowerMessage.includes('ಹೇಗೆ')) {
    return 'process';
  } else if (lowerMessage.includes('why') || lowerMessage.includes('क्यों') || lowerMessage.includes('ఎందుకు') || lowerMessage.includes('ಯಾಕೆ')) {
    return 'explanation';
  } else if (lowerMessage.includes('when') || lowerMessage.includes('कब') || lowerMessage.includes('ఎప్పుడు') || lowerMessage.includes('ಯಾವಾಗ')) {
    return 'timing';
  } else if (lowerMessage.includes('where') || lowerMessage.includes('कहाँ') || lowerMessage.includes('ఎక్కడ') || lowerMessage.includes('ಎಲ್ಲಿ')) {
    return 'location';
  }
  return 'general';
};

export const extractEntities = (message: string): string[] => {
  const entities: string[] = [];
  
  // Hindu deities
  const deities = ['krishna', 'rama', 'shiva', 'vishnu', 'durga', 'ganesh', 'hanuman', 'lakshmi', 'saraswati',
                   'कृष्ण', 'राम', 'शिव', 'विष्णु', 'दुर्गा', 'गणेश', 'हनुमान', 'लक्ष्मी', 'सरस्वती'];
  
  // Scriptures
  const scriptures = ['vedas', 'upanishads', 'gita', 'ramayana', 'mahabharata', 'puranas',
                     'वेद', 'उपनिषद्', 'गीता', 'रामायण', 'महाभारत', 'पुराण'];
  
  // Concepts
  const concepts = ['dharma', 'karma', 'moksha', 'yoga', 'meditation', 'puja', 'mantra',
                   'धर्म', 'कर्म', 'मोक्ष', 'योग', 'ध्यान', 'पूजा', 'मंत्र'];
  
  const allEntities = [...deities, ...scriptures, ...concepts];
  const lowerMessage = message.toLowerCase();
  
  for (const entity of allEntities) {
    if (lowerMessage.includes(entity.toLowerCase())) {
      entities.push(entity);
    }
  }
  
  return entities;
};

export const classifyIntent = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('tell me') || lowerMessage.includes('explain') || lowerMessage.includes('बताइए') || lowerMessage.includes('వివరించండి')) {
    return 'information_seeking';
  } else if (lowerMessage.includes('help') || lowerMessage.includes('guide') || lowerMessage.includes('मदद') || lowerMessage.includes('సహాయం')) {
    return 'guidance_seeking';
  } else if (lowerMessage.includes('ritual') || lowerMessage.includes('ceremony') || lowerMessage.includes('पूजा') || lowerMessage.includes('పూజ')) {
    return 'ritual_inquiry';
  } else if (lowerMessage.includes('scripture') || lowerMessage.includes('text') || lowerMessage.includes('शास्त्र') || lowerMessage.includes('శాస్త్రం')) {
    return 'scriptural_inquiry';
  }
  return 'general_inquiry';
};

export const extractAllTopics = (message: string): string[] => {
  const topics: string[] = [];
  
  // Enhanced topic extraction using word combinations and context
  const topicPatterns = [
    // English patterns
    { pattern: /dharma/gi, topic: 'dharma' },
    { pattern: /karma/gi, topic: 'karma' },
    { pattern: /yoga/gi, topic: 'yoga' },
    { pattern: /meditation/gi, topic: 'meditation' },
    { pattern: /puja|worship/gi, topic: 'puja' },
    { pattern: /mantra/gi, topic: 'mantra' },
    { pattern: /vedas?/gi, topic: 'vedas' },
    { pattern: /upanishads?/gi, topic: 'upanishads' },
    { pattern: /gita/gi, topic: 'bhagavad_gita' },
    { pattern: /ramayana/gi, topic: 'ramayana' },
    { pattern: /mahabharata/gi, topic: 'mahabharata' },
    
    // Hindi patterns
    { pattern: /धर्म/gi, topic: 'dharma' },
    { pattern: /कर्म/gi, topic: 'karma' },
    { pattern: /योग/gi, topic: 'yoga' },
    { pattern: /ध्यान/gi, topic: 'meditation' },
    { pattern: /पूजा/gi, topic: 'puja' },
    { pattern: /मंत्र/gi, topic: 'mantra' },
    { pattern: /वेद/gi, topic: 'vedas' },
    { pattern: /उपनिषद्/gi, topic: 'upanishads' },
    
    // Telugu patterns
    { pattern: /ధర్మం/gi, topic: 'dharma' },
    { pattern: /కర్మ/gi, topic: 'karma' },
    { pattern: /యోగ/gi, topic: 'yoga' },
    { pattern: /పూజ/gi, topic: 'puja' },
    
    // Kannada patterns
    { pattern: /ಧರ್ಮ/gi, topic: 'dharma' },
    { pattern: /ಕರ್ಮ/gi, topic: 'karma' },
    { pattern: /ಯೋಗ/gi, topic: 'yoga' },
    { pattern: /ಪೂಜೆ/gi, topic: 'puja' }
  ];
  
  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(message)) {
      if (!topics.includes(topic)) {
        topics.push(topic);
      }
    }
  }
  
  // If no specific topics found, try to extract meaningful words
  if (topics.length === 0) {
    const words = message.split(/\s+/).filter(word => word.length > 3);
    if (words.length > 0) {
      topics.push(words[0]);
    } else {
      topics.push('dharma');
    }
  }
  
  return topics;
};

export const analyzeSentiment = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Simple sentiment analysis
  const positiveWords = ['good', 'great', 'wonderful', 'excellent', 'अच्छा', 'बेहतरीन', 'అద్భుతం', 'ಅದ್ಭುತ'];
  const negativeWords = ['bad', 'terrible', 'wrong', 'बुरा', 'गलत', 'చెడు', 'ತಪ್ಪು'];
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'क्या', 'कैसे', 'क्यों', 'ఏమిటి', 'ಏನು'];
  
  if (questionWords.some(word => lowerMessage.includes(word))) {
    return 'inquisitive';
  } else if (positiveWords.some(word => lowerMessage.includes(word))) {
    return 'positive';
  } else if (negativeWords.some(word => lowerMessage.includes(word))) {
    return 'negative';
  }
  
  return 'neutral';
};

export const getTemplatesForContext = (analysis: MessageAnalysis, language: string): string[] => {
  // Return specialized templates based on analysis
  if (analysis.intent === 'ritual_inquiry') {
    return getRitualTemplates(language);
  } else if (analysis.intent === 'scriptural_inquiry') {
    return getScripturalTemplates(language);
  } else if (analysis.questionType === 'explanation') {
    return getExplanationTemplates(language);
  }
  
  // Default templates
  const defaultTemplates: Record<string, string[]> = {
    hindi: [
      "हिंदू धर्म में इस विषय पर विचार करते हुए, मैं कह सकता हूं कि {topic} का महत्व वेदों और पुराणों में स्पष्ट रूप से वर्णित है।",
      "आपके प्रश्न के संबंध में, {topic} के बारे में शास्त्रों में उल्लेख है कि यह आध्यात्मिक विकास के लिए आवश्यक है।",
      "धर्म शास्त्रों के अनुसार, {topic} का अभ्यास करने से मन की शुद्धता और आत्मिक उन्नति होती है।"
    ],
    english: [
      "In Hindu Dharma, regarding {topic}, the Vedas and Puranas clearly describe its significance for spiritual development.",
      "Concerning your question about {topic}, the scriptures mention that it is essential for spiritual growth and mental purification.",
      "According to dharmic texts, practicing {topic} leads to the purification of mind and spiritual advancement."
    ]
  };
  
  return defaultTemplates[language] || defaultTemplates.english;
};

const getRitualTemplates = (language: string): string[] => {
  const templates: Record<string, string[]> = {
    hindi: [
      "{topic} के संबंध में वैदिक परंपरा में विस्तृत मार्गदर्शन है। इस अनुष्ठान का गहरा आध्यात्मिक महत्व है।",
      "शास्त्रों के अनुसार {topic} का अभ्यास करते समय शुद्ध मन और निष्ठा आवश्यक है।"
    ],
    english: [
      "Regarding {topic}, the Vedic tradition provides comprehensive guidance. This practice has deep spiritual significance.",
      "According to the scriptures, practicing {topic} requires a pure mind and sincere devotion."
    ]
  };
  return templates[language] || templates.english;
};

const getScripturalTemplates = (language: string): string[] => {
  const templates: Record<string, string[]> = {
    hindi: [
      "{topic} के बारे में हमारे पवित्र ग्रंथों में अमूल्य ज्ञान संग्रहीत है। यह ज्ञान जीवन के हर पहलू को प्रकाशित करता है।",
      "वैदिक साहित्य में {topic} का विस्तृत विवरण मिलता है जो आध्यात्मिक विकास में सहायक है।"
    ],
    english: [
      "Our sacred texts contain invaluable wisdom about {topic}. This knowledge illuminates every aspect of life.",
      "Vedic literature provides detailed descriptions of {topic} that aid in spiritual development."
    ]
  };
  return templates[language] || templates.english;
};

const getExplanationTemplates = (language: string): string[] => {
  const templates: Record<string, string[]> = {
    hindi: [
      "{topic} को समझने के लिए हमें इसकी गहराई में जाना होगा। यह केवल एक सिद्धांत नहीं बल्कि जीवन जीने का तरीका है।",
      "यदि हम {topic} के मूल सिद्धांतों को देखें तो पाएंगे कि यह हमारे अस्तित्व से गहरा संबंध रखता है।"
    ],
    english: [
      "To understand {topic}, we must delve into its depths. It's not merely a principle but a way of living.",
      "If we examine the fundamental principles of {topic}, we find it has a deep connection with our existence."
    ]
  };
  return templates[language] || templates.english;
};