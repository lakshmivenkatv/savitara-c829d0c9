import { ChatInterface } from "@/components/ChatInterface";
import { EngineSelector } from "@/components/EngineSelector";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, FileText } from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();
  const [engine, setEngine] = useState('azure');
  const [documentsCount, setDocumentsCount] = useState(0);

  const handleDocumentsProcessed = useCallback(() => {
    // Increment count when documents are processed
    setDocumentsCount(prev => prev + 1);
  }, []);

  if (isMobile) {
    return (
      <div className="p-2">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            Savitara - Hindu Dharma AI Assistant
          </h1>
          <p className="text-base text-muted-foreground px-2">
            Ask questions about Vedic traditions, rituals, sampradayas, and sacred wisdom
          </p>
        </div>
        
        <ChatInterface 
          engine={engine} 
          onEngineChange={setEngine}
          onDocumentsProcessed={handleDocumentsProcessed}
          documentsProcessedCount={documentsCount}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          Savitara - Hindu Dharma AI Assistant
        </h1>
        <p className="text-xl text-muted-foreground">
          Ask questions about Vedic traditions, rituals, sampradayas, and sacred wisdom
        </p>
      </div>
      
      <div className="flex gap-6 min-h-[600px]">
        {/* Left Pane */}
        <div className="w-80 space-y-4">
          {/* Engine Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                AI Engine Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EngineSelector value={engine} onValueChange={setEngine} />
            </CardContent>
          </Card>

          {/* Document Upload */}
          <DocumentUpload onDocumentsProcessed={handleDocumentsProcessed} />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1">
          <ChatInterface 
            engine={engine} 
            onEngineChange={setEngine}
            onDocumentsProcessed={handleDocumentsProcessed}
            documentsProcessedCount={documentsCount}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
