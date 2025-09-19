import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";

type Pro = {
  name: string;
  role: string;
  img: string;
  rating: number;
};

const professionals: Pro[] = [
  { name: "John Doe", role: "Plumber", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&h=800&q=80", rating: 4.8 },
  { name: "Aarti Verma", role: "Electrician", img: "https://images.unsplash.com/photo-1581091215367-59ab6dcef1b8?auto=format&fit=crop&w=800&h=800&q=80", rating: 4.9 },
  { name: "Ravi Kumar", role: "Carpenter", img: "https://images.unsplash.com/photo-1523419409543-8a3f7a3d7a58?auto=format&fit=crop&w=800&h=800&q=80", rating: 4.7 },
  { name: "Neha Singh", role: "Designer", img: "https://images.unsplash.com/photo-1555371363-5a53d59927e8?auto=format&fit=crop&w=800&h=800&q=80", rating: 4.9 },
];
const fallbackImg = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&h=800&q=80";

export default function ProfessionalsPage() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const categories = ["Plumber", "Electrician", "Carpenter", "Designer"];

  // Filter professionals based on search and category
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return professionals.filter(p => {
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.role.toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.role === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="pb-16 bg-gray-50 min-h-screen">
      {/* Simple Header */}
      <div className="pt-16 pb-8">
        <h1 className="text-center text-3xl font-semibold text-gray-900">
          Find Professionals
        </h1>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <Card className="p-4 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Search by name or skill..." 
                value={search} 
                onChange={(e) => { 
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
            <div className="sm:w-[200px]">
              <Select 
                value={category} 
                onValueChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          // Loading state
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white shadow-sm">
                <CardContent className="p-4 animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                      <div className="h-8 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          // Results grid
          <>
            <p className="text-gray-600 mb-4">
              Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} professionals
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {current.map((pro) => (
                <Card key={pro.name} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={pro.img}
                          alt={pro.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { 
                            (e.currentTarget as HTMLImageElement).src = fallbackImg;
                            (e.currentTarget as HTMLImageElement).onerror = null; // Prevent infinite loop
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {pro.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{pro.role}</p>
                        <div className="flex items-center mb-4">
                          <span className="text-amber-500">★</span>
                          <span className="ml-1 text-sm font-medium text-gray-700">
                            {pro.rating.toFixed(1)}
                          </span>
                        </div>
                        <Button 
                          className="w-full" 
                          size="sm"
                          variant="outline"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          // No results
          <Card className="bg-white text-center py-8">
            <CardContent>
              <p className="text-gray-600">No professionals found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-10 flex items-center justify-center gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
      </div>
    </section>
  );
}


