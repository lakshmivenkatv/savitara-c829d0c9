import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, BookOpen, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AcharyaFullProfile {
  id: string;
  user_id: string;
  full_name: string;
  sampradaya: string;
  location: string;
  bio: string;
  experience_years: number;
  specializations: string[];
  languages: string[];
  availability: boolean;
  created_at: string;
  updated_at: string;
}

interface AcharyaFullProfileProps {
  acharyaUserId: string;
  currentUserId: string;
}

export const AcharyaFullProfile = ({ acharyaUserId, currentUserId }: AcharyaFullProfileProps) => {
  const [profile, setProfile] = useState<AcharyaFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAccessAndFetchProfile();
  }, [acharyaUserId, currentUserId]);

  const checkAccessAndFetchProfile = async () => {
    try {
      // First check if user has access via conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(grihasta_id.eq.${currentUserId},acharya_id.eq.${acharyaUserId}),and(acharya_id.eq.${currentUserId},grihasta_id.eq.${acharyaUserId})`)
        .limit(1);

      if (conversationError) throw conversationError;

      if (!conversationData || conversationData.length === 0) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      setHasAccess(true);

      // If user has access, fetch the full profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', acharyaUserId)
        .eq('user_type', 'acharya')
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load Acharya profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4" />
            <p>Start a conversation to view the full profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Profile not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {profile.full_name}
          <Badge variant="secondary" className="capitalize">
            {profile.sampradaya}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span>{profile.location || 'Location not specified'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Experience
            </h4>
            <p className="text-sm text-muted-foreground">
              {profile.experience_years} years of teaching and practice
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Languages</h4>
            <div className="flex flex-wrap gap-1">
              {profile.languages.map((lang, index) => (
                <Badge key={index} variant="outline" className="text-xs capitalize">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {profile.specializations && profile.specializations.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              Areas of Expertise
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.specializations.map((spec, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.bio && (
          <div>
            <h4 className="font-semibold text-sm mb-3">About</h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Teaching since {new Date(profile.created_at).getFullYear()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};