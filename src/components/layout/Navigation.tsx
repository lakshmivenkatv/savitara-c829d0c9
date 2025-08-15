import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, MessageCircle, Search, Home, Users, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

interface NavigationProps {
  user: any;
}

export const Navigation = ({ user }: NavigationProps) => {
  const { toast } = useToast();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/acharyas', icon: Search, label: 'Find Acharyas' },
    { to: '/connection-requests', icon: Users, label: 'Connections' },
    { to: '/conversations', icon: MessageCircle, label: 'Conversations' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className={`${isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        <div className={`flex justify-between items-center ${isMobile ? 'h-14' : 'h-16'}`}>
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/3bb19521-3c50-41cf-b574-d98f5598202b.png" 
                alt="Savitara Logo" 
                className={`object-contain ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}
              />
              <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent`}>
                Savitara
              </span>
            </Link>
            
            {!isMobile && (
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isMobile && (
              <span className="text-sm text-gray-600">
                Welcome, {user?.email?.split('@')[0]}
              </span>
            )}
            
            {isMobile ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Menu className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && isMobileMenuOpen && (
          <div className="border-t border-gray-200 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors touch-manipulation ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50 active:bg-orange-100'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="px-3 py-2 border-t border-gray-200 mt-2 pt-2">
              <div className="text-xs text-gray-500 mb-2">
                {user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full justify-center"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};