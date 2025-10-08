import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Building, Search, Edit, Trash2, Eye } from "lucide-react";

interface AdminCompany {
  id: string;
  name: string;
  location: string;
  industry: string;
  size: string;
  description: string;
}

export default function CompanyManagement() {
  const { user } = useAuth();

  const { data: companies = [] } = useQuery<AdminCompany[]>({
    queryKey: ["/api/admin/companies"],
    enabled: user?.userType === "admin",
  });

  if (user?.userType !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center space-x-2 mb-8">
        <Building className="h-8 w-8 text-purple-600" />
        <h1 className="text-3xl font-bold">Company Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>Manage registered companies</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search companies..." className="pl-10" />
            </div>
            <Button>Add Company</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No companies found.</p>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.location}</p>
                      </div>
                      <Badge variant="outline">{company.industry}</Badge>
                      <Badge variant="secondary">{company.size}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



