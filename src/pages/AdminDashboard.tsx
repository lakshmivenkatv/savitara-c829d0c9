import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface AcharyaFormData {
  fullName: string;
  email: string;
  sampradaya: string;
  location: string;
  bio: string;
  experienceYears: number;
  specializations: string[];
  languages: string[];
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [acharyaForms, setAcharyaForms] = useState<AcharyaFormData[]>([
    {
      fullName: '',
      email: '',
      sampradaya: 'madhva',
      location: '',
      bio: '',
      experienceYears: 0,
      specializations: [],
      languages: ['english']
    }
  ]);
  const [newSpecialization, setNewSpecialization] = useState<string[]>(['']);
  const [newLanguage, setNewLanguage] = useState<string[]>(['']);

  const addAcharyaForm = () => {
    setAcharyaForms([...acharyaForms, {
      fullName: '',
      email: '',
      sampradaya: 'madhva',
      location: '',
      bio: '',
      experienceYears: 0,
      specializations: [],
      languages: ['english']
    }]);
    setNewSpecialization([...newSpecialization, '']);
    setNewLanguage([...newLanguage, '']);
  };

  const removeAcharyaForm = (index: number) => {
    const forms = acharyaForms.filter((_, i) => i !== index);
    setAcharyaForms(forms);
    setNewSpecialization(newSpecialization.filter((_, i) => i !== index));
    setNewLanguage(newLanguage.filter((_, i) => i !== index));
  };

  const updateAcharyaForm = (index: number, field: keyof AcharyaFormData, value: any) => {
    const updatedForms = [...acharyaForms];
    updatedForms[index] = { ...updatedForms[index], [field]: value };
    setAcharyaForms(updatedForms);
  };

  const addSpecialization = (formIndex: number) => {
    if (newSpecialization[formIndex]?.trim()) {
      const updatedForms = [...acharyaForms];
      updatedForms[formIndex].specializations.push(newSpecialization[formIndex].trim());
      setAcharyaForms(updatedForms);
      
      const updatedNewSpec = [...newSpecialization];
      updatedNewSpec[formIndex] = '';
      setNewSpecialization(updatedNewSpec);
    }
  };

  const removeSpecialization = (formIndex: number, specIndex: number) => {
    const updatedForms = [...acharyaForms];
    updatedForms[formIndex].specializations.splice(specIndex, 1);
    setAcharyaForms(updatedForms);
  };

  const addLanguage = (formIndex: number) => {
    if (newLanguage[formIndex]?.trim()) {
      const updatedForms = [...acharyaForms];
      if (!updatedForms[formIndex].languages.includes(newLanguage[formIndex].trim())) {
        updatedForms[formIndex].languages.push(newLanguage[formIndex].trim());
        setAcharyaForms(updatedForms);
      }
      
      const updatedNewLang = [...newLanguage];
      updatedNewLang[formIndex] = '';
      setNewLanguage(updatedNewLang);
    }
  };

  const removeLanguage = (formIndex: number, langIndex: number) => {
    const updatedForms = [...acharyaForms];
    if (updatedForms[formIndex].languages.length > 1) {
      updatedForms[formIndex].languages.splice(langIndex, 1);
      setAcharyaForms(updatedForms);
    }
  };

  const createAcharyas = async () => {
    setLoading(true);
    try {
      const validForms = acharyaForms.filter(form => 
        form.fullName.trim() && form.email.trim()
      );

      if (validForms.length === 0) {
        toast({
          title: "Error",
          description: "Please fill in at least one valid Acharya form",
          variant: "destructive"
        });
        return;
      }

      for (const form of validForms) {
        // Create auth user via signup (admin creates on behalf)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: 'TempPassword123!', // Admin should inform Acharya to change password
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: form.fullName,
              user_type: 'acharya',
              sampradaya: form.sampradaya,
              location: form.location,
              bio: form.bio,
              experience_years: form.experienceYears.toString(),
              specializations: form.specializations.join(','),
              languages: form.languages.join(',')
            }
          }
        });

        if (authError) {
          toast({
            title: "Error creating user",
            description: `Failed to create ${form.fullName}: ${authError.message}`,
            variant: "destructive"
          });
          continue;
        }

        toast({
          title: "Success",
          description: `Created Acharya: ${form.fullName}. They will receive an email to verify their account.`,
        });
      }

      // Reset forms
      setAcharyaForms([{
        fullName: '',
        email: '',
        sampradaya: 'madhva',
        location: '',
        bio: '',
        experienceYears: 0,
        specializations: [],
        languages: ['english']
      }]);
      setNewSpecialization(['']);
      setNewLanguage(['']);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create Acharyas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Create multiple Acharya profiles</p>
      </div>

      <div className="space-y-6">
        {acharyaForms.map((form, formIndex) => (
          <Card key={formIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Acharya {formIndex + 1}</CardTitle>
              {acharyaForms.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAcharyaForm(formIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => updateAcharyaForm(formIndex, 'fullName', e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateAcharyaForm(formIndex, 'email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sampradaya</label>
                  <Select
                    value={form.sampradaya}
                    onValueChange={(value) => updateAcharyaForm(formIndex, 'sampradaya', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="madhva">Madhva</SelectItem>
                      <SelectItem value="advaita">Advaita</SelectItem>
                      <SelectItem value="vishishtadvaita">Vishishtadvaita</SelectItem>
                      <SelectItem value="shakta">Shakta</SelectItem>
                      <SelectItem value="shaiva">Shaiva</SelectItem>
                      <SelectItem value="vaishnava">Vaishnava</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Experience Years</label>
                  <Input
                    type="number"
                    value={form.experienceYears}
                    onChange={(e) => updateAcharyaForm(formIndex, 'experienceYears', parseInt(e.target.value) || 0)}
                    placeholder="Years of experience"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={form.location}
                  onChange={(e) => updateAcharyaForm(formIndex, 'location', e.target.value)}
                  placeholder="City, State, Country"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => updateAcharyaForm(formIndex, 'bio', e.target.value)}
                  placeholder="Brief description of expertise and background"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Specializations</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.specializations.map((spec, specIndex) => (
                    <Badge key={specIndex} variant="secondary" className="flex items-center gap-1">
                      {spec}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSpecialization(formIndex, specIndex)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSpecialization[formIndex] || ''}
                    onChange={(e) => {
                      const updated = [...newSpecialization];
                      updated[formIndex] = e.target.value;
                      setNewSpecialization(updated);
                    }}
                    placeholder="Add specialization"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSpecialization(formIndex)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Languages</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.languages.map((lang, langIndex) => (
                    <Badge key={langIndex} variant="secondary" className="flex items-center gap-1">
                      {lang}
                      {form.languages.length > 1 && (
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeLanguage(formIndex, langIndex)}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLanguage[formIndex] || ''}
                    onChange={(e) => {
                      const updated = [...newLanguage];
                      updated[formIndex] = e.target.value;
                      setNewLanguage(updated);
                    }}
                    placeholder="Add language"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addLanguage(formIndex)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button variant="outline" onClick={addAcharyaForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Another Acharya
          </Button>
          <Button onClick={createAcharyas} disabled={loading}>
            {loading ? 'Creating...' : 'Create Acharyas'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;