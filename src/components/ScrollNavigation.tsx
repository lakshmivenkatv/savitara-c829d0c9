import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const ScrollNavigation = () => {
  const [showButtons, setShowButtons] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Show buttons if page is scrollable
      const isScrollable = scrollHeight > clientHeight;
      setShowButtons(isScrollable);
      
      // Check if can scroll up (not at top)
      setCanScrollUp(scrollTop > 100);
      
      // Check if can scroll down (not at bottom)
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 100);
    };

    // Check on mount and scroll
    checkScrollPosition();
    window.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!showButtons) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          "shadow-lg transition-all duration-300 hover:scale-110",
          canScrollUp 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      
      <Button
        variant="secondary"
        size="icon"
        onClick={scrollToBottom}
        className={cn(
          "shadow-lg transition-all duration-300 hover:scale-110",
          canScrollDown 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        aria-label="Scroll to bottom"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};