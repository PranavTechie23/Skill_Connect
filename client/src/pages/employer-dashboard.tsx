import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserResponse {
  user?: {
    role?: string;
    userType?: string;
    companyName?: string;
    firstName?: string;
  };
}

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserResponse['user']>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchProfile = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me") as UserResponse;
        const userData = res?.user ?? {};
        
        if (!mounted) return;
        
        if (!userData) {
          toast({ title: "Not authenticated", description: "Please sign in.", variant: "destructive" });
          navigate("/login?type=employer");
          return;
        }

        const role = (userData?.role || userData?.userType || "").toLowerCase();
        if (role && !role.includes("employ")) {
          toast({ title: "Access denied", description: "Professional accounts should use employee dashboard.", variant: "destructive" });
          navigate("/employee");
          return;
        }

        setProfile(userData);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Unable to fetch profile", variant: "destructive" });
        navigate("/login?type=employer");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => { mounted = false; };
  }, [navigate, toast]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-4">
            Employer Console — {profile?.companyName || profile?.firstName || "Employer"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Post a Job</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Create a new job listing to reach qualified local talent.</p>
                <div className="mt-4">
                  <Button onClick={() => navigate("/jobs/new")}>Create Job</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Manage Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">View and edit your active job postings and see applicants.</p>
                <div className="mt-4">
                  <Button onClick={() => navigate("/jobs")}>View Jobs</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Shortlist, message, and schedule interviews directly.</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}