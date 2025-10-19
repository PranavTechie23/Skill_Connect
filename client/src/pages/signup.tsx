import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
/*  */import { Label, labelVariants } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { normalizeUserType } from "@/lib/utils";
import { Eye, EyeOff, User as UserIcon, Building } from "lucide-react";

type Role = "employee" | "employer";

interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  userType: "Professional" | "Employer";
  location?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  companyName?: string;
  companyWebsite?: string;
  companyBio?: string;
  telephoneNumber?: string;
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
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
    skills: "",
    companyName: "",
    companyWebsite: "",
    companyBio: "",
    telephoneNumber: "",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced email check
  useEffect(() => {
    const handler = setTimeout(async () => {
      const email = form.email.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailPattern.test(email)) {
        setIsCheckingEmail(true);
        setEmailError(null);
        try {
          const res = await apiFetch("/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (!res.ok || data.exists) {
            setEmailError("This email is already in use.");
          } else {
            setEmailError(null);
          }
        } catch (error) {
          // Fail open - don't block registration if check fails
          console.warn("Email check failed:", error);
          setEmailError(null);
        } finally {
          setIsCheckingEmail(false);
        }
      } else {
        setEmailError(email ? "Please enter a valid email." : null);
      }
    }, 500); // 500ms debounce delay
    return () => clearTimeout(handler);
  }, [form.email]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const ut = (user as any).userType;
      const normalized = normalizeUserType(ut as string);
  if (normalized === "professional") navigate("/employee/dashboard", { replace: true });
  else if (normalized === "employer") navigate("/employer/dashboard", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [user, navigate]);

  function handleClose() {
    setOpen(false);
    navigate("/");
  }

  const update = (patch: Partial<typeof form>) => setForm(prev => ({ ...prev, ...patch }));

  const next = () => {
    if (!validateStep(step)) return;
    setStep(s => Math.min(3, s + 1));
  };
  
  const back = () => setStep(s => Math.max(0, s - 1));

  // map local role to backend userType
  const mapUserType = (r: Role): RegisterPayload["userType"] => {
    if (r === "employee") return "Professional";
    return "Employer";
  };

  // --- validate step (trim email, basic email regex)
  const validateStep = (s: number): boolean => {
    if (s === 0) {
      const email = form.email.trim();
      const password = form.password;
      const confirm = form.confirmPassword;

      if (!email || !password || emailError) return false;
      if (password.length < 6) return false;
      if (password !== confirm) return false;

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) return false;
      
      return true;
    }
    if (s === 1) {
      return Boolean(form.firstName && form.lastName);
    }
    if (s === 2) {
      if (form.userType === 'employer') {
        const phoneRegex = /^\d{10}$/;
        return Boolean(form.companyName && form.location && form.telephoneNumber && phoneRegex.test(form.telephoneNumber));
      }
      return true;
    }
    return true;
  };

  const isNextDisabled = !validateStep(step);
  const isCreateDisabled = loading || !validateStep(0) || !validateStep(1) || !validateStep(2);

  // --- handle submit (re-validate, prevent double submits, defensive JSON parsing)
  const handleSubmit = async () => {
    if (loading) return;

    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      toast({
        title: "Invalid information",
        description: "Please fill all the required fields before continuing.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        userType: mapUserType(form.userType),
        location: form.location?.trim() || undefined,
        title: form.title?.trim() || undefined,
        bio: form.bio?.trim() || undefined,
        skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        companyName: form.companyName?.trim() || undefined,
        companyWebsite: form.companyWebsite?.trim() || undefined,
        companyBio: form.companyBio?.trim() || undefined,
        telephoneNumber: form.telephoneNumber?.trim() || undefined,
      };

      // Use AuthContext.register when available for consistent behavior
      let createdUser: any = null;
      if (auth && typeof auth.register === "function") {
        try {
          createdUser = await auth.register(payload);
        } catch (e) {
          // Let the outer catch handle toast/error
          throw e;
        }
      } else {
        // Fallback to raw fetch if AuthContext.register isn't available
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include"
        });
        let data: any = {};
        try { data = await res.json(); } catch {}
        if (!res.ok) {
          const errMessage = data?.message || res.statusText || "Registration failed";
          throw new Error(errMessage);
        }
        createdUser = data?.user ?? data;
        // Try to set user in context if possible
        if (createdUser && typeof auth?.setUser === "function") auth.setUser(createdUser);
      }

      console.debug("signup: createdUser", createdUser, "payloadUserType", payload.userType);

  toast({ title: "Account created successfully", description: "Welcome to SkillConnect!", variant: "success" });

      // Determine redirect based on a reliable user object.
      // Prefer: createdUser (API response) -> auth.user (context) -> /api/auth/me (server) -> payload.userType
      let effectiveUser: any = createdUser ?? auth?.user ?? null;

      if (!effectiveUser) {
        try {
          const meRes = await apiFetch("/api/auth/me", { credentials: "include" });
          const meData = await meRes.json().catch(() => ({}));
          effectiveUser = meData?.user ?? meData ?? null;
          if (effectiveUser && typeof auth?.setUser === "function") auth.setUser(effectiveUser);
        } catch (meErr) {
          console.debug("signup: /api/auth/me fetch failed", meErr);
        }
      } else {
        // ensure context is updated when we have createdUser but auth may not yet reflect it
        if (effectiveUser && typeof auth?.setUser === "function") auth.setUser(effectiveUser);
      }
      // persist token if provided by API response
      try { if ((createdUser as any)?.token) localStorage.setItem('skillconnect_token_v1', (createdUser as any).token); } catch {}

      if (effectiveUser) {
        if (typeof auth?.setUser === "function") auth.setUser(effectiveUser);
        const normalized = normalizeUserType(effectiveUser?.userType || payload.userType || "");
        const target = normalized === "professional" ? "/employee/dashboard" : normalized === "employer" ? "/employer/dashboard" : "/";
        
        // Use navigate instead of window.location.assign to allow AuthContext to propagate state
        // without a hard reload, which fixes the race condition.
        navigate(target, { replace: true });
      } else {
        // Fallback if user object is not available after signup
        navigate("/login", { replace: true });
      }

    } catch (err: any) {
      console.error("signup error", err);
      toast({ title: "Registration failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeIcon = (type: Role) => {
    switch (type) {
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
      case 'employee':
        return "Find jobs and build your professional profile";
      case 'employer':
        return "Post jobs and find talented professionals";
      default:
        return "";
    }
  };

  if (!open) return null;

  const Step0 = (
    <div className="space-y-3">
      <div>
        <Label>Email</Label>
        <Input
          value={form.email}
          onChange={e => update({ email: e.target.value })}
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
        {isCheckingEmail && <p className="text-sm text-muted-foreground mt-1">Checking email...</p>}
        {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
      </div>

      <div>
        <Label>Password</Label>
        <div className="relative">
          <Input
            value={form.password}
            onChange={e => update({ password: e.target.value })}
            type={showPassword ? "text" : "password"}
            placeholder="At least 6 characters"
            autoComplete="new-password"
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
            autoComplete="new-password"
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
          <Input value={form.firstName} onChange={e => update({ firstName: e.target.value })} placeholder="John" autoComplete="given-name" />
        </div>
        <div>
          <Label>Last name</Label>
          <Input value={form.lastName} onChange={e => update({ lastName: e.target.value })} placeholder="Doe" autoComplete="family-name" />
        </div>
      </div>

      <div>
        <Label>I'm signing up as</Label>
        <div className="flex gap-2 mt-2" role="radiogroup" aria-label="User type">
          {(["employee", "employer"] as Role[]).map(r => {
            const active = form.userType === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => update({ userType: r })}
                role="radio"
                aria-checked={active}
                aria-pressed={active}
                aria-label={r === 'employee' ? 'Professional' : 'Employer'}
                className={
                  `flex items-center gap-2 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-colors ` +
                  (active
                    ? `border-blue-600 bg-blue-50 text-gray-900 ring-blue-300 dark:bg-blue-900 dark:border-blue-400 dark:text-white`
                    : `border-gray-200 text-gray-800 dark:border-gray-700 dark:text-gray-200 bg-transparent dark:bg-transparent`)
                }
              >
                {getUserTypeIcon(r)}
                <div className="text-left">
                  <div className={`text-sm font-medium ${active ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                    {r === 'employee' ? 'Professional' : 'Employer'}
                  </div>
                  <div className="text-xs opacity-80 dark:opacity-80 text-gray-600 dark:text-gray-300">{getUserTypeDescription(r)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const Step2Employee = (
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

  const Step2Employer = (
    <div className="space-y-3">
      <div>
        <Label>Company Name</Label>
        <Input value={form.companyName} onChange={e => update({ companyName: e.target.value })} placeholder="Tech Corp" required />
      </div>

      <div>
        <Label>Location</Label>
        <Input value={form.location} onChange={e => update({ location: e.target.value })} placeholder="City, Country" required />
      </div>

      <div>
        <Label>Telephone Number</Label>
        <Input value={form.telephoneNumber} onChange={e => {
          const { value } = e.target;
          if (/^\d*$/.test(value)) {
            update({ telephoneNumber: value });
          }
        }} placeholder="+1 234 567 890" type="tel" required maxLength={10} />
      </div>

      <div>
        <Label>Company Website (Optional)</Label>
        <Input value={form.companyWebsite} onChange={e => update({ companyWebsite: e.target.value })} placeholder="https://example.com" />
      </div>

      <div>
        <Label>Company Bio</Label>
        <Textarea value={form.companyBio} onChange={e => update({ companyBio: e.target.value })} placeholder="Brief description of your company" />
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
        {form.userType === 'employee' ? (
          <>
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
          </>
        ) : (
          <>
            <div>
              <Label>Company Name</Label>
              <div className="mt-1">{form.companyName || '—'}</div>
            </div>
            <div>
              <Label>Location</Label>
              <div className="mt-1">{form.location || '—'}</div>
            </div>
            <div>
              <Label>Telephone Number</Label>
              <div className="mt-1">{form.telephoneNumber || '—'}</div>
            </div>
            <div>
              <Label>Company Website</Label>
              <div className="mt-1">{form.companyWebsite || '—'}</div>
            </div>
          </>
        )}
      </div>

      <div className="text-sm text-muted-foreground mt-2">
        If everything looks good, click "Create account" to finish.
      </div>
    </div>
  );

  const steps = [Step0, Step1, form.userType === 'employee' ? Step2Employee : Step2Employer, Step3];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24 }}
        className="relative z-10 w-full max-w-4xl mx-auto"
      >
  <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
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
                    <Button onClick={handleSubmit} disabled={isCreateDisabled}>
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
