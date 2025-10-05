import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Users, Briefcase, Globe, Heart, Mail, Phone, MapPin } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, index }: { icon: React.ElementType, title: string, description: string, index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.1 }}
    >
        <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
                <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    </motion.div>
);

const ContactCard = ({ icon: Icon, title, children, index }: { icon: React.ElementType, title: string, children: React.ReactNode, index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 + index * 0.1 }}
    >
        <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
                <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
                <div className="text-muted-foreground">{children}</div>
            </CardContent>
        </Card>
    </motion.div>
);

const AboutUs = () => {
  const [chooseOpen, setChooseOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-blue-800 dark:text-blue-400 mb-4">
            About SkillConnect
          </h1>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
            Connecting talent with perfect opportunities, building stronger communities through skills-based matching.
          </p>
        </motion.section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { icon: Users, title: "Global Focus", description: "We prioritize connecting talent within skill networks." },
            { icon: Briefcase, title: "Skills-Based", description: "Our matching algorithm focuses on skills, not just keywords." },
            { icon: Globe, title: "Community Building", description: "Strengthening local economies through job creation." },
            { icon: Heart, title: "Inclusive Platform", description: "Opportunities for all skill levels and backgrounds." },
          ].map((item, index) => (
            <FeatureCard key={index} {...item} index={index} />
          ))}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-lg bg-card border border-border shadow-lg p-8 md:p-12 mb-20"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-foreground">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-6 text-center max-w-4xl mx-auto">
            At SkillConnect, we're on a mission to revolutionize the way local communities connect talent with opportunities. We believe that by focusing on skills and local connections, we can create a more inclusive, efficient, and thriving job market for everyone.
          </p>
          <p className="text-lg text-muted-foreground text-center max-w-4xl mx-auto">
            Our platform is designed to empower both job seekers and employers, providing them with the tools and insights they need to make meaningful connections and drive their success forward.
          </p>
        </motion.section>

        <Dialog open={chooseOpen} onOpenChange={setChooseOpen}>
            <DialogTrigger asChild>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-center"
                >
                    <h2 className="text-3xl font-bold mb-6 text-foreground">Join Our Community</h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Whether you're looking for your next opportunity or searching for the perfect candidate, SkillConnect is here to help you succeed.
                    </p>
                    <Button size="lg">Get Started</Button>
                </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Choose Your Path</DialogTitle>
                    <DialogDescription>
                        Select whether you are looking for a job or hiring to get started.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <Link to="/login?type=employee" className="block" onClick={() => setChooseOpen(false)}>
                        <Card className="h-full text-center hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <Users className="w-10 h-10 text-primary mx-auto mb-2" />
                                <CardTitle>I'm a Professional</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">Find jobs, apply, and manage your profile.</p>
                                <Button className="w-full">Continue as Professional</Button>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link to="/login?type=employer" className="block" onClick={() => setChooseOpen(false)}>
                        <Card className="h-full text-center hover:bg-muted/50 transition-colors">
                            <CardHeader>
                                <Briefcase className="w-10 h-10 text-primary mx-auto mb-2" />
                                <CardTitle>I'm an Employer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">Post jobs, find candidates, and hire.</p>
                                <Button variant="secondary" className="w-full">Continue as Employer</Button>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>

        <section className="mt-20">
          <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ContactCard icon={Mail} title="Email" index={0}>
                <a href="mailto:info@skillconnect.com" className="hover:text-primary">info@skillconnect.com</a>
                <br />
                <a href="mailto:support@skillconnect.com" className="hover:text-primary">support@skillconnect.com</a>
            </ContactCard>
            <ContactCard icon={Phone} title="Phone" index={1}>
                <a href="tel:+918830203469" className="hover:text-primary">+91 8830203469</a>
                <p>Mon-Fri, 9am-5pm IST</p>
            </ContactCard>
            <ContactCard icon={MapPin} title="Address" index={2}>
                <p>Pune Institute of Computer Technology, Dhankavadi, Pune-411043</p>
            </ContactCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
