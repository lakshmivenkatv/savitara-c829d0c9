import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Cpu, Cloud } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { EngineSelector } from './EngineSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { indicNLP } from '@/utils/indicNLP';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [engine, setEngine] = useState('azure');
  const [isInitializingIndic, setIsInitializingIndic] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Indic NLP when engine switches to indic
  useEffect(() => {
    if (engine === 'indic' && !isInitializingIndic) {
      setIsInitializingIndic(true);
      indicNLP.initialize()
        .then(() => {
          toast({
            title: "Indic NLP Ready",
            description: "Specialized Indic language engine is now active",
          });
        })
        .catch((error) => {
          console.error('Failed to initialize Indic NLP:', error);
          toast({
            title: "Engine Error",
            description: "Failed to initialize Indic NLP. Falling back to Azure.",
            variant: "destructive",
          });
          setEngine('azure');
        })
        .finally(() => {
          setIsInitializingIndic(false);
        });
    }
  }, [engine, toast, isInitializingIndic]);

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
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="flex flex-col space-y-4 pb-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            Hindu Dharma AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {engine === 'azure' ? <Cloud className="w-5 h-5 text-blue-500" /> : <Cpu className="w-5 h-5 text-green-500" />}
            <span className="text-sm text-muted-foreground">
              {engine === 'azure' ? 'Azure OpenAI' : 'Indic NLP'}
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-4">
          <EngineSelector value={engine} onValueChange={setEngine} />
          <LanguageSelector value={language} onValueChange={setLanguage} />
        </div>
        {isInitializingIndic && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            Initializing Indic NLP engine...
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <p className="text-lg">Welcome to the Hindu Dharma AI Assistant</p>
                <p>Ask questions about Vedic traditions, rituals, sampradayas, and more.</p>
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
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
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
        
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about Hindu Dharma, rituals, sampradayas..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};