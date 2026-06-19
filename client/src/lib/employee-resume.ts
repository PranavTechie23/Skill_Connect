/** Profile resume fields from professional_profiles (API may return snake_case). */
export type ProfileResume = {
  resumeUrl?: string | null;
  resumeName?: string | null;
  resume_url?: string | null;
  resume_name?: string | null;
  [key: string]: any;
};

export function getProfileResume(profile?: ProfileResume | null): {
  resumeUrl: string | null;
  resumeName: string | null;
} {
  if (!profile) return { resumeUrl: null, resumeName: null };
  return {
    resumeUrl: profile.resumeUrl ?? profile.resume_url ?? null,
    resumeName: profile.resumeName ?? profile.resume_name ?? null,
  };
}

export type ApplyDetailsForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
};

export function buildApplyDetailsFromUser(user: {
  firstName?: string;
  lastName?: string;
  email?: string;
  telephoneNumber?: string;
  location?: string;
  profile?: (ProfileResume & { headline?: string | null; bio?: string | null }) | null;
} | null): ApplyDetailsForm {
  if (!user) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      headline: "",
      bio: "",
    };
  }
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    phone: user.telephoneNumber ?? "",
    location: user.location ?? "",
    headline: user.profile?.headline ?? "",
    bio: user.profile?.bio ?? "",
  };
}
