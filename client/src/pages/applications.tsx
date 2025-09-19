import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function Applications() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/applications", { applicantId: user?.id, statusFilter }],
    enabled: !!user?.id && user?.userType === "job_seeker",
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set("applicantId", user.id);
      const res = await fetch(`/api/applications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });

  const filteredApplications = applications.filter((app: any) =>
    statusFilter === "all" ? true : app.status === statusFilter
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Applications</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: "all", label: "All Applications" },
          { key: "applied", label: "Applied" },
          { key: "under_review", label: "Under Review" },
          { key: "interview", label: "Interview" },
          { key: "offered", label: "Offered" },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            className="rounded-lg"
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8">Loading applications...</CardContent>
        </Card>
      ) : filteredApplications && filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application: any) => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.job?.title || "Job"}
                    </h3>
                    <p className="text-sm text-gray-600">{application.company?.name || application.job?.location}</p>
                  </div>
                  <Badge className="capitalize">{String(application.status || "applied").replace("_", " ")}</Badge>
                </div>
                {application.job?.description && (
                  <p className="text-gray-700 text-sm mt-3 line-clamp-2">{application.job.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Start applying to jobs to track your applications here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}