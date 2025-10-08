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
    // keep the same validation as validateStep to avoid inconsistencies
    if (!validateStep(step)) return;
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

  // Centralized step validation used both for disabling the button and preventing navigation
  const validateStep = (s: number) => {
    if (s === 0) {
      if (!form.email || !form.password) return false;
      if (form.password.length < 6) return false;
      if (form.password !== form.confirmPassword) return false;
      return true;
    }
    if (s === 1) {
      return Boolean(form.firstName && form.lastName);
    }
    // step 2: allow continuing (optional fields)
    if (s === 2) return true;
    // step 3 is the final review step — no continuation from here
    return true;
  };

  const isNextDisabled = !validateStep(step);

  if (!open) return null;

  // create per-step content (keeps this component self-contained)
  const Step0 = (
    <div className="space-y-3">
      <div>
        <Label>Email</Label>
        <Input value={form.email} onChange={e => update({ email: e.target.value })} type="email" placeholder="you@company.com" />
      </div>

      <div>
        <Label>Password</Label>
        <div className="relative">
          <Input
            value={form.password}
            onChange={e => update({ password: e.target.value })}
            type={showPassword ? "text" : "password"}
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-2"
            onClick={() => setShowPassword(v => !v)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      <div>
        <Label>Confirm Password</Label>
        <div className="relative">
          <Input
            value={form.confirmPassword}
            onChange={e => update({ confirmPassword: e.target.value })}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repeat your password"
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            className="absolute right-2 top-2"
            onClick={() => setShowConfirmPassword(v => !v)}
          >
            {showConfirmPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>
    </div>
  );

  const Step1 = (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>First name</Label>
          <Input value={form.firstName} onChange={e => update({ firstName: e.target.value })} placeholder="John" />
        </div>
        <div>
          <Label>Last name</Label>
          <Input value={form.lastName} onChange={e => update({ lastName: e.target.value })} placeholder="Doe" />
        </div>
      </div>

      <div>
        <Label>I'm signing up as</Label>
        <div className="flex gap-2 mt-2">
          {(["employee", "employer", "admin"] as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => update({ userType: r })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${form.userType === r ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
            >
              {getUserTypeIcon(r)}
              <div className="text-left">
                <div className="text-sm font-medium">{r === 'employee' ? 'Professional' : r === 'employer' ? 'Employer' : 'Admin'}</div>
                <div className="text-xs opacity-80">{getUserTypeDescription(r)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const Step2 = (
    <div className="space-y-3">
      <div>
        <Label>Location</Label>
        <Input value={form.location} onChange={e => update({ location: e.target.value })} placeholder="City, Country" />
      </div>

      <div>
        <Label>Title</Label>
        <Input value={form.title} onChange={e => update({ title: e.target.value })} placeholder="Frontend Developer" />
      </div>

      <div>
        <Label>Bio</Label>
        <Textarea value={form.bio} onChange={e => update({ bio: e.target.value })} placeholder="Short intro about you" />
      </div>

      <div>
        <Label>Skills (comma separated)</Label>
        <Input value={form.skills} onChange={e => update({ skills: e.target.value })} placeholder="React, Node.js, SQL" />
      </div>
    </div>
  );

  const Step3 = (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Review your information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Email</Label>
          <div className="mt-1">{form.email}</div>
        </div>
        <div>
          <Label>Name</Label>
          <div className="mt-1">{form.firstName} {form.lastName}</div>
        </div>
        <div>
          <Label>User type</Label>
          <div className="mt-1">{mapUserType(form.userType)}</div>
        </div>
        <div>
          <Label>Location</Label>
          <div className="mt-1">{form.location || '—'}</div>
        </div>
        <div>
          <Label>Title</Label>
          <div className="mt-1">{form.title || '—'}</div>
        </div>
        <div>
          <Label>Skills</Label>
          <div className="mt-1">{form.skills || '—'}</div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-2">
        If everything looks good, click "Create account" to finish.
      </div>
    </div>
  );

  const steps = [Step0, Step1, Step2, Step3];

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
                {steps[step]}
              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  {step > 0 && <Button variant="outline" onClick={back}>Back</Button>}
                </div>

                <div className="flex items-center gap-3">
                  {step < 3 && (
                    <Button onClick={next} disabled={isNextDisabled}>
                      Continue
                    </Button>
                  )}
                  {step === 3 && (
                    <Button onClick={handleSubmit} disabled={loading}>
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
