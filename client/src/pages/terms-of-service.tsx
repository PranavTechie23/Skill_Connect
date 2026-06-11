import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the SkillConnect platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time, and continued use of the platform constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Description of Service</h2>
              <p>
                SkillConnect is a skills-based matching platform that connects job seekers ("Professionals") with employers ("Companies"). We provide tools for creating profiles, posting jobs, applying for opportunities, and facilitating communication between parties. We do not guarantee employment or the quality of candidates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. User Accounts</h2>
              <p className="mb-4">
                To use certain features of the platform, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing accurate and complete information during registration</li>
                <li>Maintaining the confidentiality of your password and account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Acceptable Use Policy</h2>
              <p className="mb-4">
                You agree not to use the platform to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Post false, misleading, or deceptive information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with or disrupt the integrity or performance of the platform</li>
                <li>Attempt to gain unauthorized access to the platform or related systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Content Ownership</h2>
              <p>
                You retain all rights to the content you post on SkillConnect. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, copy, modify, and display that content in connection with providing our services. You represent and warrant that you have the rights to grant this license.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Limitation of Liability</h2>
              <p>
                In no event shall SkillConnect be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the platform.
              </p>
            </section>

            <section className="pt-6 border-t border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Information</h2>
              <p>
                If you have any questions regarding these Terms of Service, please contact us at: <br/>
                <a href="mailto:legal@skillconnect.com" className="text-blue-600 dark:text-blue-400 hover:underline">legal@skillconnect.com</a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
