import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';

interface SignupFormProps {
  onSwitchToLogin?: () => void;
}

export const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    userType: '',
    sampradaya: '',
    location: '',
    bio: '',
    experienceYears: '',
    specializations: [] as string[],
    languages: ['english'] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!formData.email || !formData.password || !formData.fullName || !formData.userType || !formData.sampradaya) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting signup with:', { email: formData.email, fullName: formData.fullName, userType: formData.userType });
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            user_type: formData.userType,
            sampradaya: formData.sampradaya,
            location: formData.location || '',
            bio: formData.bio || '',
            languages: formData.languages.join(','),
            ...(formData.userType === 'acharya' && {
              ...(formData.experienceYears && { experience_years: formData.experienceYears }),
              ...(formData.specializations.length > 0 && { specializations: formData.specializations.join(',') }),
            }),
          },
        },
      });

      console.log('Signup response:', { data: authData, error: authError });

      if (authError) throw authError;

      // Set success state and store email for confirmation
      setUserEmail(formData.email);
      setRegistrationComplete(true);
      
      toast({
        title: "Registration Successful!",
        description: "Please check your email for verification.",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndProceed = () => {
    // Switch to login tab and reset form
    setRegistrationComplete(false);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      userType: '',
      sampradaya: '',
      location: '',
      bio: '',
      experienceYears: '',
      specializations: [] as string[],
      languages: ['english'] as string[],
    });
    
    // Call the callback to switch to login tab
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  };

  // Show success confirmation screen
  if (registrationComplete) {
    return (
      <div className="text-center space-y-6 py-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Registration Successful!
          </h3>
          <p className="text-sm text-muted-foreground">
            We've sent a verification email to:
          </p>
          <p className="text-sm font-medium text-foreground bg-muted px-3 py-2 rounded-md inline-flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {userEmail}
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Please check your email and click the verification link to activate your account.
          </p>
          <p className="text-xs text-muted-foreground">
            Don't see the email? Check your spam folder or contact support.
          </p>
        </div>
        
        <Button 
          onClick={handleConfirmAndProceed}
          className="w-full"
          variant="default"
        >
          Continue to Login
        </Button>
      </div>
    );
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>User Type</Label>
        <Select value={formData.userType} onValueChange={(value) => updateFormData('userType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select user type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grihasta">Grihasta (Seeker)</SelectItem>
            <SelectItem value="acharya">Acharya (Teacher)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sampradaya</Label>
        <Select value={formData.sampradaya} onValueChange={(value) => updateFormData('sampradaya', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select sampradaya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="madhva">Madhva</SelectItem>
            <SelectItem value="vaishnava">Vaishnava</SelectItem>
            <SelectItem value="smarta">Smarta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => updateFormData('location', e.target.value)}
        />
      </div>

      {formData.userType === 'acharya' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="experienceYears">Years of Experience</Label>
            <Input
              id="experienceYears"
              type="number"
              value={formData.experienceYears}
              onChange={(e) => updateFormData('experienceYears', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specializations">Specializations (comma-separated)</Label>
            <Input
              id="specializations"
              placeholder="e.g., Vedanta, Karma Kanda, Astrology"
              value={formData.specializations.join(', ')}
              onChange={(e) => updateFormData('specializations', e.target.value.split(',').map(s => s.trim()))}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => updateFormData('bio', e.target.value)}
          placeholder="Tell us about yourself..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};