import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          Veda Viveka - Hindu Dharma AI Assistant
        </h1>
        <p className="text-xl text-muted-foreground">
          Ask questions about Vedic traditions, rituals, sampradayas, and sacred wisdom
        </p>
      </div>
      
      <ChatInterface />
    </div>
  );
};

export default Index;
