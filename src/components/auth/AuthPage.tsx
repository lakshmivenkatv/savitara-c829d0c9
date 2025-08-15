import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPassword } from './ForgotPassword';
import { PhoneAuth } from './PhoneAuth';
import { Mail, Phone, ArrowLeft } from 'lucide-react';

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [emailTab, setEmailTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <ForgotPassword onBack={() => setShowForgotPassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/bb01a657-aa74-49e8-9fcd-657457a9c5ee.png" 
              alt="Savitara Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            Savitara
          </CardTitle>
          <CardDescription>
            Connect with Hindu Dharma wisdom and Acharyas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <Tabs value={emailTab} onValueChange={setEmailTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
                </TabsContent>
                
                <TabsContent value="signup">
                  <SignupForm onSwitchToLogin={() => setEmailTab('login')} />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="phone">
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="rounded-full bg-muted p-3">
                    <Phone className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Phone Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Coming Soon
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    We're working on adding phone number authentication. 
                    For now, please use email registration to create your account.
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('email')}
                  className="mt-4"
                >
                  Use Email Instead
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};