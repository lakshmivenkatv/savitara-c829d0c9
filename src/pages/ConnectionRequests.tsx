import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConnectionRequest {
  id: string;
  grihasta_id: string;
  acharya_id: string;
  status: string;
  message?: string;
  created_at: string;
  grihasta_profile?: {
    full_name: string;
    location?: string;
    bio?: string;
  };
  acharya_profile?: {
    full_name: string;
    sampradaya: string;
    location?: string;
  };
}

export default function ConnectionRequests() {
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);

      // Get user profile to determine type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setUserType(profile.user_type);
        await fetchConnectionRequests(session.user.id, profile.user_type);
      }
    };

    initializeData();
  }, [navigate]);

  const fetchConnectionRequests = async (userId: string, userType: string) => {
    setIsLoading(true);
    try {
      if (userType === "acharya") {
        // Fetch incoming requests for Acharya with manual join
        const { data: incoming, error: incomingError } = await supabase
          .from("connection_requests")
          .select("*")
          .eq("acharya_id", userId)
          .eq("status", "pending");

        if (incomingError) throw incomingError;

        // Fetch grihasta profiles separately
        const incomingWithProfiles = await Promise.all(
          (incoming || []).map(async (request) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, location, bio")
              .eq("user_id", request.grihasta_id)
              .single();
            
            return { ...request, grihasta_profile: profile };
          })
        );
        
        setIncomingRequests(incomingWithProfiles);

        // Fetch accepted connections
        const { data: accepted, error: acceptedError } = await supabase
          .from("connection_requests")
          .select("*")
          .eq("acharya_id", userId)
          .eq("status", "accepted");

        if (acceptedError) throw acceptedError;

        const acceptedWithProfiles = await Promise.all(
          (accepted || []).map(async (request) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, location, bio")
              .eq("user_id", request.grihasta_id)
              .single();
            
            return { ...request, grihasta_profile: profile };
          })
        );
        
        setConnections(acceptedWithProfiles);
      } else {
        // Fetch outgoing requests for Grihasta
        const { data: outgoing, error: outgoingError } = await supabase
          .from("connection_requests")
          .select("*")
          .eq("grihasta_id", userId);

        if (outgoingError) throw outgoingError;

        // Fetch acharya profiles separately
        const outgoingWithProfiles = await Promise.all(
          (outgoing || []).map(async (request) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, sampradaya, location")
              .eq("user_id", request.acharya_id)
              .single();
            
            return { ...request, acharya_profile: profile };
          })
        );
        
        setOutgoingRequests(outgoingWithProfiles);

        // Fetch accepted connections for Grihasta
        const accepted = outgoingWithProfiles.filter(req => req.status === "accepted");
        setConnections(accepted);
      }
    } catch (error: any) {
      console.error("Error fetching connection requests:", error);
      toast({
        title: "Error",
        description: "Failed to load connection requests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResponse = async (requestId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: status === "accepted" ? "Connection Accepted" : "Connection Declined",
        description: `You have ${status} the connection request.`,
      });

      // Refresh data
      if (currentUserId && userType) {
        await fetchConnectionRequests(currentUserId, userType);
      }
    } catch (error: any) {
      console.error("Error updating connection request:", error);
      toast({
        title: "Error",
        description: "Failed to update connection request.",
        variant: "destructive",
      });
    }
  };

  const startConversation = async (acharyaId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("grihasta_id", currentUserId)
        .eq("acharya_id", acharyaId)
        .maybeSingle();

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from("conversations")
          .insert({
            grihasta_id: currentUserId,
            acharya_id: acharyaId,
            title: "New Conversation"
          })
          .select("id")
          .single();

        if (error) throw error;
        conversationId = newConversation.id;
      }

      navigate(`/chat/${conversationId}`);
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground">
          Manage your connection requests and view your network
        </p>
      </div>

      <Tabs defaultValue={userType === "acharya" ? "incoming" : "outgoing"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {userType === "acharya" && (
            <TabsTrigger value="incoming">
              Incoming ({incomingRequests.length})
            </TabsTrigger>
          )}
          {userType === "grihasta" && (
            <TabsTrigger value="outgoing">
              Sent ({outgoingRequests.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="connections">
            Connections ({connections.length})
          </TabsTrigger>
        </TabsList>

        {userType === "acharya" && (
          <TabsContent value="incoming" className="space-y-4">
            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No pending connection requests
                  </p>
                </CardContent>
              </Card>
            ) : (
              incomingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {request.grihasta_profile?.full_name}
                        </h3>
                        {request.grihasta_profile?.location && (
                          <p className="text-sm text-muted-foreground">
                            {request.grihasta_profile.location}
                          </p>
                        )}
                        {request.message && (
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm">{request.message}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRequestResponse(request.id, "accepted")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestResponse(request.id, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        {userType === "grihasta" && (
          <TabsContent value="outgoing" className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No connection requests sent
                  </p>
                </CardContent>
              </Card>
            ) : (
              outgoingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {request.acharya_profile?.full_name}
                          </h3>
                          <Badge variant={request.status === "accepted" ? "default" : 
                                        request.status === "pending" ? "secondary" : "destructive"}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.acharya_profile?.sampradaya} • {request.acharya_profile?.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {request.status === "accepted" && (
                        <Button
                          size="sm"
                          onClick={() => startConversation(request.acharya_id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        <TabsContent value="connections" className="space-y-4">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No connections yet
                </p>
              </CardContent>
            </Card>
          ) : (
            connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold">
                        {userType === "acharya" 
                          ? connection.grihasta_profile?.full_name 
                          : connection.acharya_profile?.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {userType === "acharya" 
                          ? connection.grihasta_profile?.location
                          : `${connection.acharya_profile?.sampradaya} • ${connection.acharya_profile?.location}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(connection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {userType === "grihasta" && (
                      <Button
                        size="sm"
                        onClick={() => startConversation(connection.acharya_id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}