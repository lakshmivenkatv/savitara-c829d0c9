import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus, CheckCircle, Clock, XCircle } from "lucide-react";

interface ConnectionRequestButtonProps {
  acharyaId: string;
  currentUserId: string;
  existingRequest?: {
    status: string;
    message?: string;
  };
}

export function ConnectionRequestButton({ acharyaId, currentUserId, existingRequest }: ConnectionRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendConnectionRequest = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send connection requests.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("connection_requests")
        .insert({
          grihasta_id: currentUserId,
          acharya_id: acharyaId,
          message: message.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully.",
      });
      
      setIsOpen(false);
      setMessage("");
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If there's an existing request, show status
  if (existingRequest) {
    const getStatusIcon = () => {
      switch (existingRequest.status) {
        case "accepted":
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case "pending":
          return <Clock className="h-4 w-4 text-yellow-600" />;
        case "rejected":
          return <XCircle className="h-4 w-4 text-red-600" />;
        default:
          return null;
      }
    };

    const getStatusText = () => {
      switch (existingRequest.status) {
        case "accepted":
          return "Connected";
        case "pending":
          return "Request Pending";
        case "rejected":
          return "Request Declined";
        default:
          return "Unknown Status";
      }
    };

    return (
      <Button variant="outline" disabled className="gap-2">
        {getStatusIcon()}
        {getStatusText()}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Send Connection Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Connection Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Write a personal message to introduce yourself..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendConnectionRequest} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}