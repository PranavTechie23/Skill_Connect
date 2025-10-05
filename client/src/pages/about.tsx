import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Briefcase, Globe, Heart, Mail, Phone, MapPin } from "lucide-react";

const AboutUs = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const [chooseOpen, setChooseOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-4">
            About SkillConnect
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Connecting  talent with perfect opportunities, building stronger communities through skills-based matching.
          </p>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {[
            { icon: Users, title: "Global Focus", description: "We prioritize connecting talent within skill networks." },
            { icon: Briefcase, title: "Skills-Based", description: "Our matching algorithm focuses on skills, not just keywords." },
            { icon: Globe, title: "Community Building", description: "Strengthening local economies through job creation." },
            { icon: Heart, title: "Inclusive Platform", description: "Opportunities for all skill levels and backgrounds." },
          ].map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <item.icon className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p>{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="rounded-lg shadow-xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
          <p className="text-lg mb-6">
            At SkillConnect, we're on a mission to revolutionize the way local communities connect talent with opportunities. We believe that by focusing on skills and local connections, we can create a more inclusive, efficient, and thriving job market for everyone.
          </p>
          <p className="text-lg">
            Our platform is designed to empower both job seekers and employers, providing them with the tools and insights they need to make meaningful connections and drive their success forward.
          </p>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl mb-8">
            Whether you're looking for your next opportunity or searching for the perfect candidate, SkillConnect is here to help you succeed.
          </p>
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setChooseOpen(true)}
          >
            Get Started
          </Button>
        </motion.section>

        {/* Choose modal */}
        {chooseOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            aria-modal="true"
            role="dialog"
            onClick={() => setChooseOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

            <div
              className="relative z-10 w-full max-w-4xl md:max-w-5xl lg:max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700 transition-colors duration-200"
              onClick={(e) => e.stopPropagation()}
              aria-labelledby="choose-login-title"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 id="choose-login-title" className="text-2xl font-semibold">
                  Choose Login Type
                </h3>
                <button
                  aria-label="Close"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  onClick={() => setChooseOpen(false)}
                >
                  ✕
                </button>
              </div>

              <p className="mt-1 text-sm max-w-2xl">
                Select whether you are an employee or an employer to continue to the appropriate login. You can switch modes any time.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/login?type=employee" className="block">
                  <div className="h-full flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 hover:shadow-lg transition-shadow">
                    <div>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white mb-4">
                        <Users className="w-5 h-5" />
                      </div>
                      <h4 className="text-lg font-semibold">Employee Login</h4>
                      <p className="text-sm mt-2">
                        Find jobs, apply, and manage your profile. Ideal for professionals seeking opportunities.
                      </p>
                    </div>
                    <div className="mt-6">
                      <Link to="/login?type=employee" className="w-full inline-flex justify-center items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-center">
                        Continue as Employee
                      </Link>
                    </div>
                  </div>
                </Link>

                <Link to="/login?type=employer" className="block">
                  <div className="h-full flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 hover:shadow-lg transition-shadow">
                    <div>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white mb-4">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h4 className="text-lg font-semibold">Employer Login</h4>
                      <p className="text-sm mt-2">
                        Post jobs, review candidates, and hire faster. Designed for businesses and recruiters.
                      </p>
                    </div>
                    <div className="mt-6">
                      <Link to="/login?type=employer" className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-center">
                        Continue as Employer
                      </Link>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Mail className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email</h3>
                <p>info@skillconnect.com</p>
                <p>support@skillconnect.com</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Phone className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Phone</h3>
                <p>+91 8830203469</p>
                <p>Mon-Fri, 9am-5pm IST</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MapPin className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Address</h3>
                <p>Pune Institute of Computer Technology, Dhankavadi,Pune-411043</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AboutUs;