import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ChartLine, Target, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Connect Local Talent with{" "}
                <span className="text-primary">Perfect Opportunities</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Skills-based matching that brings together local job seekers and employers. 
                Build your professional network and discover opportunities in your community.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/jobs">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Find Your Next Role
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                    Post a Job
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="text-secondary mr-2 h-5 w-5" />
                  <span>100% Local Focus</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-secondary mr-2 h-5 w-5" />
                  <span>Skills-Based Matching</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-secondary mr-2 h-5 w-5" />
                  <span>Free to Join</span>
                </div>
              </div>
            </div>
            <div className="lg:pl-8">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Diverse professionals collaborating" 
                className="rounded-2xl shadow-2xl w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Skills-Based Matching Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Skills-Based Matching That Actually Works
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our intelligent matching algorithm connects you with opportunities based on your actual skills, 
                not just keywords. Build a comprehensive skills profile and let employers find you.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                    <ChartLine className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Assessment Tools</h3>
                    <p className="text-gray-600">Take quick assessments to validate your skills and stand out to employers.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-4">
                    <Target className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligent Recommendations</h3>
                    <p className="text-gray-600">Get personalized job recommendations based on your skill profile and preferences.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-4">
                    <GraduationCap className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Development Paths</h3>
                    <p className="text-gray-600">Discover what skills to learn next to advance your career in your chosen field.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional working on skill development" 
                className="rounded-2xl shadow-xl w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Employers Section */}
      <section className="py-16 gradient-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">For Employers & Companies</h2>
            <p className="text-xl text-gray-600">Find skilled local talent and build stronger community connections</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Local business owners in meeting" 
                className="rounded-2xl shadow-xl w-full h-auto" 
              />
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Simple Job Posting Workflow</h3>
                <p className="text-gray-600 mb-6">Post jobs in minutes with our streamlined process designed for local businesses.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <span className="text-gray-700">Create your company profile</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <span className="text-gray-700">Post job with skill requirements</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <span className="text-gray-700">Review matched candidates</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <span className="text-gray-700">Connect with top talent</span>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Ready to hire local talent?</h4>
                  <div className="space-y-4">
                    <Link href="/register">
                      <Button className="w-full">
                        Post Your First Job
                      </Button>
                    </Link>
                    <Link href="/jobs">
                      <Button variant="outline" className="w-full">
                        Browse Talent Profiles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">LocalSkills</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Connecting local talent with perfect opportunities through skills-based matching. 
                Build your community, grow your career.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                <li><Link href="/profile" className="hover:text-white">Create Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/employers" className="hover:text-white">Post Jobs</Link></li>
                <li><Link href="/jobs" className="hover:text-white">Browse Talent</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 LocalSkills. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
