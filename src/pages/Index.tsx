import { ChatInterface } from "@/components/ChatInterface";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-2' : 'container mx-auto p-6'}`}>
      <div className={`text-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold ${isMobile ? 'mb-2' : 'mb-4'} bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent`}>
          Savitara - Hindu Dharma AI Assistant
        </h1>
        <p className={`${isMobile ? 'text-base' : 'text-xl'} text-muted-foreground ${isMobile ? 'px-2' : ''}`}>
          Ask questions about Vedic traditions, rituals, sampradayas, and sacred wisdom
        </p>
      </div>
      
      <ChatInterface />
    </div>
  );
};

export default Index;
