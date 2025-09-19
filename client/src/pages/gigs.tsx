// client/src/pages/gigs.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Gigs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Sample gig data - replace with your actual data fetching
  const gigs = [
    {
      id: 1,
      title: "Social Media Manager",
      client: "Tech Startup XYZ",
      budget: "$500 - $1000",
      duration: "3 months",
      skills: ["Social Media", "Content Creation", "Analytics"],
      status: "open"
    },
    {
      id: 2,
      title: "UI/UX Designer",
      client: "E-commerce Company",
      budget: "$1000 - $2000",
      duration: "2 months",
      skills: ["Figma", "UI Design", "User Research"],
      status: "open"
    },
    {
      id: 3,
      title: "Content Writer",
      client: "Marketing Agency",
      budget: "$300 - $600",
      duration: "1 month",
      skills: ["Copywriting", "SEO", "Blogging"],
      status: "open"
    }
  ];

  const filteredGigs = gigs.filter(gig => 
    gig.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filter === "all" || gig.status === filter)
  );

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Freelance Gigs</h1>
        <p className="text-muted-foreground mt-2">
          Browse and apply for freelance opportunities
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search gigs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto border rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Gigs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGigs.map((gig) => (
          <Card key={gig.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">{gig.title}</CardTitle>
                <Badge variant={gig.status === "open" ? "default" : "secondary"}>
                  {gig.status}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                Posted by {gig.client}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{gig.budget}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{gig.duration}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {gig.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <div className="px-4 pb-4">
              <Button className="w-full" size="sm">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredGigs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No gigs found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button variant="outline">Clear Filters</Button>
        </div>
      )}
    </div>
  );
}