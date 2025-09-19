
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
import { FaGoogle, FaGithub } from 'react-icons/fa';

// Custom dropdown data
const jobRoles = [
  'Software Developer',
  'Data Scientist',
  'UX/UI Designer',
  'Product Manager',
  'DevOps Engineer',
  'Cybersecurity Analyst',
  'Cloud Architect',
  'Mobile App Developer',
  'Network Engineer',
  'System Administrator',
  'Database Administrator',
  'AI/ML Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Game Developer',
  'Blockchain Developer',
  'Quality Assurance Engineer',
  'Business Analyst',
  'Project Manager',
  'Technical Writer',
  'IT Support Specialist',
  'Digital Marketing Manager',
  'Content Writer',
  'Graphic Designer',
  'Video Editor',
  'Animator',
  'Sound Engineer',
  'Architect',
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Biomedical Engineer',
  'Chemical Engineer',
  'Interior Designer',
  'Fashion Designer',
  'Chef',
  'Photographer',
  'Personal Trainer',
  'Journalist',
];

const indianCities = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'Employer' | 'Professional';
  location: string;
  professionalTitle: string;
  username: string;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'Employer',
    location: '',
    professionalTitle: '',
    username: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleUserTypeChange = (value: 'Employer' | 'Professional') => {
    setFormData({ ...formData, userType: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/register", formData);
      toast({ title: "Success", description: "Account created successfully" });
      setLocation("/login");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOAuthSignup = (provider: string) => {
    // Implement OAuth signup logic here
    console.log(`Signing up with ${provider}`);
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
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleOAuthSignup('google')}>
                <FaGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuthSignup('github')}>
                <FaGithub className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
            <Separator className="my-4">
              <span className="px-2 text-muted-foreground text-sm">Or continue with</span>
            </Separator>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" placeholder="johndoe" required onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Virat"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Kohli"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userType">I am a</Label>
                <Select onValueChange={handleUserTypeChange} value={formData.userType}>
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
                <Select onValueChange={(value) => setFormData({...formData, location: value})} value={formData.location}>
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
                <Select onValueChange={(value) => setFormData({...formData, professionalTitle: value})} value={formData.professionalTitle}>
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
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Already have an account?
            </div>
            <Link href="/login">
              <Button variant="link" className="text-primary">
                Sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
