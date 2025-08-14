import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ConversationWithProfile {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  latest_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

export default function Conversations() {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);
    await fetchConversations(user.id);
    
    // Set up realtime subscription for new messages
    const messagesChannel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('New message detected:', payload);
          // Refresh conversations when new messages are added
          await fetchConversations(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  };

  const fetchConversations = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch conversations where user is either grihasta or acharya
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          grihasta_id,
          acharya_id
        `)
        .or(`grihasta_id.eq.${userId},acharya_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch profiles for all participants
      const userIds = new Set<string>();
      conversationsData?.forEach(conv => {
        userIds.add(conv.grihasta_id);
        userIds.add(conv.acharya_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, user_type, sampradaya')
        .in('user_id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Fetch latest message for each conversation
      const conversationIds = conversationsData?.map(conv => conv.id) || [];
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender_id')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation and get the latest
      const latestMessages = new Map();
      messagesData?.forEach(message => {
        if (!latestMessages.has(message.conversation_id)) {
          latestMessages.set(message.conversation_id, message);
        }
      });

      // Combine data
      const enrichedConversations: ConversationWithProfile[] = conversationsData?.map(conv => {
        const gRihastaProfile = profilesData?.find(p => p.user_id === conv.grihasta_id);
        const acharyaProfile = profilesData?.find(p => p.user_id === conv.acharya_id);
        const latestMessage = latestMessages.get(conv.id);

        return {
          ...conv,
          grihasta_profile: gRihastaProfile,
          acharya_profile: acharyaProfile,
          latest_message: latestMessage
        };
      }) || [];

      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: ConversationWithProfile, currentUserId: string) => {
    if (conversation.grihasta_id === currentUserId) {
      return {
        profile: conversation.acharya_profile,
        isAcharya: true
      };
    } else {
      return {
        profile: conversation.grihasta_profile,
        isAcharya: false
      };
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Conversations</h1>
        <p className="text-muted-foreground">
          Your ongoing discussions with Acharyas and Grihastas
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start a conversation with an Acharya to begin your spiritual journey
            </p>
            <Button onClick={() => navigate('/acharyas')}>
              Find Acharyas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const participant = getOtherParticipant(conversation, currentUserId);

            return (
              <Card
                key={conversation.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/chat/${conversation.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {participant.profile?.full_name || 'Unknown User'}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          {participant.isAcharya && (
                            <Badge variant="secondary" className="text-xs">
                              Acharya
                            </Badge>
                          )}
                          {participant.isAcharya && conversation.acharya_profile?.sampradaya && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {conversation.acharya_profile.sampradaya}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(conversation.latest_message?.created_at || conversation.updated_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {conversation.latest_message && (
                  <CardContent className="pt-0">
                    <CardDescription className="line-clamp-2">
                      {conversation.latest_message.content}
                    </CardDescription>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}