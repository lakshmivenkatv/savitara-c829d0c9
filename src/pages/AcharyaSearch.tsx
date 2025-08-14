import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, BookOpen, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AcharyaPublicProfile {
  id: string;
  user_id: string;
  full_name: string;
  sampradaya: string;
  location: string;
  bio_preview: string; // Note: This is truncated bio for privacy
  experience_years: number;
  specializations: string[];
  languages: string[];
  availability: boolean;
}

export default function AcharyaSearch() {
  const [acharyas, setAcharyas] = useState<AcharyaPublicProfile[]>([]);
  const [filteredAcharyas, setFilteredAcharyas] = useState<AcharyaPublicProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSampradaya, setSelectedSampradaya] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAcharyas();
  }, []);

  useEffect(() => {
    filterAcharyas();
  }, [acharyas, searchTerm, selectedSampradaya, selectedLocation]);

  const fetchAcharyas = async () => {
    try {
      const { data, error } = await supabase
        .from('acharya_public_profiles')
        .select('*')
        .eq('availability', true);

      if (error) throw error;
      setAcharyas(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch Acharyas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAcharyas = () => {
    let filtered = acharyas;

    if (searchTerm) {
      filtered = filtered.filter(acharya =>
        acharya.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acharya.specializations?.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        acharya.bio_preview?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSampradaya) {
      filtered = filtered.filter(acharya => acharya.sampradaya === selectedSampradaya);
    }

    if (selectedLocation) {
      filtered = filtered.filter(acharya => 
        acharya.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredAcharyas(filtered);
  };

  const startConversation = async (acharyaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          grihasta_id: user.id,
          acharya_id: acharyaId,
          title: 'New Conversation'
        }])
        .select()
        .single();

      if (error) throw error;

      navigate(`/conversation/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading Acharyas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Find an Acharya</h1>
        <p className="text-muted-foreground mb-6">
          Connect with learned teachers across different sampradayas
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedSampradaya} onValueChange={setSelectedSampradaya}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Sampradaya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sampradayas</SelectItem>
              <SelectItem value="madhva">Madhva</SelectItem>
              <SelectItem value="vaishnava">Vaishnava</SelectItem>
              <SelectItem value="smarta">Smarta</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAcharyas.map((acharya) => (
          <Card key={acharya.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {acharya.full_name}
                <Badge variant="secondary" className="capitalize">
                  {acharya.sampradaya}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{acharya.location || 'Location not specified'}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Experience</h4>
                <p className="text-sm text-muted-foreground">
                  {acharya.experience_years} years
                </p>
              </div>

              {acharya.specializations && acharya.specializations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Specializations
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {acharya.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm mb-2">Languages</h4>
                <div className="flex flex-wrap gap-1">
                  {acharya.languages.map((lang, index) => (
                    <Badge key={index} variant="outline" className="text-xs capitalize">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              {acharya.bio_preview && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">About</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {acharya.bio_preview}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Full profile available after starting conversation
                  </p>
                </div>
              )}

              <Button
                onClick={() => startConversation(acharya.user_id)}
                className="w-full"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAcharyas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No Acharyas found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}