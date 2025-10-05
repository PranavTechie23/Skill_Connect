import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        interface UserData {
          role?: string;
          userType?: string;
          firstName?: string;
          name?: string;
          location?: string;
        }
        interface AuthResponse {
          user?: UserData;
        }
        const res = await apiRequest("GET", "/api/auth/me") as AuthResponse | UserData;
        const user: UserData = ('user' in res && res.user) ? res.user : res as UserData;
        if (!mounted) return;
        if (!user) {
          toast({ title: "Not authenticated", description: "Please sign in.", variant: "destructive" });
          navigate("/login?type=employee");
          return;
        }
        const role = (user.role || user.userType || "").toLowerCase();
        if (role && role.includes("employ")) {
          toast({ title: "Access denied", description: "Employer accounts should use employer dashboard.", variant: "destructive" });
          navigate("/employer");
          return;
        }
        setProfile(user);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Unable to fetch profile", variant: "destructive" });
        navigate("/login?type=employee");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigate, toast]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-4">Welcome, {profile?.firstName || profile?.name || "Professional"}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium mb-2">{profile?.role || profile?.userType}</div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{profile?.location || "Not set"}</div>
                <div className="mt-4">
                  <Button onClick={() => navigate("/profile")}>Edit Profile</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">See your applied jobs, manage submissions and messages.</p>
                <div className="mt-4">
                  <Button onClick={() => navigate("/jobs")}>Browse Jobs</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Saved Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Your saved job listings will appear here.</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}