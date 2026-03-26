import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { normalizeUserType } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";


export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const auth = useAuth();
  const user = auth.user;
  const { t } = useLanguage();

  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    console.log("=== Login useEffect triggered ===");
    console.log("User object:", user);
    
    if (user) {
      // Handle both snake_case (user_type) and camelCase (userType) from backend
      const userType = (user as any).userType || (user as any).user_type;
      console.log("User type from backend:", userType);
      const normalized = normalizeUserType(userType || "");
      console.log("Normalized user type:", normalized);
      
      // Map normalized types to routes
      let target = "/";
      
      if (normalized === "admin") {
        target = "/admin";
      } else if (normalized === "professional") {
        target = "/employee/dashboard";
      } else if (normalized === "employer") {
        target = "/employer/dashboard";
      }
      
      console.log("Redirecting to:", target);
      
      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 100);
    }
  }, [user, navigate]);

  function handleClose() {
    setOpen(false);
    navigate("/");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("=== Starting login ===");
      const loggedInUser = await auth.login(form.email, form.password);
      
      console.log("Login response user:", loggedInUser);
      console.log("Login response userType:", loggedInUser?.userType);
      
      toast({ 
        title: "Success", 
        description: "Logged in successfully", 
        variant: 'success' as any 
      });
      
      // The useEffect hook will handle redirection once the user state is updated
    } catch (err: any) {
      console.error("Login error:", err);
      toast({ 
        title: "Error", 
        description: err?.message || "Invalid credentials", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.28 }} className="relative z-10 w-full max-w-3xl mx-auto">
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-10">
              <div className="text-center text-white max-w-xs">
                <h2 className="text-3xl font-extrabold mb-2">{t("login.welcomeBack")}</h2>
                <p className="text-sm opacity-90">{t("login.welcomeBackSub")}</p>
              </div>
            </div>

            <div className="w-full lg:w-1/2 p-8 sm:p-10">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Access your personalized dashboard</p>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Enter your email" />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} required placeholder="Enter your password" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("login.signingIn") : t("login.signIn")}
                </Button>
              </form>

              <div className="text-sm text-center mt-4">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  {t("login.createAccount")}
                </Link>
              </div>

              <CardFooter className="pt-4 px-0">
                <div className="flex justify-end">
                  <button onClick={handleClose} className="text-sm text-muted-foreground hover:underline">
                    {t("common.close")}
                  </button>
                </div>
              </CardFooter>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}