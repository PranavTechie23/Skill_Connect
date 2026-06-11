import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6 -ml-4 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10 border-b border-gray-200 dark:border-slate-700 pb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                At SkillConnect, we collect information that you provide directly to us when you create an account, build your profile, apply for jobs, or communicate with other users on the platform. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal identification information (Name, email address, phone number)</li>
                <li>Professional details (Skills, experience, education, portfolio)</li>
                <li>Account credentials</li>
                <li>Communications sent through our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to provide, maintain, and improve our services. Specifically, we use your data to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Match you with relevant job opportunities based on your skills</li>
                <li>Enable employers to find suitable candidates for their open roles</li>
                <li>Facilitate communication between job seekers and employers</li>
                <li>Send you technical notices, updates, and security alerts</li>
                <li>Personalize your experience on the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Data Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell your personal data. We only share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Employers:</strong> When you apply for a job or make your profile public, employers can see your professional information.</li>
                <li><strong>Service Providers:</strong> We may share data with third-party vendors who perform services on our behalf (e.g., hosting, analytics).</li>
                <li><strong>Legal Requirements:</strong> If required by law, subpoena, or other legal processes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
              <p>
                We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Your Rights and Choices</h2>
              <p className="mb-4">
                You have the right to access, update, or delete your personal information at any time through your account settings. You may also opt-out of receiving promotional communications from us by following the instructions in those messages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Changes to this Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. If we make significant changes, we will notify you through the platform or via email before the changes take effect.
              </p>
            </section>

            <section className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at: <br/>
                <a href="mailto:privacy@skillconnect.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@skillconnect.com</a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
