import { useState } from "react";
import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Users, Briefcase, Globe, Heart, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeatureCard = ({ icon: Icon, title, description, index }: { icon: React.ElementType, title: string, description: string, index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
        className="h-full"
    >
        <div className="relative h-full flex flex-col rounded-3xl border border-slate-200/50 dark:border-purple-500/20 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent dark:from-purple-500/10 pointer-events-none" />
            <CardContent className="pt-8 pb-8 px-6 text-center flex flex-col h-full relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">{title}</h3>
                <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">{description}</p>
            </CardContent>
        </div>
    </motion.div>
);

const ContactCard = ({ icon: Icon, title, children, index }: { icon: React.ElementType, title: string, children: React.ReactNode, index: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
    >
        <div className="relative rounded-3xl border border-slate-200/50 dark:border-blue-500/20 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md p-8 text-center transition-all duration-300 hover:border-slate-300 dark:hover:border-blue-500/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-white uppercase tracking-wider text-sm">{title}</h3>
            <div className="text-slate-600 dark:text-zinc-400 font-medium">{children}</div>
        </div>
    </motion.div>
);

const AboutUs = () => {
  const [chooseOpen, setChooseOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="container mx-auto px-4 pt-4 pb-12 relative">
        {/* Dynamic background accents */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 relative z-10 pt-0"
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 text-sm font-bold tracking-wide uppercase">
            {t("about.title")}
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-400 dark:to-white bg-clip-text text-transparent">
            {t("about.title")}
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            {t("about.subtitle")}
          </p>
        </motion.section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24 relative z-10">
          {[
            { icon: Users, title: t("about.globalFocus"), description: t("about.globalFocusDesc") },
            { icon: Briefcase, title: t("about.skillsBased"), description: t("about.skillsBasedDesc") },
            { icon: Globe, title: t("about.communityBuilding"), description: t("about.communityBuildingDesc") },
            { icon: Heart, title: t("about.inclusivePlatform"), description: t("about.inclusivePlatformDesc") },
          ].map((item, index) => (
            <FeatureCard key={index} {...item} index={index} />
          ))}
        </section>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative rounded-[2.5rem] overflow-hidden p-1 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-zinc-800 dark:to-zinc-950 mb-24 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative rounded-[2.4rem] bg-white dark:bg-zinc-950 px-8 py-16 md:px-16 md:py-24 text-center z-10">
            <h2 className="text-3xl sm:text-5xl font-bold mb-10 text-slate-900 dark:text-white underline decoration-purple-500/30 decoration-8 underline-offset-8">
              {t("about.ourMission")}
            </h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="text-xl md:text-2xl text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                {t("about.missionPara1")}
              </p>
              <p className="text-lg md:text-xl text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t("about.missionPara2")}
              </p>
            </div>
          </div>
        </motion.section>

        <Dialog open={chooseOpen} onOpenChange={setChooseOpen}>
            <DialogTrigger asChild>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <h2 className="text-3xl sm:text-5xl font-bold mb-8 text-slate-900 dark:text-white">
                        {t("about.joinCommunity")}
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
                        {t("about.joinCommunityDesc")}
                    </p>
                    <Button 
                        size="lg" 
                        className="h-auto py-5 px-10 text-xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/20 transform hover:-translate-y-1 transition-all duration-300"
                    >
                        {t("about.getStarted")}
                    </Button>
                </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl border-0 bg-white dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden rounded-[2rem]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

                <div className="px-10 pt-10 pb-2">
                    <DialogHeader>
                        <DialogTitle className="text-4xl font-black tracking-tight bg-gradient-to-r from-purple-700 via-pink-600 to-purple-700 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {t("about.chooseYourPath")}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-zinc-400 text-lg mt-2">
                            {t("about.choosePathDesc")}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-10 pt-6">
                    <Link to="/login?type=employee" className="block group" onClick={() => setChooseOpen(false)}>
                        <div className="relative h-full rounded-3xl border-2 border-purple-100 dark:border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900/20 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all duration-500 p-8 text-center shadow-sm hover:shadow-2xl dark:hover:shadow-purple-500/10 group">
                            <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 border border-purple-100 dark:border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-300 transition-all duration-500 shadow-sm">
                                <Users className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t("about.imProfessional")}</h3>
                            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">{t("about.professionalDesc")}</p>
                            <div className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold text-sm transform group-hover:scale-[1.02] transition-all">
                                {t("about.continueAsProfessional")}
                            </div>
                        </div>
                    </Link>

                    <Link to="/login?type=employer" className="block group" onClick={() => setChooseOpen(false)}>
                        <div className="relative h-full rounded-3xl border-2 border-pink-100 dark:border-pink-500/20 bg-gradient-to-br from-pink-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-900/20 hover:border-pink-400 dark:hover:border-pink-500/50 transition-all duration-500 p-8 text-center shadow-sm hover:shadow-2xl dark:hover:shadow-pink-500/10 group">
                            <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-white dark:bg-zinc-800 border border-pink-100 dark:border-pink-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-pink-300 transition-all duration-500 shadow-sm">
                                <Briefcase className="w-10 h-10 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t("about.imEmployer")}</h3>
                            <p className="text-slate-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed">{t("about.employerDesc")}</p>
                            <div className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-sm transform group-hover:scale-[1.02] transition-all">
                                {t("about.continueAsEmployer")}
                            </div>
                        </div>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>

        <section className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-blue-500/5 dark:bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
          <h2 className="text-3xl sm:text-5xl font-bold mb-16 text-center text-slate-900 dark:text-white uppercase tracking-[0.2em] text-sm">
            {t("about.contactUs")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ContactCard icon={Mail} title={t("about.email")} index={0}>
                <a href="mailto:info@skillconnect.com" className="hover:text-purple-600 dark:hover:text-purple-400 block mb-1">info@skillconnect.com</a>
                <a href="mailto:support@skillconnect.com" className="hover:text-purple-600 dark:hover:text-purple-400 block">support@skillconnect.com</a>
            </ContactCard>
            <ContactCard icon={Phone} title={t("about.phone")} index={1}>
                <a href="tel:+918830203469" className="hover:text-blue-600 dark:hover:text-blue-400 block mb-1">+91 8830203469</a>
                <p className="text-sm opacity-80 font-normal">{t("about.hours")}</p>
            </ContactCard>
            <ContactCard icon={MapPin} title={t("about.address")} index={2}>
                <p className="leading-relaxed">Pune Institute of Computer Technology,<br />Dhankavadi, Pune-411043</p>
            </ContactCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
