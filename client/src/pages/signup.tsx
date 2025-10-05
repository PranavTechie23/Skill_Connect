import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, User as UserIcon, Building, Shield } from "lucide-react";

type Role = "admin" | "employee" | "employer";

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "Professional" | "Employer" | "Admin";
  location?: string;
  title?: string;
  bio?: string;
  skills?: string[];
}

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth(); // expects { user, setUser, logout, ... }
  const user = auth.user;

  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0..3 (4 steps)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    userType: "employee" as Role,
    location: "",
    title: "",
    bio: "",
    skills: ""
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // map stored userType to route
      const ut = (user as any).userType;
      if (ut === "Admin" || ut === "admin") navigate("/admin", { replace: true });
      else if (ut === "Professional" || ut === "employee") navigate("/employee/dashboard", { replace: true });
      else navigate("/employer/dashboard", { replace: true });
    }
  }, [user, navigate]);

  function handleClose() {
    setOpen(false);
    navigate("/");
  }

  const update = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const next = () => {
    if (step === 0) {
      if (!form.email || !form.password || form.password !== form.confirmPassword) {
        toast({ title: "Validation Error", description: "Please check email and passwords.", variant: "destructive" });
        return;
      }
      if (form.password.length < 6) {
        toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
        return;
      }
    }
    if (step === 1) {
      if (!form.firstName || !form.lastName) {
        toast({ title: "Validation Error", description: "Please fill in your name.", variant: "destructive" });
        return;
      }
    }
    setStep(s => Math.min(3, s + 1));
  };
  
  const back = () => setStep(s => Math.max(0, s - 1));

  // map local role to backend userType
  const mapUserType = (r: Role): RegisterPayload["userType"] => {
    if (r === "employee") return "Professional";
    if (r === "employer") return "Employer";
    return "Admin";
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        userType: mapUserType(form.userType),
        location: form.location || undefined,
        title: form.title || undefined,
        bio: form.bio || undefined,
        skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : []
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Registration failed");
      }

      const data = await res.json();

      // if backend returns created user, set it in auth store
      if (data?.user && typeof auth.setUser === "function") {
        auth.setUser(data.user);
      }

      toast({ title: "Account created successfully", description: "Welcome to SkillConnect!" });

      // navigate to dashboard based on userType
      const redirect = payload.userType === "Professional" ? "/employee/dashboard" : (payload.userType === "Employer" ? "/employer/dashboard" : "/admin");
      navigate(redirect, { replace: true });

    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeIcon = (type: Role) => {
    switch (type) {
      case 'admin':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'employee':
        return <UserIcon className="h-5 w-5 text-blue-600" />;
      case 'employer':
        return <Building className="h-5 w-5 text-green-600" />;
      default:
        return <UserIcon className="h-5 w-5" />;
    }
  };

  const getUserTypeDescription = (type: Role) => {
    switch (type) {
      case 'admin':
        return "Manage the platform and oversee all operations";
      case 'employee':
        return "Find jobs and build your professional profile";
      case 'employer':
        return "Post jobs and find talented professionals";
      default:
        return "";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24 }}
        className="relative z-10 w-full max-w-4xl mx-auto"
      >
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="hidden lg:flex lg:w-1/3 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-10">
              <div className="text-center text-white max-w-xs">
                <h2 className="text-2xl font-extrabold mb-2">Join SkillConnect</h2>
                <p className="text-sm opacity-90">Create your account in 4 quick steps — we'll guide you.</p>
                <div className="mt-6 text-xs opacity-75">Step {step + 1} of 4</div>
              </div>
            </div>

            <div className="w-full lg:w-2/3 p-8 sm:p-10">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Join thousands of professionals and employers
                </p>
              </CardHeader>

              <div className="mb-4">
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-600 dark:bg-purple-500 rounded-full transition-all"
                    style={{ width: `${((step + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step content */}
              <div className="space-y-4">
                {step === 0 && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Account details</p>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={form.email} 
                        onChange={e => update({ email: e.target.value })} 
                        required 
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input 
                            id="password" 
                            name="password"
                            type={showPassword ? "text" : "password"} 
                            value={form.password} 
                            onChange={e => update({ password: e.target.value })} 
                            required 
                            placeholder="Create password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input 
                            id="confirmPassword" 
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"} 
                            value={form.confirmPassword} 
                            onChange={e => update({ confirmPassword: e.target.value })} 
                            required 
                            placeholder="Confirm password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Personal information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First name</Label>
                        <Input 
                          id="firstName" 
                          value={form.firstName} 
                          onChange={e => update({ firstName: e.target.value })} 
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last name</Label>
                        <Input 
                          id="lastName" 
                          value={form.lastName} 
                          onChange={e => update({ lastName: e.target.value })} 
                          placeholder="Enter last name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={form.location} 
                        onChange={e => update({ location: e.target.value })} 
                        placeholder="City, State/Country"
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Choose your role</p>
                    <div className="grid grid-cols-1 gap-4">
                      {(['employee', 'employer', 'admin'] as Role[]).map((type) => (
                        <div
                          key={type}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            form.userType === type 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                          onClick={() => update({ userType: type })}
                        >
                          <div className="flex items-center space-x-3">
                            {getUserTypeIcon(type)}
                            <div className="flex-1">
                              <h3 className="font-medium capitalize">{type}</h3>
                              <p className="text-sm text-muted-foreground">
                                {getUserTypeDescription(type)}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              form.userType === type 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {form.userType === type && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Professional details</p>
                    <div>
                      <Label htmlFor="title">Professional Title</Label>
                      <Input 
                        id="title" 
                        value={form.title} 
                        onChange={e => update({ title: e.target.value })} 
                        placeholder="e.g. Software Engineer, Marketing Manager"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={form.bio}
                        onChange={e => update({ bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 min-h-[80px] resize-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Input 
                        id="skills" 
                        value={form.skills} 
                        onChange={e => update({ skills: e.target.value })} 
                        placeholder="React, Node.js, Python, Marketing"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  {step > 0 && <Button variant="outline" onClick={back}>Back</Button>}
                </div>

                <div className="flex items-center gap-3">
                  {step < 3 && (
                    <Button onClick={next} className="bg-blue-600 hover:bg-blue-700">
                      Continue
                    </Button>
                  )}
                  {step === 3 && (
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading ? "Creating..." : "Create account"}
                    </Button>
                  )}
                </div>
              </div>

              <CardFooter className="pt-4 px-0">
                <div className="text-sm text-center w-full">
                  Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                </div>
              </CardFooter>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}