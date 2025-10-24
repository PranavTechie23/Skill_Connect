// Default test jobs for development/fallback
export const TEST_JOBS = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    description: 'Looking for an experienced software engineer to join our team.',
    requirements: 'At least 5 years of experience in web development.',
    location: 'Mumbai, India',
    jobType: 'full-time',
    salaryMin: 1500000,
    salaryMax: 2500000,
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
    companyId: '1',
    employerId: '1',
    isActive: true,
    createdAt: (new Date()).toISOString()
  },
  {
    id: '2',
    title: 'Frontend Developer',
    description: 'Join our team as a frontend developer.',
    requirements: 'Experience with React and modern JavaScript.',
    location: 'Pune, India',
    jobType: 'full-time',
    salaryMin: 800000,
    salaryMax: 1500000,
    skills: ['HTML', 'CSS', 'JavaScript', 'React'],
    companyId: '2',
    employerId: '2',
    isActive: true,
    createdAt: (new Date()).toISOString()
  }
];