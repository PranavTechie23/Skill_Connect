
import { Router } from 'express';
import { storage } from '../storage';
import { handleError } from '../utils';

const router = Router();

router.get('/', async (req, res) => {
    try {
        console.log('Dashboard route called with session:', req.session);
        
        const userId = req.session?.userId;
        if (!userId) {
            console.log('No userId in session');
            return res.status(401).json({ message: 'Not authenticated' });
        }

        console.log('Fetching user data for userId:', userId);
        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
            console.log('User not found for userId:', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User found:', { id: user.id, email: user.email, userType: user.userType });

        console.log('Fetching applications for userId:', userId);
        // Get user's applications with error handling
        let applications = [];
        try {
            applications = await storage.getApplicationsByApplicant(userId);
            console.log(`Found ${applications.length} applications`);
        } catch (appError) {
            console.error('Error fetching applications:', appError);
            applications = []; // Fallback to empty array
        }

        // Get user's profile for profile-strength calculation.
        // Some users have inconsistent/missing userType values in older records,
        // so we normalize and also allow empty type.
        let profile = null;
        const rawUserType = ((user as any).userType || (user as any).user_type || '').toString().toLowerCase();
        if (!rawUserType || rawUserType === 'professional' || rawUserType === 'job_seeker' || rawUserType === 'job-seeker') {
            profile = await storage.getProfessionalProfileByUserId(userId);
        }

        // Get recommended jobs
        const { jobs: allJobs } = await storage.getJobs();
        
        // Sort jobs by match score and get top 3
        const recommendedJobs = allJobs
            .filter(job => job.isActive)
            .map(job => {
                // Calculate match score based on skills if profile exists
                let matchPercentage = 75; // Default score
                const jobSkills = Array.isArray(job.skills) ? job.skills : [];
                if (profile?.skills && profile.skills.length > 0 && jobSkills.length > 0) {
                    const matchingSkills = jobSkills.filter(skill => 
                        profile.skills.includes(skill)
                    ).length;
                    matchPercentage = Math.round((matchingSkills / jobSkills.length) * 100);
                }
                return { ...job, matchPercentage };
            })
            .sort((a, b) => b.matchPercentage - a.matchPercentage)
            .slice(0, 3);

        // Calculate profile completion
        const calculateProfileCompletion = () => {
            let totalFields = 0;
            let completedFields = 0;

            // Basic user fields
            const userFields = ['firstName', 'lastName', 'email', 'location', 'telephoneNumber', 'profilePhoto'];
            totalFields += userFields.length;
            completedFields += userFields.filter(field => user[field]).length;

            // Profile fields
            if (profile) {
                const profileFields = ['headline', 'bio', 'skills'];
                totalFields += profileFields.length;
                completedFields += profileFields.filter(field => {
                    if (field === 'skills') {
                        return Array.isArray(profile[field]) && profile[field].length > 0;
                    }
                    return profile[field];
                }).length;
            }

            return Math.round((completedFields / totalFields) * 100);
        };

        // Prepare stats
        const stats = {
            totalApplications: applications.length,
            pendingApplications: applications.filter(app => app.status === 'pending').length,
            interviewInvitations: applications.filter(app => app.status === 'interview').length,
            profileCompletion: calculateProfileCompletion()
        };

        // Get recent applications with company details
        const recentApplications = await Promise.all(
            applications.slice(0, 3).map(async (app) => {
                const normalizedJobId = app.jobId ?? app.job_id;
                const normalizedAppliedAt = app.appliedAt ?? app.applied_at;
                let jobDetails = null;
                let companyDetails = null;

                try {
                    if (normalizedJobId) {
                        jobDetails = await storage.getJob(String(normalizedJobId));
                        if (jobDetails?.companyId) {
                            companyDetails = await storage.getCompany(String(jobDetails.companyId));
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching details for application ${app.id}:`, err);
                }

                return {
                    id: app.id,
                    jobId: normalizedJobId,
                    jobTitle: jobDetails?.title || 'Unknown Position',
                    company: companyDetails?.name || 'Unknown Company',
                    appliedDate: normalizedAppliedAt,
                    status: app.status
                };
            })
        ).catch(error => {
            console.error('Error processing recent applications:', error);
            return [];
        });

        res.json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profile
            },
            stats,
            recommendedJobs,
            recentApplications
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        handleError(res, error, 'Failed to fetch dashboard data');
    }
});

export default router;
