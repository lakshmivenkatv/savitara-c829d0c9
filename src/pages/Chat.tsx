import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AcharyaFullProfile } from '@/components/AcharyaFullProfile';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  language: string;
}

interface ConversationDetails {
  id: string;
  title: string;
  grihasta_id: string;
  acharya_id: string;
  grihasta_profile?: {
    full_name: string;
    user_type: string;
  };
  acharya_profile?: {
    full_name: string;
    user_type: string;
    sampradaya: string;
  };
}

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/auth');
        return;
      }
      setCurrentUser(user);

      if (!conversationId) return;

      // Fetch conversation details
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          grihasta_id,
          acharya_id
        `)
        .eq('id', conversationId)
        .single();

      if (conversationError) throw conversationError;

      // Check if user has access to this conversation
      if (conversationData.grihasta_id !== user.id && conversationData.acharya_id !== user.id) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this conversation",
          variant: "destructive",
        });
        navigate('/conversations');
        return;
      }

      // Fetch participant profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, user_type, sampradaya')
        .in('user_id', [conversationData.grihasta_id, conversationData.acharya_id]);

      if (profilesError) throw profilesError;

      const gRihastaProfile = profilesData?.find(p => p.user_id === conversationData.grihasta_id);
      const acharyaProfile = profilesData?.find(p => p.user_id === conversationData.acharya_id);

      setConversation({
        ...conversationData,
        grihasta_profile: gRihastaProfile,
        acharya_profile: acharyaProfile
      });

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !conversationId || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          language: 'english'
        }]);

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !currentUser) return null;
    
    if (conversation.grihasta_id === currentUser.id) {
      return {
        profile: conversation.acharya_profile,
        userId: conversation.acharya_id,
        isAcharya: true
      };
    } else {
      return {
        profile: conversation.grihasta_profile,
        userId: conversation.grihasta_id,
        isAcharya: false
      };
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Conversation not found</div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/conversations')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {otherParticipant?.profile?.full_name || 'Unknown User'}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {otherParticipant?.isAcharya && (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              Acharya
                            </Badge>
                            {conversation.acharya_profile?.sampradaya && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {conversation.acharya_profile.sampradaya}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {otherParticipant?.isAcharya && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfile(!showProfile)}
                  >
                    {showProfile ? 'Hide Profile' : 'View Profile'}
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMyMessage = message.sender_id === currentUser?.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isMyMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isSending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Section */}
        {showProfile && otherParticipant?.isAcharya && (
          <div className="lg:col-span-1">
            <AcharyaFullProfile
              acharyaUserId={otherParticipant.userId}
              currentUserId={currentUser?.id || ''}
            />
          </div>
        )}
      </div>
    </div>
  );
}