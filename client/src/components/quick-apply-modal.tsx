import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from "./theme-provider";
import {
  X, Send, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, FileText, User, Building2,
} from 'lucide-react';
import { CompanyProfileModal } from '@/components/company-profile-modal';
import { cn } from '@/lib/utils';
import { useApplicationSubmit } from '../hooks/useApplicationSubmit';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import {
  buildApplyDetailsFromUser,
  getProfileResume,
  type ApplyDetailsForm,
} from '@/lib/employee-resume';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId?: string;
  matchPercentage: number;
}

type Step = 'review' | 'resume';

const DETAIL_FIELDS: { key: keyof ApplyDetailsForm; label: string; required?: boolean }[] = [
  { key: 'firstName', label: 'First name', required: true },
  { key: 'lastName', label: 'Last name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'headline', label: 'Professional title' },
  { key: 'bio', label: 'Bio' },
];

export function QuickApplyModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  companyId,
  matchPercentage,
}: QuickApplyModalProps) {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('review');
  const [details, setDetails] = useState<ApplyDetailsForm>(() => buildApplyDetailsFromUser(user));
  const [hasReviewedDetails, setHasReviewedDetails] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  const { submitApplication, isSubmitting } = useApplicationSubmit();

  const { resumeUrl, resumeName } = useMemo(
    () => getProfileResume(user?.profile ?? null),
    [user?.profile]
  );
  const hasProfileResume = Boolean(resumeUrl);

  useEffect(() => {
    if (isOpen) {
      setStep('review');
      setDetails(buildApplyDetailsFromUser(user));
      setHasReviewedDetails(false);
      setCoverLetter('');
      setAttachments([]);
      setUseProfileResume(hasProfileResume);
    }
  }, [isOpen, user, hasProfileResume]);

  const updateDetail = (key: keyof ApplyDetailsForm, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setHasReviewedDetails(false);
  };

  const detailsValid =
    details.firstName.trim() &&
    details.lastName.trim() &&
    details.email.trim().includes('@');

  const canProceedFromReview = detailsValid && hasReviewedDetails;

  const resumeReady =
    attachments.length > 0 || (useProfileResume && hasProfileResume);

  const handleNext = () => {
    if (step === 'review' && canProceedFromReview) {
      setStep('resume');
    }
  };

  const handleBack = () => {
    if (step === 'resume') setStep('review');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeReady) return;

    const success = await submitApplication({
      jobId,
      coverLetter,
      attachments: attachments.length > 0 ? attachments : undefined,
      useProfileResume: useProfileResume && attachments.length === 0,
      applicantDetails: details,
    });

    if (success) onClose();
  };

  if (!isOpen) return null;

  const inputClass = cn(
    "w-full p-3 rounded-xl border transition-all text-sm",
    darkMode
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500"
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500"
  );

  const autofillBannerClass = cn(
    "flex items-start gap-3 p-4 rounded-xl border text-sm mb-6",
    darkMode
      ? "bg-blue-500/10 border-blue-500/30 text-blue-100"
      : "bg-indigo-50 border-indigo-200 text-indigo-900"
  );

  return (
    <>
      <Toaster />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "fixed inset-0",
            darkMode ? "bg-black/70 backdrop-blur-sm" : "bg-black/50 backdrop-blur-sm"
          )}
          onClick={onClose}
        />

        <div className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl shadow-2xl",
          "bg-background border border-border/50"
        )}>
          <button
            onClick={onClose}
            type="button"
            className="absolute right-4 top-4 p-2 rounded-xl text-muted-foreground hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-2">Apply for role</h2>
            <p className="text-muted-foreground">
              <span className="font-semibold">{jobTitle}</span>
              {companyName && <> at <span className="font-semibold">{companyName}</span></>}
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              Match: <span className="font-bold text-primary">{matchPercentage}%</span>
            </div>

            {companyId && companyName && (
              <button
                type="button"
                onClick={() => setShowCompanyProfile(true)}
                className={cn(
                  "mt-3 inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-3 py-2 border transition-colors",
                  darkMode
                    ? "border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/10"
                    : "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
                )}
              >
                <Building2 className="w-4 h-4" />
                View company before you apply
              </button>
            )}

            <div className="flex gap-2 mt-4">
              {(['review', 'resume'] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-colors",
                    step === s || (s === 'review' && step === 'resume')
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                  style={{ opacity: step === s ? 1 : i === 0 && step === 'resume' ? 1 : 0.35 }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Step {step === 'review' ? 1 : 2} of 2 — {step === 'review' ? 'Review your details' : 'Resume & submit'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 'review' && (
              <>
                <div className={autofillBannerClass}>
                  <User className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pre-filled from your profile</p>
                    <p className="opacity-90 mt-1">
                      These fields were loaded from your account. Edit anything that is incorrect, then confirm below before continuing.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {DETAIL_FIELDS.map(({ key, label, required }) => (
                    <div key={key}>
                      <label className={cn(
                        "block mb-1.5 text-sm font-semibold",
                        darkMode ? "text-gray-200" : "text-gray-700"
                      )}>
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                        <span className={cn(
                          "ml-2 text-xs font-normal",
                          darkMode ? "text-blue-300" : "text-indigo-600"
                        )}>
                          auto-filled
                        </span>
                      </label>
                      {key === 'bio' ? (
                        <textarea
                          value={details[key]}
                          onChange={(e) => updateDetail(key, e.target.value)}
                          rows={3}
                          className={inputClass}
                        />
                      ) : (
                        <input
                          type={key === 'email' ? 'email' : 'text'}
                          value={details[key]}
                          onChange={(e) => updateDetail(key, e.target.value)}
                          className={inputClass}
                          required={required}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <label className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border cursor-pointer mb-6",
                  hasReviewedDetails
                    ? darkMode ? "border-emerald-500/50 bg-emerald-500/10" : "border-emerald-300 bg-emerald-50"
                    : darkMode ? "border-gray-600 bg-gray-800/50" : "border-gray-200 bg-gray-50"
                )}>
                  <input
                    type="checkbox"
                    checked={hasReviewedDetails}
                    onChange={(e) => setHasReviewedDetails(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <span className={cn("text-sm", darkMode ? "text-gray-200" : "text-gray-800")}>
                    <span className="font-semibold">I&apos;ve reviewed this information</span>
                    <span className="block mt-1 opacity-80">
                      I confirm these details are accurate for this application.
                    </span>
                  </span>
                </label>

                {!detailsValid && (
                  <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-4">
                    <AlertCircle className="w-4 h-4" />
                    Please complete required fields (name and email).
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold bg-muted">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canProceedFromReview}
                    onClick={handleNext}
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2",
                      "bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Continue to resume
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {step === 'resume' && (
              <>
                <div className="mb-6">
                  <label className={cn("block mb-2 font-semibold", darkMode ? "text-gray-200" : "text-gray-700")}>
                    Cover letter <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Why you're a great fit..."
                    rows={4}
                    className={inputClass}
                  />
                </div>

                <div className="mb-6">
                  <label className={cn("block mb-2 font-semibold", darkMode ? "text-gray-200" : "text-gray-700")}>
                    Resume <span className="text-red-500">*</span>
                  </label>

                  {hasProfileResume && (
                    <label className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border mb-4 cursor-pointer",
                      useProfileResume && attachments.length === 0
                        ? darkMode ? "border-primary bg-primary/10" : "border-indigo-400 bg-indigo-50"
                        : darkMode ? "border-gray-600" : "border-gray-200"
                    )}>
                      <input
                        type="radio"
                        name="resumeSource"
                        checked={useProfileResume && attachments.length === 0}
                        onChange={() => {
                          setUseProfileResume(true);
                          setAttachments([]);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <FileText className="w-4 h-4" />
                          Use saved profile resume
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {resumeName || 'Resume on file'}
                        </p>
                        {resumeUrl && (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary underline mt-1 inline-block"
                          >
                            Preview
                          </a>
                        )}
                      </div>
                      {useProfileResume && attachments.length === 0 && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </label>
                  )}

                  <div className={cn(
                    "p-4 rounded-xl border-2 border-dashed",
                    darkMode ? "border-gray-600 bg-gray-800/30" : "border-gray-200 bg-gray-50"
                  )}>
                    <input
                      type="file"
                      id="apply-resume-upload"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setAttachments(files.slice(0, 1));
                          setUseProfileResume(false);
                        }
                      }}
                    />
                    <label
                      htmlFor="apply-resume-upload"
                      className="flex flex-col items-center cursor-pointer py-2 text-muted-foreground"
                    >
                      <span className="text-sm font-medium">
                        {hasProfileResume ? 'Or upload a different resume' : 'Upload resume (PDF, DOC, DOCX)'}
                      </span>
                      <span className="text-xs mt-1">Max 10MB</span>
                    </label>
                    {attachments.length > 0 && (
                      <div className={cn(
                        "mt-3 flex items-center justify-between p-2 rounded-lg",
                        darkMode ? "bg-gray-700" : "bg-white border"
                      )}>
                        <span className="text-sm truncate">{attachments[0].name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachments([]);
                            if (hasProfileResume) setUseProfileResume(true);
                          }}
                          className="p-1 rounded hover:bg-muted"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {!resumeReady && (
                    <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mt-3">
                      <AlertCircle className="w-4 h-4" />
                      {hasProfileResume
                        ? 'Select your profile resume or upload a file.'
                        : 'Upload a resume in Profile or attach one here to apply.'}
                    </p>
                  )}
                </div>

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 rounded-xl font-semibold flex items-center gap-1 bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold bg-muted">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !resumeReady}
                      className={cn(
                        "px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2",
                        "bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-50"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <CompanyProfileModal
        companyId={companyId}
        companyName={companyName}
        isOpen={showCompanyProfile}
        onClose={() => setShowCompanyProfile(false)}
      />
    </>
  );
}
