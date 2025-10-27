// server/src/storage.ts - CORRECT IMPORTS FOR DRIZZLE 0.44.6
import { type User, type InsertUser, type Company, type InsertCompany, type Job, type InsertJob, type Application, type InsertApplication, type Message, type InsertMessage, type Experience, type InsertExperience, type Story, type ProfessionalProfile, type InsertProfessionalProfile } from "../../shared/schema";
import { db } from "./db";
import { users, professionalProfiles, companies, jobs, applications, messages, experiences, stories } from "../../shared/schema";
import { sql } from "drizzle-orm";
import { eq, desc } from "drizzle-orm/expressions";

export interface IStorage {
  // Users
  getUser(id: string | number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string | number, updates: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string | number): Promise<void>;

  // Professional Profiles
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  getProfessionalProfileByUserId(userId: string | number): Promise<ProfessionalProfile | undefined>;
  updateProfessionalProfile(userId: string | number, updates: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompany(id: string | number): Promise<Company | undefined>;
  getCompaniesByOwner(ownerId: string | number): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company>;
  getAllCompanies(): Promise<Company[]>;
  deleteCompany(id: string | number): Promise<void>;
  
  // Jobs
  getJob(id: string | number): Promise<Job | undefined>;
  getJobs(filters?: { 
    location?: string; 
    skills?: string[]; 
    jobType?: string; 
    search?: string;
    page?: number;
    itemsPerPage?: number;
  }): Promise<{ jobs: Job[]; totalCount: number }>;
  getJobsByEmployer(employerId: string | number): Promise<Job[]>;
  getJobsByCompany(companyId: string | number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string | number): Promise<void>;
  
  // Applications
  getApplication(id: string | number): Promise<Application | undefined>;
  getApplicationsByJob(jobId: string | number): Promise<Application[]>;
  getApplicationsByApplicant(applicantId: string | number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application>;
  
  // Messages
  getMessage(id: string | number): Promise<Message | undefined>;
  getMessagesByUser(userId: string | number): Promise<Message[]>;
  getConversation(user1Id: string | number, user2Id: string | number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  
  // Experiences
  getExperience(id: string | number): Promise<Experience | undefined>;
  getExperiencesByUser(userId: string | number): Promise<Experience[]>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  updateExperience(id: string, updates: Partial<InsertExperience>): Promise<Experience>;
  deleteExperience(id: string): Promise<void>;

  // Stories
  createStory(story: {
    title: string;
    content: string;
    tags: string[];
    authorId: number;
    createdAt: Date;
  }): Promise<Story>;
  getStories(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string | number): Promise<User | undefined> {
    const query = sql`
      SELECT 
        id::text,
        email,
        password,
        first_name as "firstName",
        last_name as "lastName",
        user_type as "userType",
        location,
        profile_photo as "profilePhoto",
        telephone_number as "telephoneNumber",
        created_at as "createdAt"
      FROM users 
      WHERE id = ${String(id)}
      LIMIT 1
    `;
    
    const result = await db.execute(query);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    return {
      id: String(row.id),
      email: String(row.email),
      password: String(row.password),
      firstName: String(row.firstName),
      lastName: String(row.lastName),
      userType: String(row.userType),
      location: String(row.location),
      profilePhoto: String(row.profilePhoto),
      telephoneNumber: String(row.telephoneNumber),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log('🔍 Looking up user by email:', email);
      
      const query = sql`
        SELECT 
          id::text,
          email,
          password,
          first_name as "firstName",
          last_name as "lastName",
          user_type as "userType",
          location,
          profile_photo as "profilePhoto",
          telephone_number as "telephoneNumber",
          created_at as "createdAt"
        FROM users 
        WHERE email = ${email}
        LIMIT 1
      `;
      
      const result = await db.execute(query);
      if (!result.rows[0]) {
        console.log('❌ No user found with email:', email);
        return undefined;
      }

      const row = result.rows[0];
      const user = {
        id: String(row.id),
        email: String(row.email),
        password: String(row.password),
        firstName: String(row.firstName),
        lastName: String(row.lastName),
        userType: String(row.userType),
        location: String(row.location),
        profilePhoto: String(row.profilePhoto),
        telephoneNumber: String(row.telephoneNumber),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      };
      
      console.log('✅ Found user:', { id: user.id, email: user.email });
      return user;
    } catch (error) {
      console.error('❌ Error in getUserByEmail:', error);
      
      // Handle database connection issues in development
      if (process.env.NODE_ENV === 'development') {
        const errorMessage = String(error instanceof Error ? error.message : error);
        if (
          errorMessage.toLowerCase().includes('connect econnrefused') ||
          errorMessage.toLowerCase().includes('connection refused') ||
          errorMessage.toLowerCase().includes('password authentication failed')
        ) {
          console.warn('⚠️ Database connection failed in development - using fallback data');
          if (email === 'admin@example.com' || email === 'admin@gmail.com') {
            return {
              id: 'dev-admin',
              email: email,
              password: '$2b$10$ZKQ4tAQrwlkCsxc6MR6Z3OkfWMCZqj8HaFBzTX.B4KqbDB4PWv7bW', // admin123
              firstName: 'Admin',
              lastName: 'User',
              userType: 'admin',
              location: '',
              profilePhoto: '',
              telephoneNumber: '',
              createdAt: new Date()
            };
          }
          return undefined;
        }
      }
      
      // Re-throw the error for normal error handling
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('🛠️ Storage: createUser payload:', insertUser);

      const query = sql`
        INSERT INTO users (
          email,
          password,
          first_name,
          last_name,
          user_type,
          location,
          profile_photo,
          telephone_number,
          created_at
        ) VALUES (
          ${insertUser.email},
          ${insertUser.password},
          ${insertUser.firstName},
          ${insertUser.lastName},
          ${insertUser.userType},
          ${insertUser.location},
          ${insertUser.profilePhoto},
          ${insertUser.telephoneNumber},
          ${insertUser.createdAt || new Date()}
        )
        RETURNING 
          id::text,
          email,
          password,
          first_name as "firstName",
          last_name as "lastName",
          user_type as "userType",
          location,
          profile_photo as "profilePhoto",
          telephone_number as "telephoneNumber",
          created_at as "createdAt"
      `;

      const result = await db.execute(query);
      if (!result.rows[0]) throw new Error("Failed to create user");
      
      const row = result.rows[0];
      const user = {
        id: String(row.id),
        email: String(row.email),
        password: String(row.password),
        firstName: String(row.firstName),
        lastName: String(row.lastName),
        userType: String(row.userType),
        location: String(row.location),
        profilePhoto: String(row.profilePhoto),
        telephoneNumber: String(row.telephoneNumber),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      };

      console.log('✅ Storage: User created:', user);
      return user;
    } catch (error) {
      console.error('❌ Storage: Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string | number, updates: Partial<InsertUser>): Promise<User> {
    try {
      const updateClauses = [];

      if (updates.email !== undefined) {
        updateClauses.push(sql`email = ${updates.email}`);
      }
      if (updates.password !== undefined) {
        updateClauses.push(sql`password = ${updates.password}`);
      }
      if (updates.firstName !== undefined) {
        updateClauses.push(sql`first_name = ${updates.firstName}`);
      }
      if (updates.lastName !== undefined) {
        updateClauses.push(sql`last_name = ${updates.lastName}`);
      }
      if (updates.userType !== undefined) {
        updateClauses.push(sql`user_type = ${updates.userType}`);
      }
      if (updates.location !== undefined) {
        updateClauses.push(sql`location = ${updates.location}`);
      }
      if (updates.profilePhoto !== undefined) {
        updateClauses.push(sql`profile_photo = ${updates.profilePhoto}`);
      }
      if (updates.telephoneNumber !== undefined) {
        updateClauses.push(sql`telephone_number = ${updates.telephoneNumber}`);
      }

      if (updateClauses.length === 0) {
        throw new Error("No valid updates provided");
      }

      const query = sql`
        UPDATE users 
        SET ${sql.join(updateClauses, sql`, `)}
        WHERE id = ${String(id)}
        RETURNING 
          id::text,
          email,
          password,
          first_name as "firstName",
          last_name as "lastName",
          user_type as "userType",
          location,
          profile_photo as "profilePhoto",
          telephone_number as "telephoneNumber",
          created_at as "createdAt"
      `;

      const result = await db.execute(query);
      if (!result.rows[0]) throw new Error("User not found");
      
      const row = result.rows[0];
      return {
        id: String(row.id),
        email: String(row.email),
        password: String(row.password),
        firstName: String(row.firstName),
        lastName: String(row.lastName),
        userType: String(row.userType),
        location: String(row.location),
        profilePhoto: String(row.profilePhoto),
        telephoneNumber: String(row.telephoneNumber),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      };
    } catch (error) {
      console.error('❌ Storage: Error updating user:', error);
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    const query = sql`
      SELECT 
        id::text,
        email,
        password,
        first_name as "firstName",
        last_name as "lastName",
        user_type as "userType",
        location,
        profile_photo as "profilePhoto",
        telephone_number as "telephoneNumber",
        created_at as "createdAt"
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const result = await db.execute(query);
    return result.rows.map(row => ({
      id: String(row.id),
      email: String(row.email),
      password: String(row.password),
      firstName: String(row.firstName),
      lastName: String(row.lastName),
      userType: String(row.userType),
      location: String(row.location),
      profilePhoto: String(row.profilePhoto),
      telephoneNumber: String(row.telephoneNumber),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    }));
  }
  
  async deleteUser(id: string | number): Promise<void> {
    await db.execute(sql`DELETE FROM users WHERE id = ${String(id)}`);
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      console.log('🔍 Storage: Entering getAllCompanies method.');
      const query = sql`
        SELECT 
          c.id::text,
          c.name,
          c.description,
          c.location,
          c.website,
          c.industry,
          c.size,
          c.owner_id::text as "ownerId",
          c.logo,
          c.created_at as "createdAt",
          u.email as "ownerEmail",
          COUNT(j.id)::integer as "jobPostings"
        FROM companies c
        LEFT JOIN users u ON c.owner_id = u.id
        LEFT JOIN jobs j ON c.id = j.company_id
        GROUP BY c.id, u.id
        ORDER BY c.created_at DESC
      `;
      
      const result = await db.execute(query);
      console.log(`✅ Storage: getAllCompanies fetched ${result.rows.length} rows.`);
      return result.rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        location: String(row.location),
        website: String(row.website),
        industry: String(row.industry),
        size: String(row.size),
        ownerId: String(row.ownerId),
        logo: String(row.logo),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt)),
        status: 'approved', // Default to 'approved' as status column doesn't exist
        owner: { email: row.ownerEmail || 'N/A' },
        jobs: { length: Number(row.jobPostings) || 0 }
      }));
    } catch (error) {
      console.error('❌ Storage: Error in getAllCompanies:', error);
      throw error;
    }
  }
  
  async deleteCompany(id: string | number): Promise<void> {
    await db.execute(sql`DELETE FROM companies WHERE id = ${id}`);
  }
  
  async deleteJob(id: string | number): Promise<void> {
    await db.execute(sql`DELETE FROM jobs WHERE id = ${id}`);
  }
  
  // Professional Profiles
  async createProfessionalProfile(insertProfile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const query = sql`
      INSERT INTO professional_profiles (
        user_id,
        headline,
        bio,
        skills
      ) VALUES (
        ${String(insertProfile.userId)},
        ${insertProfile.headline},
        ${insertProfile.bio},
        ${insertProfile.skills || []}
      )
      RETURNING 
        id,
        user_id as "userId",
        headline,
        bio,
        skills
    `;
    
    const result = await db.execute(query);
    if (!result.rows[0]) throw new Error("Failed to create professional profile");

    const row = result.rows[0];
    return {
      id: Number(row.id),
      userId: String(row.userId),
      headline: String(row.headline),
      bio: String(row.bio),
      skills: Array.isArray(row.skills) ? row.skills.map(String) : []
    };
  }

  async getProfessionalProfileByUserId(userId: string | number): Promise<ProfessionalProfile | undefined> {
    const query = sql`
      SELECT 
        id,
        user_id as "userId",
        headline,
        bio,
        skills
      FROM professional_profiles 
      WHERE user_id = ${String(userId)}
      LIMIT 1
    `;
    
    const result = await db.execute(query);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    return {
      id: Number(row.id),
      userId: String(row.userId),
      headline: String(row.headline),
      bio: String(row.bio),
      skills: Array.isArray(row.skills) ? row.skills.map(String) : []
    };
  }

  async updateProfessionalProfile(userId: string | number, updates: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile> {
    const updateFields: string[] = [];
    const values: any[] = [String(userId)];
    let paramIndex = 2;

    if (updates.headline !== undefined) {
      updateFields.push(`headline = $${paramIndex++}`);
      values.push(updates.headline);
    }
    if (updates.bio !== undefined) {
      updateFields.push(`bio = $${paramIndex++}`);
      values.push(updates.bio);
    }
    if (updates.skills !== undefined) {
      updateFields.push(`skills = $${paramIndex++}`);
      values.push(updates.skills);
    }

    const query = sql`
      UPDATE professional_profiles
      SET ${sql.raw(updateFields.join(', '))}
      WHERE user_id = $1
      RETURNING 
        id,
        user_id as "userId",
        headline,
        bio,
        skills
    `;
    
    const result = await db.execute(query.append(sql`${sql.raw(values.map(v => String(v)).join(','))}`));
    if (!result.rows[0]) throw new Error("Professional profile not found");

    const row = result.rows[0];
    return {
      id: Number(row.id),
      userId: String(row.userId),
      headline: String(row.headline),
      bio: String(row.bio),
      skills: Array.isArray(row.skills) ? row.skills.map(String) : []
    };
  }

  // Companies
  async getCompany(id: string | number): Promise<Company | undefined> {
    const query = sql`
      SELECT 
        id::text,
        name,
        description,
        website,
        industry,
        size,
        location,
        owner_id as "ownerId",
        logo,
        created_at as "createdAt"
      FROM companies 
      WHERE id = ${String(id)}
      LIMIT 1
    `;

    const result = await db.execute(query);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    return {
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      website: String(row.website),
      industry: String(row.industry),
      size: String(row.size),
      location: String(row.location),
      ownerId: String(row.ownerId),
      logo: String(row.logo),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    };
  }

  async getCompaniesByOwner(ownerId: string | number): Promise<Company[]> {
    const query = sql`
      SELECT 
        id::text,
        name,
        description,
        website,
        industry,
        size,
        location,
        owner_id as "ownerId",
        logo,
        created_at as "createdAt"
      FROM companies 
      WHERE owner_id = ${String(ownerId)}
    `;

    const result = await db.execute(query);
    return result.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      website: String(row.website),
      industry: String(row.industry),
      size: String(row.size),
      location: String(row.location),
      ownerId: String(row.ownerId),
      logo: String(row.logo),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    }));
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    try {
      console.log('🛠️ Storage: createCompany payload:', insertCompany);

      const query = sql`
        INSERT INTO companies (
          name,
          description,
          website,
          industry,
          size,
          location,
          owner_id,
          logo,
          created_at
        ) VALUES (
          ${insertCompany.name},
          ${insertCompany.description},
          ${insertCompany.website},
          ${insertCompany.industry},
          ${insertCompany.size},
          ${insertCompany.location},
          ${insertCompany.ownerId},
          ${insertCompany.logo},
          ${insertCompany.createdAt || new Date()}
        )
        RETURNING 
          id::text,
          name,
          description,
          website,
          industry,
          size,
          location,
          owner_id as "ownerId",
          logo,
          created_at as "createdAt"
      `;

      const result = await db.execute(query);
      if (!result.rows[0]) throw new Error("Failed to create company");

      const row = result.rows[0];
      const company = {
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        website: String(row.website),
        industry: String(row.industry),
        size: String(row.size),
        location: String(row.location),
        ownerId: String(row.ownerId),
        logo: String(row.logo),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      };

      console.log('✅ Storage: Company created:', company);
      return company;
    } catch (error) {
      console.error('❌ Storage: Error creating company:', error);
      throw error;
    }
  }

  async updateCompany(id: string | number, updates: Partial<InsertCompany>): Promise<Company> {
    try {
      const updateClauses = [];

      if (updates.name !== undefined) {
        updateClauses.push(sql`name = ${updates.name}`);
      }
      if (updates.description !== undefined) {
        updateClauses.push(sql`description = ${updates.description}`);
      }
      if (updates.website !== undefined) {
        updateClauses.push(sql`website = ${updates.website}`);
      }
      if (updates.industry !== undefined) {
        updateClauses.push(sql`industry = ${updates.industry}`);
      }
      if (updates.size !== undefined) {
        updateClauses.push(sql`size = ${updates.size}`);
      }
      if (updates.location !== undefined) {
        updateClauses.push(sql`location = ${updates.location}`);
      }
      if (updates.ownerId !== undefined) {
        updateClauses.push(sql`owner_id = ${updates.ownerId}`);
      }
      if (updates.logo !== undefined) {
        updateClauses.push(sql`logo = ${updates.logo}`);
      }

      if (updateClauses.length === 0) {
        throw new Error("No valid updates provided");
      }

      const query = sql`
        UPDATE companies 
        SET ${sql.join(updateClauses, sql`, `)}
        WHERE id = ${String(id)}
        RETURNING 
          id::text,
          name,
          description,
          website,
          industry,
          size,
          location,
          owner_id as "ownerId",
          logo,
          created_at as "createdAt"
      `;

      const result = await db.execute(query);
      if (!result.rows[0]) throw new Error("Company not found");

      const row = result.rows[0];
      return {
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        website: String(row.website),
        industry: String(row.industry),
        size: String(row.size),
        location: String(row.location),
        ownerId: String(row.ownerId),
        logo: String(row.logo),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      };
    } catch (error) {
      console.error('❌ Storage: Error updating company:', error);
      throw error;
    }
  }

  // Jobs
  async getJob(id: string | number): Promise<Job | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const query = sql`
      SELECT 
        id::text,
        title,
        description,
        requirements,
        location,
        job_type as "jobType",
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        skills,
        company_id::text as "companyId",
        employer_id::text as "employerId",
        is_active as "isActive",
        created_at as "createdAt"
      FROM jobs
      WHERE id = ${nid}
      LIMIT 1
    `;
    
    const result = await db.execute(query);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    return {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      requirements: row.requirements ? String(row.requirements) : '',
      location: String(row.location),
      jobType: String(row.jobType),
      salaryMin: Number(row.salaryMin) || 0,
      salaryMax: Number(row.salaryMax) || 0,
      skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
      companyId: row.companyId ? String(row.companyId) : '',
      employerId: String(row.employerId),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    };
  }

  async getJobs(filters?: { 
    location?: string; 
    skills?: string[]; 
    jobType?: string; 
    search?: string;
    page?: number;
    itemsPerPage?: number;
  }): Promise<{ jobs: Job[]; totalCount: number }> {
    try {
      console.log('📝 Starting getJobs with filters:', filters);
      
      // Build the base select query
      const baseSelect = sql`
        SELECT 
          j.id::text,
          j.title,
          j.description,
          j.requirements,
          j.location,
          j.job_type as "jobType",
          j.salary_min as "salaryMin",
          j.salary_max as "salaryMax",
          j.skills,
          j.company_id::text as "companyId",
          j.employer_id::text as "employerId",
          j.is_active as "isActive",
          j.created_at as "createdAt"
      `;

      // Build the conditions
      const conditions: ReturnType<typeof sql>[] = [sql`1 = 1`]; // Always true condition as base

      if (filters) {
        if (filters.location) {
          conditions.push(sql`j.location ILIKE ${`%${filters.location}%`}`);
        }
        
        if (filters.jobType) {
          conditions.push(sql`j.job_type = ${filters.jobType}`);
        }
        
        if (filters.search) {
          conditions.push(sql`(
            j.title ILIKE ${`%${filters.search}%`} OR 
            j.description ILIKE ${`%${filters.search}%`}
          )`);
        }
        
        if (filters.skills && filters.skills.length > 0) {
          conditions.push(sql`j.skills ?| ${filters.skills}`);
        }
      }

      // Combine all conditions
      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      // Get total count with a single query
      const countQuery = sql`
        SELECT COUNT(*)::integer as count
        FROM jobs j
        ${whereClause}
      `;

      const [countResult, jobsResult] = await Promise.all([
        db.execute(countQuery),
        db.execute(sql`
          ${baseSelect}
          FROM jobs j
          ${whereClause}
          ORDER BY j.created_at DESC
          ${filters?.page && filters?.itemsPerPage 
            ? sql`LIMIT ${filters.itemsPerPage} OFFSET ${(filters.page - 1) * filters.itemsPerPage}`
            : sql``}
        `)
      ]);

      const totalCount = Number(countResult.rows[0]?.count || 0);
      
      // Map the results
      const jobs = jobsResult.rows.map((row: any) => ({
        id: String(row.id),
        title: String(row.title),
        description: String(row.description),
        requirements: row.requirements ? String(row.requirements) : '',
        location: String(row.location),
        jobType: String(row.jobType),
        salaryMin: Number(row.salaryMin) || 0,
        salaryMax: Number(row.salaryMax) || 0,
        skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
        companyId: row.companyId ? String(row.companyId) : '',
        employerId: String(row.employerId),
        isActive: Boolean(row.isActive),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      } satisfies Job));

      console.log('✅ Fetched jobs from database:', { count: jobs.length, total: totalCount });
      
      // Development mode test data - only if explicitly requested and no database results
      if (process.env.NODE_ENV === 'development' && jobs.length === 0) {
        const testJobs = this.generateTestJobs();
        const filteredJobs = this.applyTestFilters(testJobs, filters);
        const paginatedJobs = this.applyPagination(filteredJobs, filters?.page, filters?.itemsPerPage);
        
        return {
          jobs: paginatedJobs,
          totalCount: filteredJobs.length
        };
      }

      return {
        jobs,
        totalCount
      };
      
    } catch (error) {
      console.error('❌ Error in getJobs:', error);
      // Hide implementation details in production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Failed to fetch jobs: ${error instanceof Error ? error.message : String(error)}`
        : 'Failed to fetch jobs. Please try again later.';
      throw new Error(errorMessage);
    }
  }

  // Helper function to generate test jobs data
  private generateTestJobs(): Job[] {
    return [
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
        createdAt: new Date()
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
        createdAt: new Date()
      },
      {
        id: '3',
        title: 'Backend Developer',
        description: 'Backend developer needed for our growing team.',
        requirements: 'Strong understanding of Node.js and databases.',
        location: 'Bangalore, India',
        jobType: 'full-time',
        salaryMin: 1000000,
        salaryMax: 1800000,
        skills: ['Node.js', 'PostgreSQL', 'Express', 'TypeScript'],
        companyId: '3',
        employerId: '3',
        isActive: true,
        createdAt: new Date()
      }
    ];
  }

  // Helper function to apply filters to test data
  private applyTestFilters(jobs: Job[], filters?: { 
    location?: string; 
    skills?: string[]; 
    jobType?: string; 
    search?: string;
  }): Job[] {
    if (!filters) return jobs;

    return jobs.filter(job => {
      if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      if (filters.jobType && job.jobType.toLowerCase() !== filters.jobType.toLowerCase()) {
        return false;
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!job.title.toLowerCase().includes(searchLower) && 
            !job.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      if (filters.skills && filters.skills.length > 0) {
        if (!filters.skills.some(skill => 
          job.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
        )) {
          return false;
        }
      }

      return true;
    });
  }

  // Helper function to apply pagination
  private applyPagination(jobs: Job[], page?: number, itemsPerPage?: number): Job[] {
    if (!page || !itemsPerPage) return jobs;
    
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return jobs.slice(start, end);
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    const query = sql`
      SELECT 
        id, 
        title, 
        description, 
        requirements, 
        location, 
        job_type as "jobType", 
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        skills,
        company_id as "companyId",
        employer_id as "employerId",
        is_active as "isActive",
        created_at as "createdAt"
      FROM jobs
      WHERE employer_id = ${employerId}
      ORDER BY created_at DESC
    `;
    
    const result = await db.execute(query);
    return result.rows as Job[];
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    const query = sql`
      SELECT 
        id, 
        title, 
        description, 
        requirements, 
        location, 
        job_type as "jobType", 
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        skills,
        company_id as "companyId",
        employer_id as "employerId",
        is_active as "isActive",
        created_at as "createdAt"
      FROM jobs
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
    `;
    
    const result = await db.execute(query);
    return result.rows as Job[];
  }
  
  


  async createJob(insertJob: InsertJob): Promise<Job> {
    // Use SQL query for better type handling
    const query = sql`
      INSERT INTO jobs (
        title,
        description,
        requirements,
        location,
        job_type,
        salary_min,
        salary_max,
        skills,
        company_id,
        employer_id,
        is_active,
        created_at
      ) VALUES (
        ${insertJob.title},
        ${insertJob.description},
        ${insertJob.requirements || ''},
        ${insertJob.location},
        ${insertJob.jobType},
        ${insertJob.salaryMin || 0},
        ${insertJob.salaryMax || 0},
        ${insertJob.skills || []},
        ${insertJob.companyId || null},
        ${insertJob.employerId},
        ${insertJob.isActive ?? true},
        ${insertJob.createdAt || new Date()}
      )
      RETURNING 
        id::text,
        title,
        description,
        requirements,
        location,
        job_type as "jobType",
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        skills,
        company_id::text as "companyId",
        employer_id::text as "employerId",
        is_active as "isActive",
        created_at as "createdAt"
    `;

    const result = await db.execute(query);
    const row = result.rows[0];
    if (!row) throw new Error("Failed to create job");

    return {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      requirements: row.requirements ? String(row.requirements) : '',
      location: String(row.location),
      jobType: String(row.jobType),
      salaryMin: Number(row.salaryMin) || 0,
      salaryMax: Number(row.salaryMax) || 0,
      skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
      companyId: row.companyId ? String(row.companyId) : '',
      employerId: String(row.employerId),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    };
  }

  async updateJob(id: string | number, updates: Partial<InsertJob>): Promise<Job> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    
    const updateFields: string[] = [];
    const values: any[] = [nid];
    let paramIndex = 2;

    // Build update fields dynamically
    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.requirements !== undefined) {
      updateFields.push(`requirements = $${paramIndex++}`);
      values.push(updates.requirements);
    }
    if (updates.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      values.push(updates.location);
    }
    if (updates.jobType !== undefined) {
      updateFields.push(`job_type = $${paramIndex++}`);
      values.push(updates.jobType);
    }
    if (updates.salaryMin !== undefined) {
      updateFields.push(`salary_min = $${paramIndex++}`);
      values.push(updates.salaryMin);
    }
    if (updates.salaryMax !== undefined) {
      updateFields.push(`salary_max = $${paramIndex++}`);
      values.push(updates.salaryMax);
    }
    if (updates.skills !== undefined) {
      updateFields.push(`skills = $${paramIndex++}`);
      values.push(updates.skills);
    }
    if (updates.companyId !== undefined) {
      updateFields.push(`company_id = $${paramIndex++}`);
      values.push(updates.companyId);
    }
    if (updates.employerId !== undefined) {
      updateFields.push(`employer_id = $${paramIndex++}`);
      values.push(updates.employerId);
    }
    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive);
    }

    const query = sql`
      UPDATE jobs 
      SET ${sql.raw(updateFields.join(', '))}
      WHERE id = $1
      RETURNING 
        id::text,
        title,
        description,
        requirements,
        location,
        job_type as "jobType",
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        skills,
        company_id::text as "companyId",
        employer_id::text as "employerId",
        is_active as "isActive",
        created_at as "createdAt"
    `;

    const result = await db.execute(query.append(sql`${sql.raw(values.join(','))}`));
    if (!result.rows[0]) throw new Error("Job not found");

    const row = result.rows[0];
    return {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      requirements: row.requirements ? String(row.requirements) : '',
      location: String(row.location),
      jobType: String(row.jobType),
      salaryMin: Number(row.salaryMin) || 0,
      salaryMax: Number(row.salaryMax) || 0,
      skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
      companyId: row.companyId ? String(row.companyId) : '',
      employerId: String(row.employerId),
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
    };
  }

      // Delete job is now handled through SQL  // Applications
  async getApplication(id: string | number): Promise<Application | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const query = sql`
      SELECT 
        id,
        job_id as "jobId",
        applicant_id as "applicantId",
        status,
        cover_letter as "coverLetter",
        resume,
        notes,
        applied_at as "appliedAt",
        updated_at as "updatedAt"
      FROM applications 
      WHERE id = ${nid}
      LIMIT 1
    `;
    const result = await db.execute(query);
    return result.rows[0] as Application;
  }

