import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  firstName: string;
  lastName: string;
  confirmPassword: string;
  userType: 'Employer' | 'Professional';
  location: string;
  professionalTitle: string;
  username: string;
}

const indianCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
];

const jobRoles = [
  'Software Developer', 'Data Scientist', 'UX/UI Designer',
  'Product Manager', 'DevOps Engineer', 'Cybersecurity Analyst',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile App Developer', 'UI/UX Designer', 'Graphic Designer',
  'Marketing Manager', 'Sales Executive', 'HR Specialist',
  'Financial Analyst', 'Business Analyst', 'Project Manager',
  'Data Analyst', 'Machine Learning Engineer', 'Cloud Architect',
  'Network Administrator', 'Database Administrator', 'System Engineer',
  'Quality Assurance Engineer', 'Technical Support Specialist',
  'IT Consultant', 'Security Analyst', 'Product Designer',
  'Content Writer', 'Social Media Manager', 'Digital Marketing Specialist'
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterData>({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    userType: 'Professional', location: '', professionalTitle: '', username: '',
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/login", loginData);
      toast({ title: "Success", description: "Logged in successfully" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/register", registerData);
      toast({ title: "Success", description: "Account created successfully" });
      setIsLogin(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOAuth = (provider: string) => {
    // Implement OAuth logic here
    console.log(`Signing in with ${provider}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome to SkillConnect</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => setIsLogin(true)}>Login</TabsTrigger>
                <TabsTrigger value="register" onClick={() => setIsLogin(false)}>Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required onChange={handleLoginChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required onChange={handleLoginChange} />
                  </div>
                  <Button type="submit" className="w-full">Sign In</Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" required onChange={handleRegisterChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" required onChange={handleRegisterChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required onChange={handleRegisterChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" required onChange={handleRegisterChange} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" required onChange={handleRegisterChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" name="confirmPassword" type="password" required onChange={handleRegisterChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userType">I am a</Label>
                    <Select onValueChange={(value: 'Employer' | 'Professional') => setRegisterData({...registerData, userType: value})} value={registerData.userType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employer">Employer</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select onValueChange={(value) => setRegisterData({...registerData, location: value})} value={registerData.location}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionalTitle">Professional Title</Label>
                    <Select onValueChange={(value) => setRegisterData({...registerData, professionalTitle: value})} value={registerData.professionalTitle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job role" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobRoles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Sign Up</Button>
                </form>
              </TabsContent>
            </Tabs>
            <Separator className="my-4" />
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => handleOAuth('google')}>
                <FaGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuth('github')}>
                <FaGithub className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" onClick={() => handleOAuth('linkedin')}>
                <FaLinkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}