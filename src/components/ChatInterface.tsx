import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Cpu, Cloud } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { EngineSelector } from './EngineSelector';
import { DocumentUpload } from './DocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { indicNLP } from '@/utils/indicNLP';
import { documentProcessor } from '@/utils/documentProcessor';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  engine?: string;
  onEngineChange?: (engine: string) => void;
  onDocumentsProcessed?: () => void;
  documentsProcessedCount?: number;
}

export const ChatInterface = ({ 
  engine: externalEngine, 
  onEngineChange, 
  onDocumentsProcessed,
  documentsProcessedCount 
}: ChatInterfaceProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [engine, setEngine] = useState(externalEngine || 'azure');
  const [isInitializingIndic, setIsInitializingIndic] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Sync external engine state
  React.useEffect(() => {
    if (externalEngine && externalEngine !== engine) {
      setEngine(externalEngine);
    }
  }, [externalEngine, engine]);

  // Handle engine changes
  const handleEngineChange = (newEngine: string) => {
    setEngine(newEngine);
    if (onEngineChange) {
      onEngineChange(newEngine);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Indic NLP when engine switches to indic
  useEffect(() => {
    if (engine === 'indic' && !isInitializingIndic) {
      setIsInitializingIndic(true);
      toast({
        title: "Loading Advanced AI Engine",
        description: "Initializing multilingual BERT model for better contextual understanding...",
      });
      
      indicNLP.initialize()
        .then(() => {
          toast({
            title: "Advanced Indic NLP Ready",
            description: "Enhanced contextual AI engine with document learning is now active",
          });
        })
        .catch((error) => {
          console.error('Failed to initialize Indic NLP:', error);
          toast({
            title: "Engine Loading Issue",
            description: "Using enhanced template system with document context as fallback",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsInitializingIndic(false);
        });
    }
  }, [engine, toast, isInitializingIndic]);

  // Handle document processing updates
  const handleDocumentsProcessed = useCallback(async () => {
    // The document processor will automatically reload from database when needed
    console.log('Documents updated, clearing local cache');
    documentProcessor.clearDocuments();
    if (onDocumentsProcessed) {
      onDocumentsProcessed();
    }
  }, [onDocumentsProcessed]);

  // Function to validate if question is related to Hindu Dharma
  const isHinduDharmaRelated = (question: string): boolean => {
    const hinduDharmaKeywords = [
      // Core concepts
      'dharma', 'vedic', 'veda', 'vedas', 'hindu', 'hinduism', 'sanatan', 'sanatana',
      'sampradaya', 'tradition', 'ritual', 'ceremony', 'puja', 'yajna', 'yagna',
      'mantra', 'shloka', 'sanskrit', 'yoga', 'meditation', 'dhyana',
      
      // Scriptures and texts
      'ramayana', 'mahabharata', 'bhagavad', 'gita', 'purana', 'puranas',
      'upanishad', 'upanishads', 'smriti', 'shruti', 'agama', 'tantra',
      
      // Deities and divine
      'krishna', 'rama', 'shiva', 'vishnu', 'brahma', 'devi', 'ganesha',
      'hanuman', 'lakshmi', 'saraswati', 'durga', 'kali', 'parvati',
      'indra', 'surya', 'bhagavan', 'bhagwan', 'ishwar', 'paramatma',
      
      // Festivals and observances
      'diwali', 'holi', 'navratri', 'dussehra', 'janmashtami', 'shivaratri',
      'karva', 'chauth', 'ekadashi', 'amavasya', 'purnima', 'vrat', 'vratam',
      'chaturmasya', 'caturmasya',
      
      // Philosophical concepts
      'karma', 'moksha', 'samsara', 'atman', 'brahman', 'ahimsa',
      'dharana', 'samadhi', 'pranayama', 'asana', 'chakra',
      
      // Practices and customs
      'ashram', 'guru', 'disciple', 'satsang', 'bhajan', 'kirtan',
      'pilgrimage', 'tirtha', 'yatra', 'kumbh', 'ganga', 'ganges',
      'ayurveda', 'jyotish', 'astrology', 'vastu',
      
      // Life stages and social
      'grihastha', 'brahmachari', 'vanaprastha', 'sannyasa',
      'varna', 'ashrama', 'samskar', 'sanskar',
      
      // Languages and cultural
      'tamil', 'telugu', 'kannada', 'malayalam', 'bengali', 'gujarati',
      'marathi', 'punjabi', 'oriya', 'assamese', 'hindi'
    ];

    const questionLower = question.toLowerCase();
    
    // Check if question contains any Hindu Dharma related keywords
    const hasKeywords = hinduDharmaKeywords.some(keyword => 
      questionLower.includes(keyword)
    );
    
    // Additional pattern matching for Indian cultural context
    const culturalPatterns = [
      /\b(indian|bharat|hindustan)\s+(culture|tradition|custom|ritual)/i,
      /\b(spiritual|religious)\s+(practice|tradition|custom)/i,
      /\b(ancient|traditional)\s+(indian|hindu|vedic)/i,
      /\b(temple|mandir|shrine)/i,
      /\b(priest|pandit|acharya|swami|maharaj)/i,
      /\b(blessing|bless|grace|divine)/i
    ];
    
    const hasPatterns = culturalPatterns.some(pattern => pattern.test(question));
    
    return hasKeywords || hasPatterns;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Validate if question is related to Hindu Dharma
      if (!isHinduDharmaRelated(currentInput)) {
        const offTopicResponse = `🙏 Namaste! I'm specifically designed to help with questions about Hindu Dharma, Vedic traditions, rituals, sampradayas, and related spiritual wisdom.

Your question seems to be outside this scope. I'd be happy to help you with:
• Vedic scriptures and their teachings
• Hindu festivals and their significance  
• Spiritual practices and rituals
• Sampradayas and traditions
• Dharmic philosophy and concepts
• Sanskrit texts and mantras

Please feel free to ask anything related to Hindu Dharma, and I'll do my best to provide helpful guidance! 🕉️`;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: offTopicResponse,
          role: 'assistant',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      let assistantContent: string;

      if (engine === 'indic') {
        // Use Indic NLP engine
        assistantContent = await indicNLP.generateResponse(currentInput, {
          language,
          context: messages.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')
        });
      } else {
        // Use Azure OpenAI
        const { data, error } = await supabase.functions.invoke('azure-chat', {
          body: {
            messages: [{ role: 'user', content: currentInput }],
            language
          }
        });

        if (error) throw error;
        assistantContent = data.message;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message using ${engine === 'indic' ? 'Indic NLP' : 'Azure OpenAI'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={`w-full ${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'} flex flex-col`}>
      <CardHeader className={`flex flex-col ${isMobile ? 'space-y-2 pb-2' : 'space-y-4 pb-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row'} items-center ${isMobile ? '' : 'justify-between'}`}>
          <CardTitle className={`${isMobile ? 'text-lg text-center' : 'text-2xl'} font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent`}>
            Hindu Dharma AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {engine === 'azure' ? <Cloud className="w-5 h-5 text-blue-500" /> : <Cpu className="w-5 h-5 text-green-500" />}
            <span className="text-sm text-muted-foreground">
              {engine === 'azure' ? 'Azure OpenAI' : 'Indic NLP'}
            </span>
          </div>
        </div>
        
        {isMobile && (
          <>
            <div className="flex flex-row items-center justify-center">
              <EngineSelector value={engine} onValueChange={handleEngineChange} />
            </div>
            <DocumentUpload onDocumentsProcessed={handleDocumentsProcessed} />
          </>
        )}
        
        {isInitializingIndic && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <div className="flex flex-col">
              <span className="font-medium">Initializing Advanced Indic NLP Engine...</span>
              <span className="text-xs text-orange-600">This may take 20-30 seconds to load the multilingual BERT model</span>
            </div>
          </div>
        )}
        {engine === 'indic' && !isInitializingIndic && documentsProcessedCount && documentsProcessedCount > 0 && (
          <div className="text-sm text-green-600 flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            📚 Knowledge enhanced with uploaded documents
          </div>
        )}
      </CardHeader>
      <CardContent className={`flex-1 flex flex-col ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
        <ScrollArea className={`flex-1 ${isMobile ? 'pr-2' : 'pr-4'} w-full overflow-hidden`} ref={scrollAreaRef}>
          <div className="space-y-4 w-full max-w-full">
            {messages.length === 0 && (
              <div className={`text-center ${isMobile ? 'py-4 px-2' : 'py-8'} text-muted-foreground w-full`}>
                <Bot className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto ${isMobile ? 'mb-2' : 'mb-4'} text-orange-500`} />
                <p className={`${isMobile ? 'text-base' : 'text-lg'} break-words`}>Welcome to the Hindu Dharma AI Assistant</p>
                <p className={`${isMobile ? 'text-sm px-2' : ''} break-words max-w-full`}>Ask questions about Vedic traditions, rituals, sampradayas, and more.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-orange-600" />
                  </div>
                )}
                
                <div
                  className={`${isMobile ? 'max-w-[85%]' : 'max-w-[70%]'} rounded-lg ${isMobile ? 'px-3 py-2' : 'px-4 py-2'} ${
                    message.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-600" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
          <div className={`${isMobile ? 'w-full' : ''}`}>
            <LanguageSelector value={language} onValueChange={setLanguage} />
          </div>
          <div className={`flex ${isMobile ? 'space-x-2' : 'flex-1 space-x-2'}`}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isMobile ? "Ask about Hindu Dharma..." : "Ask about Hindu Dharma, rituals, sampradayas..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              className={`${isMobile ? 'h-10 px-3' : ''}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};