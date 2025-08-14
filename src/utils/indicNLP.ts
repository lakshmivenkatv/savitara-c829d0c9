import { pipeline } from "@huggingface/transformers";

interface IndicNLPConfig {
  language: string;
  context?: string;
}

class IndicNLPEngine {
  private static instance: IndicNLPEngine;
  private textGenerationPipeline: any = null;
  private isInitialized = false;

  static getInstance(): IndicNLPEngine {
    if (!IndicNLPEngine.instance) {
      IndicNLPEngine.instance = new IndicNLPEngine();
    }
    return IndicNLPEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("Initializing Indic NLP engine...");
      
      // Use a lightweight text generation model
      this.textGenerationPipeline = await pipeline(
        "text-generation",
        "Xenova/gpt2",
        {
          device: "webgpu",
          dtype: "fp16"
        }
      );
      
      this.isInitialized = true;
      console.log("Indic NLP engine initialized successfully");
    } catch (error) {
      console.warn("WebGPU not available, falling back to CPU");
      try {
        this.textGenerationPipeline = await pipeline(
          "text-generation",
          "Xenova/gpt2"
        );
        this.isInitialized = true;
        console.log("Indic NLP engine initialized on CPU");
      } catch (cpuError) {
        console.error("Failed to initialize Indic NLP engine:", cpuError);
        throw new Error("Failed to initialize Indic NLP engine");
      }
    }
  }

  private getSystemPrompt(language: string): string {
    const prompts: Record<string, string> = {
      hindi: "आप एक हिंदू धर्म विशेषज्ञ हैं। वैदिक परंपराओं, अनुष्ठानों, संप्रदायों और पवित्र ज्ञान के बारे में विस्तृत और सटीक जानकारी प्रदान करें।",
      sanskrit: "त्वं हिन्दुधर्मविशेषज्ञः असि। वैदिकपरम्पराणाम्, यज्ञानुष्ठानानाम्, सम्प्रदायानाम्, पवित्रज्ञानस्य च विषये विस्तृतं यथार्थं ज्ञानं प्रदेहि।",
      telugu: "మీరు హిందూ ధర్మ నిపుణులు. వైదిక సంప్రదాయాలు, కర్మకాండలు, సంప్రదాయాలు మరియు పవిత్ర జ్ఞానం గురించి వివరణాత్మక మరియు ఖచ్చితమైన సమాచారం అందించండి।",
      kannada: "ನೀವು ಹಿಂದೂ ಧರ್ಮ ತಜ್ಞರು. ವೈದಿಕ ಸಂಪ್ರದಾಯಗಳು, ಆಚರಣೆಗಳು, ಸಂಪ್ರದಾಯಗಳು ಮತ್ತು ಪವಿತ್ರ ಜ್ಞಾನದ ಬಗ್ಗೆ ವಿಸ್ತೃತ ಮತ್ತು ನಿಖರವಾದ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಿ।",
      english: "You are a Hindu Dharma expert. Provide detailed and accurate information about Vedic traditions, rituals, sampradayas, and sacred wisdom."
    };
    
    return prompts[language] || prompts.english;
  }

  async generateResponse(message: string, config: IndicNLPConfig): Promise<string> {
    if (!this.isInitialized || !this.textGenerationPipeline) {
      await this.initialize();
    }

    try {
      const systemPrompt = this.getSystemPrompt(config.language);
      const contextualPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

      const result = await this.textGenerationPipeline!(contextualPrompt, {
        max_new_tokens: 150,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1
      });

      // Extract the response from the generated text
      const generatedText = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
      
      if (typeof generatedText === 'string') {
        // Remove the input prompt from the response
        const response = generatedText.replace(contextualPrompt, '').trim();
        return response || "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.";
      }
      
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error generating response with Indic NLP:", error);
      return this.getFallbackResponse(config.language);
    }
  }

  private getFallbackResponse(language: string): string {
    const fallbacks: Record<string, string> = {
      hindi: "क्षमा करें, मैं वर्तमान में आपके प्रश्न का उत्तर नहीं दे सकता। कृपया अपना प्रश्न दोबारा पूछें।",
      sanskrit: "क्षम्यताम्, अहं सम्प्रति भवतः प्रश्नस्य उत्तरं दातुं न शक्नोमि। कृपया पुनः पृच्छतु।",
      telugu: "క్షమించండి, నేను ప్రస్తుతం మీ ప్రశ్నకు సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి మీ ప్రశ్నను మళ్లీ అడగండి।",
      kannada: "ಕ್ಷಮಿಸಿ, ನಾನು ಪ್ರಸ್ತುತ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಮತ್ತೊಮ್ಮೆ ಕೇಳಿ।",
      english: "I apologize, but I'm currently unable to answer your question. Please try rephrasing your question."
    };
    
    return fallbacks[language] || fallbacks.english;
  }
}

export const indicNLP = IndicNLPEngine.getInstance();