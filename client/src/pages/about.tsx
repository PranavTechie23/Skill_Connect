
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Briefcase, Globe, Heart, Mail, Phone, MapPin } from "lucide-react";

const AboutUs = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            About SkillConnect
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                <item.icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="bg-white rounded-lg shadow-xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-6">
            At SkillConnect, we're on a mission to revolutionize the way local communities connect talent with opportunities. We believe that by focusing on skills and local connections, we can create a more inclusive, efficient, and thriving job market for everyone.
          </p>
          <p className="text-lg text-gray-700">
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
          <p className="text-xl text-gray-600 mb-8">
            Whether you're looking for your next opportunity or searching for the perfect candidate, SkillConnect is here to help you succeed.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Get Started
            </Button>
          </Link>
        </motion.section>

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
                <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email</h3>
                <p className="text-gray-600">info@skillconnect.com</p>
                <p className="text-gray-600">support@skillconnect.com</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Phone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Phone</h3>
                <p className="text-gray-600">+91 8830203469</p>
                <p className="text-gray-600">Mon-Fri, 9am-5pm IST</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Address</h3>
                <p className="text-gray-600">Pune Institute of Computer Technology, Dhankavadi,Pune-411043</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AboutUs;
