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
import { apiFetch } from "@/lib/api";
import { normalizeUserType } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { Eye, EyeOff, User as UserIcon, Building } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Role = "Professional" | "Employer";

const baseSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Please confirm your password."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  userType: z.enum(["Professional", "Employer"]),
});



const signupSchema = z.object({
  ...baseSchema.shape,
  location: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
  companyName: z.string().optional(),
  companyWebsite: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    // Allow URLs with or without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(val);
  }, { message: "Please enter a valid URL (e.g., example.com or https://example.com)" }),
  companyBio: z.string().optional(),
  telephoneNumber: z.string().length(10, "Telephone number must be 10 digits.").optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.userType === "Employer") {
    return !!data.companyName && !!data.location && !!data.telephoneNumber;
  }
  return true;
}, {
  message: "Required fields missing for employer registration",
  path: ["companyName"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth(); // expects { user, setUser, logout, ... }
  const user = auth.user;
  const location = useLocation();
  const { t } = useLanguage();

  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0..3 (4 steps)
  const [emailError, setEmailError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(location.state?.message || null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      userType: "Professional",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced email check
  useEffect(() => {
    const handler = setTimeout(async () => {
      const email = form.getValues("email").trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailPattern.test(email)) {
        setIsCheckingEmail(true);
        setEmailError(null);
        form.clearErrors("email");
        try {
          const res = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            credentials: 'include'
          });

          let data: { exists?: boolean; message?: string } = {};
          const contentType = res.headers.get("content-type");
          
          try {
            if (!res.ok) {
              console.warn("Server returned error status:", res.status);
              throw new Error("Server error occurred");
            }
            
            if (contentType && contentType.includes("application/json")) {
              data = await res.json();
            } else {
              const text = await res.text();
              console.warn("Unexpected response type:", contentType, "Response:", text);
              console.warn("Server might not be running on the correct port. Expected port 5003.");
              throw new Error("Server connection error");
            }
          } catch (err) {
            console.warn("Failed to parse email check response:", err);
            setEmailError("Error checking email availability");
            return;
          }

          if (!res.ok) {
            setEmailError("Error checking email availability");
            form.setError("email", { type: "manual", message: "Error checking email availability" });
          } else if (data?.exists) {
            setEmailError("This email is already in use.");
            form.setError("email", { type: "manual", message: "This email is already in use." });
          } else {
            setEmailError(null);
            form.clearErrors("email");
          }
        } catch (error) {
          // Fail open - don't block registration if check fails
          console.warn("Email check failed:", error);
          setEmailError(null);
        } finally {
          setIsCheckingEmail(false);
        }
      } else {
        if (email) form.setError("email", { type: "manual", message: "Please enter a valid email." });
      }
    }, 500); // 500ms debounce delay
    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("email")]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const ut = (user as any).userType;
      const normalized = normalizeUserType(ut as string).toLowerCase();
      if (normalized === "professional") navigate("/employee/dashboard", { replace: true });
      else if (normalized === "employer") navigate("/employer/dashboard", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [user, navigate]);

  function handleClose() {
    setOpen(false);
    navigate("/");
  }

  const checkEmail = async (email: string): Promise<boolean> => {
    if (!email) return false;
    setIsCheckingEmail(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      let data: { exists?: boolean; message?: string } = {};
      const contentType = res.headers.get("content-type");
      
      try {
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.warn("Unexpected response type:", contentType, "Response:", text);
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.warn("Failed to parse email check response:", err);
        setEmailError("Error checking email availability");
        return false;
      }

      if (!res.ok) {
        setEmailError("Error checking email availability");
        return false;
      }

      // If email exists, show error and return false
      if (data?.exists) {
        const errorMessage = data.message || "This email is already in use. Please use a different email address.";
        setEmailError(errorMessage);
        form.setError("email", { type: "manual", message: errorMessage });
        return false;
      }

      // If email doesn't exist, clear errors and return true
      setEmailError(null);
      form.clearErrors("email");
      return true;
    } catch (error) {
      console.error("Email check failed:", error);
      setEmailError("Error checking email availability");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const next = async () => {
    const fieldsToValidate: (keyof SignupFormData)[][] = [
        ["email", "password", "confirmPassword"],
        ["firstName", "lastName", "userType"],
        form.getValues("userType") === "Employer"
          ? ["companyName", "location", "telephoneNumber"] as (keyof SignupFormData)[]
          : [],
      ];

    const isValid = await form.trigger(fieldsToValidate[step]);
    if (!isValid) return;

    // If we're on the first step (email/password), do an additional email check
    if (step === 0) {
      const email = form.getValues("email");
      const isEmailAvailable = await checkEmail(email);
      if (!isEmailAvailable) {
        setEmailError("This email is already in use. Please use a different email address.");
        return; // Stop if email is not available
      }
      setEmailError(null); // Clear any existing error if email is available
    }

    setStep(s => Math.min(3, s + 1));
  };
  
  const back = () => setStep(s => Math.max(0, s - 1));

  // map local role to backend userType
  const mapUserType = (r: Role): "Professional" | "Employer" => {
    return r; // No need to map anymore since we're using the same values
  };

  // --- handle submit (re-validate, prevent double submits, defensive JSON parsing)
  const onSubmit = async (data: SignupFormData) => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        userType: mapUserType(data.userType),
        location: data.location?.trim() || undefined,
        ...(data.userType === 'Professional' && {
          title: 'title' in data ? data.title?.trim() || undefined : undefined,
          bio: 'bio' in data ? data.bio?.trim() || undefined : undefined,
          skills: 'skills' in data && data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        }),
        ...(data.userType === 'Employer' && {
          companyName: 'companyName' in data ? data.companyName?.trim() || undefined : undefined,
          companyWebsite: 'companyWebsite' in data ? data.companyWebsite?.trim() || undefined : undefined,
          companyBio: 'companyBio' in data ? data.companyBio?.trim() || undefined : undefined,
          telephoneNumber: 'telephoneNumber' in data ? data.telephoneNumber?.trim() || undefined : undefined,
        }),
      };

      // Use AuthContext.register when available for consistent behavior
      let createdUser: any = null;
      if (auth && typeof auth.register === "function") {
        createdUser = await auth.register(payload);
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
        console.debug("Signup redirect debug:", {
          effectiveUserType: effectiveUser?.userType,
          payloadUserType: payload.userType,
          normalized,
          effectiveUser
        });
        
        // Fix case sensitivity in comparison
        const target = normalized === "professional" ? "/employee/dashboard" : 
                      normalized === "employer" ? "/employer/dashboard" : "/";
        
        console.debug("Redirecting to:", target);
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
      case 'Professional':
        return <UserIcon className="h-5 w-5 text-blue-600" />;
      case 'Employer':
        return <Building className="h-5 w-5 text-green-600" />;
      default:
        return <UserIcon className="h-5 w-5" />;
    }
  };

  const getUserTypeDescription = (type: Role) => {
    switch (type) {
      case 'Professional':
        return "Find jobs and build your professional profile";
      case 'Employer':
        return "Post jobs and find talented professionals";
      default:
        return "";
    }
  };

  if (!open) return null;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const Step0 = (
    <div className="space-y-3">
      <div>
        <Label>Email</Label>
        <Input
          {...form.register("email")}
          placeholder="you@example.com"
          className={emailError ? "border-destructive" : ""}
        />
        {isCheckingEmail && <p className="text-sm text-muted-foreground mt-1">Checking email...</p>}
        {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
        {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
      </div>

      <div>
        <Label>Password</Label>
        <div className="relative">
          <Input
            {...form.register("password")}
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
            {...form.register("confirmPassword")}
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
          <Label>First Name</Label>
          <Input {...form.register("firstName")} placeholder="John" />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input {...form.register("lastName")} placeholder="Doe" />
        </div>
      </div>

      <div>
        <Label>I'm signing up as</Label>
        <div className="flex gap-2 mt-2" role="radiogroup" aria-label="User type">
          {(["Professional", "Employer"] as const).map(r => {
            const active = form.watch("userType") === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => form.setValue("userType", r)}
                role="radio"
                aria-checked={active}
                aria-pressed={active}
                aria-label={r}
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
                    {r}
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
        <Label>Location (Optional)</Label>
        <Input {...form.register("location")} placeholder="City, Country" />
      </div>

      <div>
        <Label>Title (Optional)</Label>
        <Input {...form.register("title")} placeholder="Frontend Developer" />
      </div>

      <div>
        <Label>Bio (Optional)</Label>
        <Textarea {...form.register("bio")} placeholder="Short intro about you" />
      </div>

      <div>
        <Label>Skills (comma separated, Optional)</Label>
        <Input {...form.register("skills")} placeholder="React, Node.js, SQL" />
      </div>
    </div>
  );

  const Step2Employer = (
    <div className="space-y-3">
      <div>
        <Label>Company Name</Label>
        <Input {...form.register("companyName")} placeholder="Tech Corp" />
      </div>

      <div>
        <Label>Location</Label>
        <Input {...form.register("location")} placeholder="City, Country" />
      </div>

      <div>
        <Label>Telephone Number</Label>
        <Input {...form.register("telephoneNumber")} placeholder="1234567890" type="tel" maxLength={10} />
      </div>

      <div>
        <Label>Company Website (Optional)</Label>
        <Input {...form.register("companyWebsite")} placeholder="https://example.com" />
      </div>

      <div>
        <Label>Company Bio (Optional)</Label>
        <Textarea {...form.register("companyBio")} placeholder="Brief description of your company" />
      </div>
    </div>
  );

  const Step3 = (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Review your information</h3>
      {/* Debug: Show form errors if any */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Please fix the following errors:</p>
          <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside">
            {Object.entries(form.formState.errors).map(([key, error]: [string, any]) => (
              <li key={key}>{key}: {error?.message || 'Invalid'}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Email</Label>
          <div className="mt-1">{form.getValues("email")}</div>
        </div>
        <div>
          <Label>Name</Label>
          <div className="mt-1">{form.getValues("firstName")} {form.getValues("lastName")}</div>
        </div>
        <div>
          <Label>User type</Label>
          <div className="mt-1">{mapUserType(form.getValues("userType"))}</div>
        </div>
        {form.getValues("userType") === 'Professional' ? (
          <>
            <div>
              <Label>Location</Label>
              <div className="mt-1">{form.getValues("location") || '—'}</div>
            </div>
            <div>
              <Label>Title</Label>
              <div className="mt-1">{form.getValues("title") || '—'}</div>
            </div>
            <div>
              <Label>Skills</Label>
              <div className="mt-1">{form.getValues("skills") || '—'}</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Company Name</Label>
              <div className="mt-1">{form.getValues("companyName") || '—'}</div>
            </div>
            <div>
              <Label>Location</Label>
              <div className="mt-1">{form.getValues("location") || '—'}</div>
            </div>
            <div>
              <Label>Telephone Number</Label>
              <div className="mt-1">{form.getValues("telephoneNumber") || '—'}</div>
            </div>
            <div>
              <Label>Company Website</Label>
              <div className="mt-1">{form.getValues("companyWebsite") || '—'}</div>
            </div>
          </>
        )}
      </div>

      <div className="text-sm text-muted-foreground mt-2">
        {t("signup.reviewCta")}
      </div>
    </div>
  );

  const steps = [Step0, Step1, form.watch("userType") === 'Professional' ? Step2Employee : Step2Employer, Step3];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24 }} 
        className="relative z-10 w-full max-w-4xl mx-auto"
      >
        {infoMessage && (
          <div className="mb-4 text-center text-green-600 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-900/50 p-3 rounded-xl">{infoMessage}</div>
        )}
  <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="hidden lg:flex lg:w-1/3 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-10">
              <div className="text-center text-white max-w-xs">
                <h2 className="text-2xl font-extrabold mb-2">{t("signup.join")}</h2>
                <p className="text-sm opacity-90">{t("signup.subhead")}</p>
                <div className="mt-6 text-xs opacity-75">Step {step + 1} of 4</div>
              </div>
            </div>

            <div className="w-full lg:w-2/3 p-8 sm:p-10">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-2xl font-bold">{t("signup.title")}</CardTitle>
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {steps[step]}
                </form>
              </Form>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  {step > 0 && <Button variant="outline" onClick={back}>{t("common.back")}</Button>}
                </div>

                <div className="flex items-center gap-3">
                  {step < 3 && (
                    <Button type="button" onClick={next}>
                      {t("signup.continue")}
                    </Button>
                  )}
                  {step === 3 && (
                    <Button 
                      type="button" 
                      onClick={async () => {
                        // Trigger validation for all fields
                        const isValid = await form.trigger();
                        if (isValid && !emailError) {
                          form.handleSubmit(onSubmit)();
                        } else {
                          // Show errors to user - they're already displayed in Step3
                          console.log('Form validation errors:', form.formState.errors);
                        }
                      }} 
                      disabled={loading || emailError !== null}
                    >
                      {loading ? t("signup.creating") : t("signup.createAccount")}
                    </Button>
                  )}
                    
                </div>
              </div>

              <CardFooter className="pt-4 px-0">
                <div className="text-sm text-center w-full">
                  {t("signup.alreadyHaveAccount")}{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    {t("common.signIn")}
                  </Link>
                </div>
              </CardFooter>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