  async getApplicationsByJob(jobId: string | number): Promise<Application[]> {
    const query = jobId === "all" 
      ? sql`
          SELECT 
            id,
            job_id as "jobId",
            applicant_id as "applicantId",
            status,
            cover_letter as "coverLetter",
            resume,
            notes,
            applied_at as "appliedAt",
            updated_at as "updatedAt"
          FROM applications
          ORDER BY applied_at DESC
        `
      : sql`
          SELECT 
            id,
            job_id as "jobId",
            applicant_id as "applicantId",
            status,
            cover_letter as "coverLetter",
            resume,
            notes,
            applied_at as "appliedAt",
            updated_at as "updatedAt"
          FROM applications
          WHERE job_id = ${jobId}
          ORDER BY applied_at DESC
        `;
    const result = await db.execute(query);
    return result.rows as Application[];
  }

  async getApplicationsByApplicant(applicantId: string | number): Promise<Application[]> {
    const query = sql`
      SELECT 
        id,
        job_id as "jobId",
        applicant_id as "applicantId",
        status,
        cover_letter as "coverLetter",
        resume,
        notes,
        applied_at as "appliedAt",
        updated_at as "updatedAt"
      FROM applications
      WHERE applicant_id = ${applicantId}
      ORDER BY applied_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Application[];
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const query = sql`
      INSERT INTO applications (
        job_id,
        applicant_id,
        status,
        cover_letter,
        resume,
        notes
      ) VALUES (
        ${insertApplication.jobId},
        ${insertApplication.applicantId},
        ${insertApplication.status},
        ${insertApplication.coverLetter},
        ${insertApplication.resume},
        ${insertApplication.notes}
      )
      RETURNING 
        id,
        job_id as "jobId",
        applicant_id as "applicantId",
        status,
        cover_letter as "coverLetter",
        resume,
        notes,
        applied_at as "appliedAt",
        updated_at as "updatedAt"
    `;
    
    const result = await db.execute(query);
    return result.rows[0] as Application;
  }

  async updateApplication(id: string | number, updates: Partial<InsertApplication>): Promise<Application> {
    try {
      const updateClauses = [];

      if (updates.jobId !== undefined) {
        updateClauses.push(sql`job_id = ${updates.jobId}`);
      }
      if (updates.applicantId !== undefined) {
        updateClauses.push(sql`applicant_id = ${updates.applicantId}`);
      }
      if (updates.status !== undefined) {
        updateClauses.push(sql`status = ${updates.status}`);
      }
      if (updates.coverLetter !== undefined) {
        updateClauses.push(sql`cover_letter = ${updates.coverLetter}`);
      }
      if (updates.resume !== undefined) {
        updateClauses.push(sql`resume = ${updates.resume}`);
      }
      if (updates.notes !== undefined) {
        updateClauses.push(sql`notes = ${updates.notes}`);
      }

      updateClauses.push(sql`updated_at = CURRENT_TIMESTAMP`);

      const query = sql`
        UPDATE applications 
        SET ${sql.join(updateClauses, sql`, `)}
        WHERE id = ${String(id)}
        RETURNING 
          id,
          job_id as "jobId",
          applicant_id as "applicantId",
          status,
          cover_letter as "coverLetter",
          resume,
          notes,
          applied_at as "appliedAt",
          updated_at as "updatedAt"
      `;

      const result = await db.execute(query);
      if (!result.rows[0]) throw new Error("Application not found");
      return result.rows[0] as Application;
    } catch (error) {
      console.error('❌ Storage: Error updating application:', error);
      throw error;
    }
  }

  // Messages
  async getMessage(id: string | number): Promise<Message | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const query = sql`
      SELECT 
        id,
        content,
        sender_id as "senderId",
        recipient_id as "recipientId",
        application_id as "applicationId",
        is_read as "isRead",
        created_at as "createdAt"
      FROM messages 
      WHERE id = ${nid}
      LIMIT 1
    `;
    const result = await db.execute(query);
    return result.rows[0] as Message;
  }

  async getMessagesByUser(userId: string | number): Promise<Message[]> {
    const nid = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const query = sql`
      SELECT 
        id,
        content,
        sender_id as "senderId",
        recipient_id as "recipientId",
        application_id as "applicationId",
        is_read as "isRead",
        created_at as "createdAt"
      FROM messages 
      WHERE sender_id = ${nid} OR recipient_id = ${nid}
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  async getConversation(user1Id: string | number, user2Id: string | number): Promise<Message[]> {
    const n1 = typeof user1Id === 'string' ? parseInt(user1Id, 10) : user1Id;
    const n2 = typeof user2Id === 'string' ? parseInt(user2Id, 10) : user2Id;
    const query = sql`
      SELECT 
        id,
        content,
        sender_id as "senderId",
        recipient_id as "recipientId",
        application_id as "applicationId",
        is_read as "isRead",
        created_at as "createdAt"
      FROM messages 
      WHERE 
        (sender_id = ${n1} AND recipient_id = ${n2}) OR
        (sender_id = ${n2} AND recipient_id = ${n1})
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const query = sql`
      INSERT INTO messages (
        content,
        sender_id,
        recipient_id,
        application_id,
        is_read
      ) VALUES (
        ${insertMessage.content},
        ${insertMessage.senderId},
        ${insertMessage.recipientId},
        ${insertMessage.applicationId},
        ${insertMessage.isRead}
      )
      RETURNING 
        id,
        content,
        sender_id as "senderId",
        recipient_id as "recipientId",
        application_id as "applicationId",
        is_read as "isRead",
        created_at as "createdAt"
    `;
    
    const result = await db.execute(query);
    return result.rows[0] as Message;
  }

  async markMessageAsRead(id: string | number): Promise<Message> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const query = sql`
      UPDATE messages 
      SET is_read = true
      WHERE id = ${nid}
      RETURNING 
        id,
        content,
        sender_id as "senderId",
        recipient_id as "recipientId",
        application_id as "applicationId",
        is_read as "isRead",
        created_at as "createdAt"
    `;
    
    const result = await db.execute(query);
    if (!result.rows[0]) throw new Error("Message not found");
    return result.rows[0] as Message;
  }

  // Experiences
  async getExperience(id: string | number): Promise<Experience | undefined> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const query = sql`
      SELECT 
        id,
        title,
        description,
        company,
        user_id as "userId",
        start_date as "startDate",
        end_date as "endDate",
        is_current as "isCurrent"
      FROM experiences 
      WHERE id = ${nid}
      LIMIT 1
    `;
    const result = await db.execute(query);
    return result.rows[0] as Experience;
  }

  async getExperiencesByUser(userId: string | number): Promise<Experience[]> {
    const nid = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const query = sql`
      SELECT 
        id,
        title,
        description,
        company,
        user_id as "userId",
        start_date as "startDate",
        end_date as "endDate",
        is_current as "isCurrent"
      FROM experiences 
      WHERE user_id = ${nid}
      ORDER BY start_date DESC
    `;
    const result = await db.execute(query);
    return result.rows as Experience[];
  }

  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    try {
      console.log('🛠️ Storage: Creating experience with:', insertExperience);
      
      const query = sql`
        INSERT INTO experiences (
          title,
          description,
          company,
          user_id,
          start_date,
          end_date,
          is_current
        ) VALUES (
          ${insertExperience.title},
          ${insertExperience.description},
          ${insertExperience.company},
          ${insertExperience.userId},
          ${insertExperience.startDate},
          ${insertExperience.endDate},
          ${insertExperience.isCurrent}
        )
        RETURNING 
          id,
          title,
          description,
          company,
          user_id as "userId",
          start_date as "startDate",
          end_date as "endDate",
          is_current as "isCurrent"
      `;
      
      const result = await db.execute(query);
      console.log('✅ Storage: Experience created:', result.rows[0]);
      return result.rows[0] as Experience;
    } catch (error) {
      console.error('❌ Storage: Error creating experience:', error);
      throw error;
    }
  }

  async updateExperience(id: string | number, updates: Partial<InsertExperience>): Promise<Experience> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const updateParts: { field: string; value: any }[] = [];

    if (updates.title !== undefined) {
      updateParts.push({ field: 'title', value: updates.title });
    }
    if (updates.description !== undefined) {
      updateParts.push({ field: 'description', value: updates.description });
    }
    if (updates.company !== undefined) {
      updateParts.push({ field: 'company', value: updates.company });
    }
    if (updates.userId !== undefined) {
      updateParts.push({ field: 'user_id', value: updates.userId });
    }
    if (updates.startDate !== undefined) {
      updateParts.push({ field: 'start_date', value: updates.startDate });
    }
    if (updates.endDate !== undefined) {
      updateParts.push({ field: 'end_date', value: updates.endDate });
    }
    if (updates.isCurrent !== undefined) {
      updateParts.push({ field: 'is_current', value: updates.isCurrent });
    }

    const updateFields = sql.join(
      updateParts.map(({ field, value }) => sql`${sql.raw(field)} = ${value}`),
      sql`, `
    );

    const query = sql`
      UPDATE experiences 
      SET ${updateFields}
      WHERE id = ${nid}
      RETURNING 
        id,
        title,
        description,
        company,
        user_id as "userId",
        start_date as "startDate",
        end_date as "endDate",
        is_current as "isCurrent"
    `;

    const result = await db.execute(query);
    if (!result.rows[0]) throw new Error("Experience not found");
    return result.rows[0] as Experience;
  }

  async deleteExperience(id: string | number): Promise<void> {
    const nid = typeof id === 'string' ? parseInt(id, 10) : id;
    const query = sql`DELETE FROM experiences WHERE id = ${nid}`;
    await db.execute(query);
  }

  // Stories
  async createStory(story: {
    title: string;
    content: string;
    tags: string[];
    authorId: number;
    createdAt: Date;
  }): Promise<Story> {
    const query = sql`
      INSERT INTO stories (
        title,
        content,
        author_id,
        tags,
        created_at
      ) VALUES (
        ${story.title},
        ${story.content},
        ${story.authorId},
        ${JSON.stringify(story.tags)},
        ${story.createdAt}
      )
      RETURNING 
        id,
        title,
        content,
        author_id as "authorId",
        tags,
        created_at as "createdAt"
    `;
    
    const result = await db.execute(query);
    return result.rows[0] as Story;
  }

  async getStories(): Promise<any[]> {
    const query = sql`
      SELECT 
        s.id,
        s.title,
        s.content,
        s.author_id as "authorId",
        s.tags,
        s.created_at as "createdAt",
        u.first_name as "authorFirstName",
        u.last_name as "authorLastName"
      FROM stories s
      LEFT JOIN users u ON s.author_id = u.id
      ORDER BY s.created_at DESC
    `;
    
    const result = await db.execute(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.authorId,
      tags: row.tags,
      createdAt: row.createdAt,
      author: {
        firstName: row.authorFirstName,
        lastName: row.authorLastName
      }
    }));
  }
}
export const storage = new DatabaseStorage();