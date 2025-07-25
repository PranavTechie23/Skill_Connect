import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin } from "lucide-react";

interface JobSearchProps {
  onSearch: (filters: {
    search: string;
    location: string;
    jobType: string;
  }) => void;
  className?: string;
}

export default function JobSearch({ onSearch, className = "" }: JobSearchProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [jobType, setJobType] = useState("All Jobs");

  const handleSearch = () => {
    onSearch({
      search,
      location: location === "All Locations" ? "" : location,
      jobType: jobType === "All Jobs" ? "" : jobType,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title or Skills
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="e.g., Web Developer, Marketing"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="pl-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Locations">All Locations</SelectItem>
                  <SelectItem value="Downtown District">Downtown District</SelectItem>
                  <SelectItem value="North District">North District</SelectItem>
                  <SelectItem value="South Hills">South Hills</SelectItem>
                  <SelectItem value="East Valley">East Valley</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &nbsp;
            </label>
            <Button onClick={handleSearch} className="w-full">
              Search Jobs
            </Button>
          </div>
        </div>
        
        {/* Job Type Filters */}
        <div className="flex flex-wrap gap-3 mt-6">
          {["All Jobs", "Full-time", "Part-time", "Remote", "Contract"].map((type) => (
            <Button
              key={type}
              variant={jobType === type ? "default" : "outline"}
              onClick={() => setJobType(type)}
              className="rounded-full"
              size="sm"
            >
              {type}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
