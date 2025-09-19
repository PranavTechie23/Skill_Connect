
import { Link } from "wouter";
import TextType from "@/components/TextType";
import Hyperspeed from "@/components/Hyperspeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ChartLine, Target, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChromaGrid, { ChromaItem } from "@/components/ChromaGrid";
import { motion } from "framer-motion";

// Add a new component for the feature items
const FeatureItem = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center">
    <Icon className="text-secondary mr-2 h-5 w-5" />
    <span>{text}</span>
  </div>
);

export default function Home() {
  const [booking, setBooking] = useState<{ name: string; role: string } | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", date: "" });
  const { toast } = useToast();
  const workers = [
    { name: 'Axar Patel', role: 'Building worker', img: '/images/building_worker.jpg', rating: 4.2 },
    { name: 'Abhishek Sharma', role: 'Carpenter', img: '/images/carpenter.jpg', rating: 4.0 },
    { name: 'Taylor Swift', role: 'Mechanical Engineer', img: '/images/mechanic.jpeg', rating: 5.0 },
    { name: 'Elizabeth', role: 'Farmer', img: '/images/farmer.jpg', rating: 4.5 },
  ];

  const [motivationalQuote, setMotivationalQuote] = useState({
    text: "Your skills can open new doors—start today!",
    author: "LocalSkills Team",
  });

  const quotes = [
    { text: "Your skills can open new doors—start today!", author: "SkillConnect Team" },
    { text: "Every step forward builds your future—keep going!", author: "SkillConnect Community" },
    { text: "Success begins with the courage to try—believe in yourself!", author: "SkillConnect Inspiration" },
    { text: "Turn your passion into progress with every opportunity!", author: "SkillConnect Mentor" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setMotivationalQuote(quotes[randomIndex]);
    }, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  async function submitBooking() {
    const who = booking?.name || "Professional";
    const role = booking?.role || "Service";
    const content = `Booking request for ${who} (${role})\nName: ${form.fullName}\nPhone: ${form.phone}\nDate: ${form.date}`;
    try {
      await apiRequest("POST", "/api/messages", { content });
      toast({ title: "Request sent", description: "We will contact you shortly." });
      setForm({ fullName: "", phone: "", date: "" });
      setBooking(null);
    } catch (e: any) {
      toast({ title: "Failed to send", description: e?.message || "Please try again.", variant: "destructive" });
    }
  }

  const chromaItems: ChromaItem[] = workers.map(worker => ({
    image: worker.img,
    title: worker.name,
    subtitle: worker.role,
   // location: `Role: ${worker.role}`,
    borderColor: '#ffffffff',
    gradient: 'linear-gradient(145deg, #0000ffff, #000000ff)',
    url: 'https://www.linkedin.com',
    rating: worker.rating,
  }));

  // Animation variants for framer-motion
  const sectionVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const alternateSectionVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  // Video state and ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      video.play().catch((error) => {
        console.error("Video autoplay failed:", error);
      });
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const restartVideo = () => {
        video.currentTime = 0;
        video.play().catch((error) => {
          console.error("Video restart failed:", error);
        });
      };
      const interval = setInterval(restartVideo, 30000); // Restart every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video load error:", e);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 py-16 lg:py-24 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="absolute inset-0 hero-animated-bg z-0"></div>
        <div className="pointer-events-none absolute inset-0 mesh-hero-overlay opacity-70 z-0"></div>
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-20 z-0"></div>
        <div className="absolute inset-0 z-10">
          <Hyperspeed />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                <TextType
                  as="span"
                  className="align-middle"
                  text={["Connect Talent with Perfect Opportunities"]}
                  typingSpeed={105}
                  pauseDuration={5500}
                  showCursor={true}
                  cursorCharacter="|"
                />
              </h1>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-white/90 leading-relaxed">
                Skills-based matching that brings together job seekers and employers.
                Build your professional network and discover opportunities in your community.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/jobs">
                  <Button size="lg" className="text-lg px-6 sm:px-8 py-3 sm:py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    🚀 Find Your Next Role
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="text-lg px-6 sm:px-8 py-3 sm:py-4 border-white text-white hover:bg-white hover:text-purple-600 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                    ✨ Post a Job
                  </Button>
                </Link>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center sm:justify-start space-x-4 sm:space-x-8 text-sm sm:text-base text-white/90">
                <FeatureItem icon={CheckCircle} text="100% Local Focus" />
                <FeatureItem icon={CheckCircle} text="Skills-Based Matching" />
                <FeatureItem icon={CheckCircle} text="Free to Join" />
              </div>
            </div>
            <div className="lg:pl-8 mt-6 lg:mt-0 flex justify-center">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[9/16] w-full max-w-xs lg:max-w-md">
                <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-2xl sm:rounded-3xl blur opacity-75 animate-pulse z-10"></div>
                <video
                  ref={videoRef}
                  className="relative rounded-2xl sm:rounded-3xl shadow-2xl w-full h-full border-4 border-white object-cover z-20"
                  muted
                  loop
                  playsInline
                  autoPlay
                  onError={handleVideoError}
                  preload="auto"
                  poster="/images/tea_vendor.jpg"
                  key={Date.now()}
                >
                  <source src={`/images/Chai_making_video.mp4?v=${Date.now()}`} type="video/mp4" />
                  <div className="text-white text-center p-4">
                    Video not supported? <a href="/images/Chai_making_video.mp4" className="underline">Download here</a>
                  </div>
                </video>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-4 right-4 z-30 bg-white/80 hover:bg-white text-purple-600 px-3 py-1 rounded-full shadow-md transition-colors text-sm"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Services Grid */}
      <motion.section
        className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={alternateSectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Services for Every Need
            </h2>
            <p className="mt-2 sm:mt-3 text-gray-700 text-base sm:text-lg">From skilled trades to creative work — discover opportunities tailored to your skills.</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: '🏗 Construction & Repair', desc: 'Masons, carpenters, electricians, plumbers, and more.', color: 'from-red-400 via-pink-500 to-purple-500', icon: '🔨' },
              { title: '🌾 Farming & Agriculture', desc: 'Seasonal help, harvesting, equipment operations.', color: 'from-green-400 via-emerald-500 to-teal-500', icon: '🚜' },
              { title: '🎨 Art & Design', desc: 'Graphic design, video editing, content creation.', color: 'from-yellow-400 via-orange-500 to-red-500', icon: '✨' },
              { title: '🛍 Retail & Services', desc: 'Store staff, delivery, customer support, cashiers.', color: 'from-blue-400 via-indigo-500 to-purple-500', icon: '💼' },
              { title: '📚 Education & Tutoring', desc: 'Tutors, coaching, language training.', color: 'from-pink-400 via-rose-500 to-red-500', icon: '🎓' },
              { title: '💻 Technology & Web', desc: 'Websites, apps, digital marketing, data entry.', color: 'from-indigo-400 via-purple-500 to-pink-500', icon: '🚀' },
            ].map((s, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <div className={`h-2 w-full bg-gradient-to-r ${s.color}`}></div>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{s.icon}</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">{s.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Skills-Based Matching Section */}
      <motion.section
        className="py-12 sm:py-16 lg:py-16 bg-gradient-to-r from-green-100 via-blue-100 to-purple-100"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4 sm:mb-6">
                🎯 Skills-Based Matching That Actually Works
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 mb-4 sm:mb-8">
                Our intelligent matching algorithm connects you with opportunities based on your actual skills,
                not just keywords. Build a comprehensive skills profile and let employers find you.
              </p>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start p-3 sm:p-4 bg-white/60 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all">
                  <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2 sm:mr-4 shadow-lg">
                    <ChartLine className="text-white h-4 sm:h-5 w-4 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Skill Assessment Tools</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Take quick assessments to validate your skills and stand out to employers.</p>
                  </div>
                </div>
                <div className="flex items-start p-3 sm:p-4 bg-white/60 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all">
                  <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-4 shadow-lg">
                    <Target className="text-white h-4 sm:h-5 w-4 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Intelligent Recommendations</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Get personalized job recommendations based on your skill profile and preferences.</p>
                  </div>
                </div>
                <div className="flex items-start p-3 sm:p-4 bg-white/60 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all">
                  <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-2 sm:mr-4 shadow-lg">
                    <GraduationCap className="text-white h-4 sm:h-5 w-4 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Skill Development Paths</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Discover what skills to learn next to advance your career in your chosen field.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:pl-8 mt-6 lg:mt-0">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
                <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-2xl sm:rounded-3xl blur opacity-75 animate-pulse"></div>
                <img
                  src="/images/building_worker.jpg"
                  alt="Building worker demonstrating skills"
                  className="relative rounded-2xl sm:rounded-3xl shadow-xl w-full h-auto border-4 border-white"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        className="py-12 sm:py-16 lg:py-16 bg-gradient-to-br from-pink-50 via-rose-50 to-red-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={alternateSectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
              💬 Stories from Our Community
            </h2>
            <p className="mt-2 sm:mt-3 text-gray-700 text-base sm:text-lg">Real results from local employers and talent.</p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-3">
            {[
              {
                quote: 'Hired two skilled technicians within a week — the matching is on point!',
                name: 'Aarti Verma',
                role: 'Owner, A1 Appliances',
                emoji: '🎉'
              },
              {
                quote: 'Found steady work in my town without endless calls. Super simple.',
                name: 'Ravi Kumar',
                role: 'Electrician',
                emoji: '⚡'
              },
              {
                quote: 'As a designer, I loved how my skills were highlighted to employers.',
                name: 'Neha Singh',
                role: 'Graphic Designer',
                emoji: '✨'
              },
            ].map((t, i) => (
              <Card key={i} className="h-full hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">{t.emoji}</div>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">" {t.quote} "</p>
                  <div className="mt-4 sm:mt-6">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Bold CTA */}
      <motion.section
        className="py-12 sm:py-16 lg:py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-center shadow-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight">Build Your Future Locally</h2>
            <p className="mt-2 sm:mt-4 text-base sm:text-lg text-white/90 max-w-md sm:max-w-2xl mx-auto">Join a growing network of local talent and employers. Post jobs, apply with confidence, and get matched by skills — not just keywords.</p>
            <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"><Button size="lg" variant="secondary" className="px-4 sm:px-8 py-2 sm:py-3">Get Started</Button></Link>
              <Link href="/jobs"><Button size="lg" variant="outline" className="px-4 sm:px-8 py-2 sm:py-3 bg-white/10 text-white hover:bg-white/20">Browse Jobs</Button></Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Local Professionals Section */}
      <motion.section
        className="py-12 sm:py-16 lg:py-20 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={alternateSectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">Trusted Skilled Professionals</h2>
            <p className="mt-2 sm:mt-3 text-gray-600 text-base sm:text-lg">Book top-rated, verified workers in your area</p>
          </div>
          <div className="flex justify-center">
  <ChromaGrid 
    items={chromaItems} 
    className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl" 
  />
</div>
        </div>
      </motion.section>

      {/* For Employers Section */}
      <motion.section
        className="py-12 sm:py-16 lg:py-16 bg-gradient-to-br from-green-50 to-blue-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">For Employers & Companies</h2>
            <p className="text-base sm:text-xl text-gray-600">Find skilled local talent and build stronger community connections</p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white py-12 sm:py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={alternateSectionVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">SkillConnect</h3>
              <p className="text-gray-300 mb-4 sm:mb-6 max-w-xs mx-auto text-sm sm:text-base">
                Connecting talent with perfect opportunities through skills-based matching.
                Build your community, grow your career.
              </p>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                <li><Link href="/profile" className="hover:text-white">Create Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="/employers" className="hover:text-white">Post Jobs</Link></li>
                <li><Link href="/jobs" className="hover:text-white">Browse Talent</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 sm:mt-12 flex flex-col sm:flex-row justify-between items-center text-sm sm:text-base text-gray-400">
            <p className="mb-4 sm:mb-0">
              © {new Date().getFullYear()} SkillConnect. All rights reserved.
            </p>
            <div className="flex space-x-4 sm:space-x-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
          {/* Motivational Quote Card */}
          <motion.div
            className="mt-6 sm:mt-12 flex justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
          >
            <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 max-w-sm sm:max-w-md mx-auto text-center transition-opacity duration-1000">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Motivational Quote</h3>
              <p className="text-gray-300 italic mb-2 sm:mb-4 text-sm sm:text-base">{motivationalQuote.text}</p>
              <p className="text-xs sm:text-sm text-gray-500">- {motivationalQuote.author}</p>
            </div>
          </motion.div>
          {/* Signature Footer */}
          <motion.div
            className="w-full flex justify-center mt-6 sm:mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={alternateSectionVariants}
          >
            <div className="font-extrabold text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg bg-gradient-to-r from-pink-500 via-yellow-400 to-orange-400 text-white flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1 sm:gap-2">
                Made with ❤ and ☕ in India{" "}
                <a
                  href="https://www.linkedin.com/in/pranavoswal23"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-200 transition-colors"
                >
                  
                </a>
              </span>
              <span className="ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3 text-white/90">
                <a
                  href="https://www.linkedin.com/in/pranavoswal23"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="hover:opacity-90 transition-opacity"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0H5C2.8 0 1 1.8 1 4v16c0 2.2 1.8 4 4 4h14c2.2 0 4-1.8 4-4V4c0-2.2-1.8-4-4-4zM8 19H5V9h3v10zM6.5 7.7C5.7 7.7 5 7 5 6.2c0-.8.7-1.5 1.5-1.5S8 5.4 8 6.2 7.3 7.7 6.5 7.7zM20 19h-3v-5.6c0-1.3-.9-1.9-1.7-1.9s-1.8.6-1.8 1.9V19h-3V9h2.9v1.3h.1c.4-.8 1.6-1.6 3-1.6 2 0 3.5 1.3 3.5 3.9V19z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/pranavoswal_23"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:opacity-90 transition-opacity"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.2c3.2 0 3.6.01 4.9.07 1.3.06 2.6.33 3.6 1.3.97.97 1.25 2.24 1.31 3.6.06 1.27.07 1.66.07 4.83s-.01 3.56-.07 4.83c-.06 1.36-.34 2.63-1.31 3.6-.97.97-2.24 1.25-3.6 1.31-1.27.06-1.66.07-4.9.07s-3.63-.01-4.9-.07c-1.36-.06-2.63-.34-3.6-1.31-.97-.97-1.25-2.24-1.31-3.6C2.01 15.56 2 15.17 2 12s.01-3.56.07-4.83c.06-1.36.34-2.63 1.31-3.6.97-.97 2.24-1.25 3.6-1.31C8.37 2.21 8.77 2.2 12 2.2zm0 3.64A6.16 6.16 0 1 0 12 22a6.16 6.16 0 0 0 0-12.16zm7.1-1.68a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
                  </svg>
                </a>
                <a
                  href="https://x.com/PranavOswal23"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="hover:opacity-90 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18 2H6C3.8 2 2 3.8 2 6v12c0 2.2 1.8 4 4 4h12c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4zm-.9 15.5h-2.1l-3.2-4-3.6 4H6.1l4.6-5.1L6.3 6.5h2.1l3 3.7 3.3-3.7h2.1l-4.4 4.9 4.7 6.1z"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/918830203469"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="hover:opacity-90 transition-opacity"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.04 2C6.54 2 2 6.54 2 12.04c0 1.78.46 3.51 1.33 5.05L2 22l4.07-1.27a10.02 10.02 0 0 0 6 1.92c5.5 0 10.04-4.54 10.04-10.04S17.54 2 12.04 2zm5.8 14.76c-.24.69-1.37 1.3-1.95 1.39-.5.08-1.15.11-1.86-.12-.43-.14-1-.32-1.73-.61-3.05-1.19-5.01-4.09-5.16-4.28-.15-.19-1.23-1.64-1.23-3.13s.78-2.2 1.06-2.49c.24-.25.64-.36 1.02-.36.12 0 .22 0 .32.01.28.01.43.04.62.48.24.58.83 2 .9 2.15.07.15.1.33.02.51-.08.18-.12.3-.25.47-.13.17-.27.3-.41.48-.13.18-.28.37-.12.7.16.33.7 1.15 1.5 1.87 1.03.92 1.9 1.2 2.23 1.33.34.13.54.11.74-.06.23-.19.5-.5.63-.68.16-.23.33-.18.55-.1.22.08 1.41.67 1.65.79.24.12.4.18.46.28.06.1.06.58-.18 1.27z"/>
                  </svg>
                </a>
                <a
                  href="https://facebook.com/pranavoswal23"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="hover:opacity-90 transition-opacity"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.5c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5v1.9H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z"/>
                  </svg>
                </a>
              </span>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}