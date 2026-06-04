import { randomUUID } from "node:crypto";
import { type User, type InsertUser, type Company, type InsertCompany, type Job, type InsertJob, type Application, type InsertApplication, type Message, type InsertMessage, type Experience, type InsertExperience, type Story, type ProfessionalProfile, type InsertProfessionalProfile, type Notification } from "../../shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { resolveEmployeeMessagingAccess } from "./lib/messaging-policy";

function parseJobPostingsCount(value: unknown): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Helper function to cast database results to proper types
function castDbResult<T>(result: Record<string, unknown> | null): T | null {
  return result as T | null;
}

function buildUserDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined,
  userType: string | null | undefined,
  companyName: string | null | undefined,
): string {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const type = (userType ?? "").toLowerCase();
  if (type === "employer") {
    if (companyName?.trim()) return companyName.trim();
    if (fullName) return fullName;
    if (email) return email;
    return "Employer";
  }
  if (fullName) return fullName;
  if (email) return email;
  return "User";
}

function mapEnrichedMessageRow(row: Record<string, unknown>) {
  const senderDisplayName = buildUserDisplayName(
    row.sender_first_name as string | undefined,
    row.sender_last_name as string | undefined,
    row.sender_email as string | undefined,
    row.sender_user_type as string | undefined,
    row.sender_company_name as string | undefined,
  );
  const receiverDisplayName = buildUserDisplayName(
    row.receiver_first_name as string | undefined,
    row.receiver_last_name as string | undefined,
    row.receiver_email as string | undefined,
    row.receiver_user_type as string | undefined,
    row.receiver_company_name as string | undefined,
  );

  return {
    ...row,
    senderDisplayName,
    receiverDisplayName,
    senderUserType: row.sender_user_type ?? null,
    receiverUserType: row.receiver_user_type ?? null,
  };
}

export class Storage {
  private mapApplicationRow(row: Record<string, unknown>): Application {
    return {
      id: Number(row.id),
      jobId: row.job_id != null ? String(row.job_id) : row.jobId != null ? String(row.jobId) : null,
      applicantId:
        row.applicant_id != null
          ? String(row.applicant_id)
          : row.applicantId != null
            ? String(row.applicantId)
            : null,
      status: String(row.status ?? "applied"),
      coverLetter:
        row.cover_letter != null
          ? String(row.cover_letter)
          : row.coverLetter != null
            ? String(row.coverLetter)
            : null,
      resume: row.resume != null ? String(row.resume) : null,
      notes: row.notes != null ? String(row.notes) : null,
      appliedAt: (row.applied_at ?? row.appliedAt) as Application["appliedAt"],
      updatedAt: (row.updated_at ?? row.updatedAt) as Application["updatedAt"],
    };
  }

  private mapApplicationWithDetailsRow(row: any) {
    return {
      id: Number(row.id),
      jobId: row.job_id ? String(row.job_id) : null,
      applicantId: row.applicant_id ? String(row.applicant_id) : null,
      status: row.status ? String(row.status) : null,
      coverLetter: row.cover_letter ? String(row.cover_letter) : null,
      resume: row.resume ? String(row.resume) : null,
      notes: row.notes ? String(row.notes) : null,
      appliedAt: row.applied_at ? new Date(String(row.applied_at)) : null,
      updatedAt: row.updated_at ? new Date(String(row.updated_at)) : null,
      job: row.job_id ? {
        id: String(row.job_id),
        title: row.job_title ? String(row.job_title) : null,
        description: row.job_description ? String(row.job_description) : null,
        requirements: row.job_requirements ? String(row.job_requirements) : null,
        location: row.job_location ? String(row.job_location) : null,
        jobType: row.job_type ? String(row.job_type) : null,
        salaryMin: row.salary_min !== null && row.salary_min !== undefined ? Number(row.salary_min) : null,
        salaryMax: row.salary_max !== null && row.salary_max !== undefined ? Number(row.salary_max) : null,
        skills: Array.isArray(row.job_skills) ? row.job_skills : [],
        companyId: row.job_company_id ? String(row.job_company_id) : null,
        employerId: row.job_employer_id ? String(row.job_employer_id) : null,
        isActive: Boolean(row.job_is_active),
        createdAt: row.job_created_at ? new Date(String(row.job_created_at)) : null,
      } : null,
      applicant: row.applicant_id ? {
        id: String(row.applicant_id),
        email: row.applicant_email ? String(row.applicant_email) : null,
        firstName: row.applicant_first_name ? String(row.applicant_first_name) : null,
        lastName: row.applicant_last_name ? String(row.applicant_last_name) : null,
        userType: row.applicant_user_type ? String(row.applicant_user_type) : null,
        location: row.applicant_location ? String(row.applicant_location) : null,
        profilePhoto: row.applicant_profile_photo ? String(row.applicant_profile_photo) : null,
        telephoneNumber: row.applicant_telephone_number ? String(row.applicant_telephone_number) : null,
      } : null,
      company: row.company_id ? {
        id: String(row.company_id),
        name: row.company_name ? String(row.company_name) : null,
        description: row.company_description ? String(row.company_description) : null,
        website: row.company_website ? String(row.company_website) : null,
        location: row.company_location ? String(row.company_location) : null,
        size: row.company_size ? String(row.company_size) : null,
        industry: row.company_industry ? String(row.company_industry) : null,
        logo: row.company_logo ? String(row.company_logo) : null,
        ownerId: row.company_owner_id ? String(row.company_owner_id) : null,
      } : null,
    };
  }

  // User methods
  async getUser(id: string): Promise<User | null> {
    try {
      const result = await db.execute(sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`);
      return result.rows[0] as User | null;
    } catch (error) {
      console.error('Error in getUser:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.execute(sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`);
      return castDbResult<User>(result.rows[0]);
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.execute(sql`SELECT * FROM users`);
      return result.rows as User[];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  /** Platform HR contacts (admin users) for employee messaging. */
  async getHrContactUsers(): Promise<User[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM users
        WHERE LOWER(TRIM(user_type)) = 'admin'
        ORDER BY created_at ASC
      `);
      return result.rows as User[];
    } catch (error) {
      console.error('Error in getHrContactUsers:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.execute(sql`
        INSERT INTO users (
          id, email, password, user_type, first_name, last_name,
          location, profile_photo, telephone_number, created_at
        ) VALUES (
          ${randomUUID()},
          ${user.email},
          ${user.password},
          ${user.userType},
          ${user.firstName},
          ${user.lastName},
          ${user.location || null},
          ${user.profilePhoto || null},
          ${user.telephoneNumber || null},
          ${new Date()}
        ) RETURNING *
      `);
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const setClauses: any[] = [];

      if (updates.email !== undefined) setClauses.push(sql`email = ${updates.email}`);
      if (updates.password !== undefined) setClauses.push(sql`password = ${updates.password}`);
      if (updates.firstName !== undefined) setClauses.push(sql`first_name = ${updates.firstName}`);
      if (updates.lastName !== undefined) setClauses.push(sql`last_name = ${updates.lastName}`);
      if (updates.userType !== undefined) setClauses.push(sql`user_type = ${updates.userType}`);
      if (updates.location !== undefined) setClauses.push(sql`location = ${updates.location}`);
      if (updates.profilePhoto !== undefined) setClauses.push(sql`profile_photo = ${updates.profilePhoto}`);
      if (updates.telephoneNumber !== undefined) setClauses.push(sql`telephone_number = ${updates.telephoneNumber}`);
      const accountStatus = (updates as { accountStatus?: string }).accountStatus;
      if (accountStatus !== undefined) {
        setClauses.push(sql`account_status = ${accountStatus}`);
      }

      if (setClauses.length === 0) {
        throw new Error("No valid fields to update");
      }

      const result = await db.execute(
        sql`UPDATE users SET ${sql.join(setClauses, sql`, `)} WHERE id = ${id} RETURNING *`
      );

      if (!result.rows[0]) {
        throw new Error("User not found");
      }
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async updateUserProfilePhoto(id: string, profilePhoto: string | null): Promise<User> {
    try {
      const result = await db.execute(
        sql`UPDATE users SET profile_photo = ${profilePhoto} WHERE id = ${id} RETURNING *`
      );
      if (!result.rows[0]) {
        throw new Error("User not found");
      }
      return result.rows[0] as User;
    } catch (error) {
      console.error("Error in updateUserProfilePhoto:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // Messages reference applications (ON DELETE NO ACTION)
      await db.execute(sql`
        DELETE FROM messages
        WHERE application_id IN (
          SELECT a.id FROM applications a
          LEFT JOIN jobs j ON a.job_id = j.id
          WHERE a.applicant_id = ${id} OR j.employer_id = ${id}
        )
      `);

      await db.execute(sql`DELETE FROM applications WHERE applicant_id = ${id}`);

      const companiesResult = await db.execute(
        sql`SELECT id FROM companies WHERE owner_id = ${id}`
      );
      for (const row of companiesResult.rows) {
        await this.deleteCompany(String((row as { id: string }).id));
      }

      await db.execute(sql`
        DELETE FROM messages
        WHERE application_id IN (
          SELECT id FROM applications
          WHERE job_id IN (SELECT id FROM jobs WHERE employer_id = ${id})
        )
      `);
      await db.execute(sql`
        DELETE FROM applications
        WHERE job_id IN (SELECT id FROM jobs WHERE employer_id = ${id})
      `);
      await db.execute(sql`DELETE FROM jobs WHERE employer_id = ${id}`);

      const result = await db.execute(sql`DELETE FROM users WHERE id = ${id} RETURNING id`);
      if (!result.rows[0]) {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error('Error in deleteUser:', error);
      const pgCode = error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
      if (pgCode === "23503") {
        throw new Error(
          "Cannot delete user: related records still exist. Remove linked jobs or companies first."
        );
      }
      throw error;
    }
  }

  async softDeleteUser(id: string): Promise<User> {
    try {
      const result = await db.execute(sql`
        UPDATE users 
        SET 
          first_name = 'Deleted', 
          last_name = 'User', 
          email = ${'deleted_' + id + '@example.com'}, 
          telephone_number = NULL,
          profile_photo = NULL,
          account_status = 'deleted'
        WHERE id = ${id}
        RETURNING *
      `);
      if (!result.rows[0]) {
        throw new Error("User not found");
      }
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in softDeleteUser:', error);
      throw error;
    }
  }

    // Jobs
  async getJobs(filters: {
    location?: string;
    skills?: string[];
    jobType?: string;
    search?: string;
    page?: number;
    itemsPerPage?: number;
    includeInactive?: boolean;
  } = {}): Promise<{ jobs: Job[]; totalCount: number }> {
    try {
      console.log('Getting jobs with filters:', filters);

      // Check connection first
      await this.checkConnection();

      // Build the SQL query
      let query = sql`
        SELECT 
          j.*,
          c.name as company_name,
          c.location as company_location,
          c.industry as company_industry,
          c.size as company_size
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE 1=1
      `;

      if (!filters.includeInactive) {
        query = sql`${query} AND j.is_active = true`;
      }

      // Add search conditions
      if (filters.search) {
        query = sql`${query} AND (
          j.title ILIKE ${`%${filters.search}%`} OR
          j.description ILIKE ${`%${filters.search}%`}
        )`;
      }

      // Add job type filter
      if (filters.jobType) {
        query = sql`${query} AND j.job_type = ${filters.jobType}`;
      }

      // Add location filter
      if (filters.location) {
        query = sql`${query} AND j.location ILIKE ${`%${filters.location}%`}`;
      }

      // Add skills filter
      if (filters.skills?.length) {
        const skillConditions = filters.skills.map(skill => 
          sql`j.skills::jsonb @> ${JSON.stringify([skill])}::jsonb` 
        );
        if (skillConditions.length) {
          query = sql`${query} AND (${sql.join(skillConditions, sql` OR `)})`;
        }
      }

      // Get total count first
      const countQuery = sql`SELECT COUNT(*) FROM (${query}) AS temp`;
      const countResult = await db.execute(countQuery);
      const totalCount = parseInt(String(countResult.rows[0]?.count) || '0');

      // Add order by and pagination
      query = sql`${query} ORDER BY j.created_at DESC`;
      
      if (filters.page && filters.itemsPerPage) {
        const offset = (filters.page - 1) * filters.itemsPerPage;
        query = sql`${query} LIMIT ${filters.itemsPerPage} OFFSET ${offset}`;
      }

      console.log('Executing query for jobs');
      const result = await db.execute(query);
      const jobs = result.rows.map((row: any) => {
        // Ensure skills is always an array
        const skills = Array.isArray(row.skills) ? row.skills : [];
        
        // Format the job data to match the Job interface
        return {
          id: String(row.id),
          title: String(row.title),
          description: String(row.description),
          requirements: String(row.requirements),
          location: String(row.location),
          jobType: String(row.job_type),
          salaryMin: Number(row.salary_min),
          salaryMax: Number(row.salary_max),
          skills: skills,
          companyId: row.company_id != null ? String(row.company_id) : null,
          employerId: row.employer_id != null ? String(row.employer_id) : null,
          deadline: row.deadline ? new Date(row.deadline) : null,
          isActive: Boolean(row.is_active),
          status: String(row.status || 'active'),
          createdAt: new Date(row.created_at),
          company: row.company_name ? {
            name: String(row.company_name),
            location: String(row.company_location),
            industry: String(row.company_industry),
            size: String(row.company_size)
          } : null
        };
      });

      console.log(`Found ${jobs.length} jobs out of ${totalCount} total`);

      return { jobs, totalCount };
    } catch (error) {
      console.error('Error in getJobs:', error);
      // Add better error context
      if (error instanceof Error) {
        if (error.message.includes('connection')) {
          throw new Error('Database connection failed. Please try again.');
        }
        if (error.message.includes('relation "jobs" does not exist')) {
          throw new Error('Jobs table not found. Database may not be properly initialized.');
        }
      }
      throw error;
    }
  }

  private mapJobRow(row: Record<string, unknown>): Job {
    const skills = Array.isArray(row.skills) ? row.skills : [];
    return {
      id: String(row.id),
      title: String(row.title ?? ""),
      description: row.description != null ? String(row.description) : null,
      requirements: row.requirements != null ? String(row.requirements) : null,
      location: row.location != null ? String(row.location) : null,
      jobType: row.job_type != null ? String(row.job_type) : row.jobType != null ? String(row.jobType) : null,
      salaryMin: row.salary_min != null ? Number(row.salary_min) : row.salaryMin != null ? Number(row.salaryMin) : null,
      salaryMax: row.salary_max != null ? Number(row.salary_max) : row.salaryMax != null ? Number(row.salaryMax) : null,
      skills: skills as Job["skills"],
      companyId: row.company_id != null ? String(row.company_id) : row.companyId != null ? String(row.companyId) : null,
      employerId: row.employer_id != null ? String(row.employer_id) : row.employerId != null ? String(row.employerId) : null,
      deadline: row.deadline ? new Date(String(row.deadline)) : null,
      isActive: Boolean(row.is_active ?? row.isActive ?? true),
      createdAt: (row.created_at ?? row.createdAt) as Job["createdAt"],
    } as Job;
  }

  async getJob(id: string | null): Promise<Job | null> {
    try {
      if (!id || !String(id).trim()) {
        console.log('No job ID provided to getJob');
        return null;
      }

      const result = await db.execute(sql`
        SELECT * 
        FROM jobs 
        WHERE id = ${String(id)}
      `);
      const row = result.rows[0] as Record<string, unknown> | undefined;
      return row ? this.mapJobRow(row) : null;
    } catch (error) {
      console.error('Error in getJob:', error);
      throw error;
    }
  }

  async updateJob(id: string, updates: Partial<Job & { status?: string }>): Promise<Job> {
    try {
      const setParts: any[] = [];
      
      // Map camelCase to snake_case and handle status field
      if (updates.title !== undefined) {
        setParts.push(sql`title = ${updates.title}`);
      }
      if (updates.description !== undefined) {
        setParts.push(sql`description = ${updates.description}`);
      }
      if (updates.requirements !== undefined) {
        setParts.push(sql`requirements = ${updates.requirements}`);
      }
      if (updates.location !== undefined) {
        setParts.push(sql`location = ${updates.location}`);
      }
      if (updates.jobType !== undefined) {
        setParts.push(sql`job_type = ${updates.jobType}`);
      }
      if (updates.salaryMin !== undefined) {
        setParts.push(sql`salary_min = ${updates.salaryMin}`);
      }
      if (updates.salaryMax !== undefined) {
        setParts.push(sql`salary_max = ${updates.salaryMax}`);
      }
      if (updates.skills !== undefined) {
        setParts.push(sql.raw(`skills = '${JSON.stringify(updates.skills).replace(/'/g, "''")}'::jsonb`));
      }
      if (updates.companyId !== undefined) {
        setParts.push(sql`company_id = ${updates.companyId}`);
      }
      if (updates.employerId !== undefined) {
        setParts.push(sql`employer_id = ${updates.employerId}`);
      }
      if (updates.deadline !== undefined) {
        setParts.push(sql`deadline = ${updates.deadline ? new Date(String(updates.deadline)) : null}`);
      }
      
      // Handle status field - map 'active'/'paused' to is_active boolean AND save the status string
      if ((updates as any).status !== undefined) {
        const status = (updates as any).status;
        const isActive = status === 'active' || status === 'Active';
        setParts.push(sql`is_active = ${isActive}`);
        setParts.push(sql`status = ${status}`);
      } else if (updates.isActive !== undefined) {
        setParts.push(sql`is_active = ${updates.isActive}`);
      }

      if (setParts.length === 0) {
        throw new Error('No fields to update');
      }

      // Build the SET clause by joining all parts
      const setClause = setParts.reduce((acc, curr, index) => {
        return index === 0 ? curr : sql`${acc}, ${curr}`;
      });

      const result = await db.execute(sql`
        UPDATE jobs 
        SET ${setClause}
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Job not found');
      }

      return castDbResult<Job>(result.rows[0]);
    } catch (error) {
      console.error('Error in updateJob:', error);
      throw error;
    }
  }



  async deleteJob(id: string): Promise<void> {
    try {
      await db.execute(sql`DELETE FROM jobs WHERE id = ${id}`);
    } catch (error) {
      console.error('Error in deleteJob:', error);
      throw error;
    }
  }

  async getCompany(id: string) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM companies WHERE id = ${id} LIMIT 1`
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getCompany:', error);
      throw error;
    }
  }

  async countActiveJobsByCompany(companyId: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM jobs
        WHERE company_id = ${companyId} AND COALESCE(is_active, true) = true
      `);
      const row = result.rows[0] as { count?: number } | undefined;
      return Number(row?.count ?? 0);
    } catch (error) {
      console.error('Error in countActiveJobsByCompany:', error);
      return 0;
    }
  }

  async createJob(job: Omit<InsertJob, 'id'>): Promise<Job> {
    try {
      let companyId = job.companyId ?? null;
      if (!companyId && job.employerId) {
        const ownedCompanies = await this.getCompaniesByOwner(String(job.employerId));
        const firstCompany = ownedCompanies[0] as { id?: string | number } | undefined;
        if (firstCompany?.id != null) {
          companyId = String(firstCompany.id);
        }
      }

      const result = await db.execute(sql`
        INSERT INTO jobs (
          id,
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
          deadline,
          is_active,
          created_at
        ) VALUES (
          ${randomUUID()},
          ${job.title},
          ${job.description},
          ${job.requirements},
          ${job.location},
          ${job.jobType},
          ${job.salaryMin || null},
          ${job.salaryMax || null},
          ${sql.raw(`'${JSON.stringify(job.skills || [])}'::jsonb`)},
          ${companyId},
          ${job.employerId},
          ${job.deadline ? new Date(String(job.deadline)) : null},
          ${job.isActive !== false},
          ${new Date()}
        ) RETURNING *
      `);
      return result.rows[0] as Job;
    } catch (error) {
      console.error('Error in createJob:', error);
      throw error;
    }
  }

  // Stories
  async createStory(story: {
    title: string;
    content: string;
    tags: string[];
    submitterName?: string;
    submitterEmail?: string;
    authorId: string | null;
    createdAt: Date;
  }): Promise<{
    id: number;
    title: string;
    content: string;
    authorId: string | null;
    submitterName: string | null;
    submitterEmail: string | null;
    tags: string[];
    createdAt: Date;
  }> {
    try {
      console.log('Creating story with data:', story);

      // Reset the sequence to prevent duplicate key errors
      await db.execute(sql`SELECT setval('stories_id_seq', (SELECT COALESCE(MAX(id) + 1, 1) FROM stories), false);`);
      
      // Ensure tags is an array and has no empty strings
      const cleanTags = (story.tags || []).filter(tag => tag.trim().length > 0);
      console.log('Clean tags:', cleanTags);
      
      const tagsValue = cleanTags.length > 0 ? `{${cleanTags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}` : '{}';
      const query = sql`
        INSERT INTO stories (
          title, content, author_id, submitter_name, submitter_email, tags, created_at
        ) VALUES (
          ${story.title},
          ${story.content},
          ${story.authorId},
          ${story.submitterName || null},
          ${story.submitterEmail || null},
          ${tagsValue}::text[],
          ${story.createdAt}
        ) RETURNING 
          id,
          title,
          content,
          author_id as "authorId",
          submitter_name as "submitterName",
          submitter_email as "submitterEmail",
          tags,
          created_at as "createdAt"
      `;
      
      console.log('Executing query...');
      const result = await db.execute(query);
      console.log('Query result:', result.rows[0]);
      
      if (!result.rows[0]) {
        throw new Error('Failed to create story');
      }

      const row = result.rows[0];
      return {
        id: Number(row.id),
        title: String(row.title),
        content: String(row.content),
        authorId: row.authorId ? String(row.authorId) : null,
        submitterName: row.submitterName ? String(row.submitterName) : null,
        submitterEmail: row.submitterEmail ? String(row.submitterEmail) : null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt))
      };
    } catch (error) {
      console.error('Error in createStory:', error);
      throw error;
    }
  }
  // Professional Profile methods
  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    try {
      const existing = await this.getProfessionalProfileByUserId(profile.userId);
      if (existing) {
        return existing;
      }

      const nextIdResult = await db.execute(
        sql`SELECT COALESCE(MAX(id), 0) + 1 AS id FROM professional_profiles`
      );
      const nextId = Number((nextIdResult.rows[0] as { id: number | string }).id);

      const result = await db.execute(sql`
        INSERT INTO professional_profiles (
          id,
          user_id,
          headline,
          bio,
          skills,
          resume_url,
          resume_name,
          experience,
          education
        ) VALUES (
          ${nextId},
          ${profile.userId},
          ${profile.headline || null},
          ${profile.bio || null},
          ${JSON.stringify(profile.skills || [])}::jsonb,
          ${(profile as { resumeUrl?: string | null }).resumeUrl || null},
          ${(profile as { resumeName?: string | null }).resumeName || null},
          ${JSON.stringify((profile as any).experience || [])}::jsonb,
          ${JSON.stringify((profile as any).education || [])}::jsonb
        ) RETURNING *
      `);
      return result.rows[0] as ProfessionalProfile;
    } catch (error) {
      console.error('Error in createProfessionalProfile:', error);
      throw error;
    }
  }

  async getProfessionalProfileByUserId(userId: string): Promise<ProfessionalProfile | null> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM professional_profiles WHERE user_id = ${userId} LIMIT 1`
      );
      return result.rows[0] as ProfessionalProfile | null;
    } catch (error) {
      console.error('Error in getProfessionalProfileByUserId:', error);
      throw error;
    }
  }

  async updateProfessionalProfileResume(
    userId: string,
    resumeUrl: string,
    resumeName: string
  ): Promise<ProfessionalProfile> {
    try {
      const existing = await this.getProfessionalProfileByUserId(userId);
      if (!existing) {
        return await this.createProfessionalProfile({
          userId,
          headline: null,
          bio: null,
          skills: [],
          resumeUrl,
          resumeName,
        } as InsertProfessionalProfile);
      }

      const result = await db.execute(sql`
        UPDATE professional_profiles
        SET resume_url = ${resumeUrl}, resume_name = ${resumeName}
        WHERE user_id = ${userId}
        RETURNING *
      `);
      return result.rows[0] as ProfessionalProfile;
    } catch (error) {
      console.error('Error in updateProfessionalProfileResume:', error);
      throw error;
    }
  }

  async clearProfessionalProfileResume(userId: string): Promise<ProfessionalProfile | null> {
    try {
      const result = await db.execute(sql`
        UPDATE professional_profiles
        SET resume_url = NULL, resume_name = NULL
        WHERE user_id = ${userId}
        RETURNING *
      `);
      return (result.rows[0] as ProfessionalProfile) || null;
    } catch (error) {
      console.error('Error in clearProfessionalProfileResume:', error);
      throw error;
    }
  }

  async updateProfessionalProfile(userId: string, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile> {
    try {
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      const query = sql`
        UPDATE professional_profiles 
        SET 
          headline = COALESCE(${updates.headline ?? null}, headline),
          bio = COALESCE(${updates.bio ?? null}, bio),
          skills = COALESCE(${updates.skills ? JSON.stringify(updates.skills) : null}::jsonb, skills),
          resume_url = COALESCE(${updates.resumeUrl ?? null}, resume_url),
          resume_name = COALESCE(${updates.resumeName ?? null}, resume_name),
          experience = COALESCE(${updates.experience ? JSON.stringify(updates.experience) : null}::jsonb, experience),
          education = COALESCE(${updates.education ? JSON.stringify(updates.education) : null}::jsonb, education)
        WHERE user_id = ${userId}
        RETURNING *
      `;

      const result = await db.execute(query);

      if (!result.rows[0]) {
        // Profile row may not exist yet for older users; create it instead of failing.
        return await this.createProfessionalProfile({
          userId,
          headline: updates.headline || null,
          bio: updates.bio || null,
          skills: Array.isArray(updates.skills) ? updates.skills : [],
        });
      }

      return result.rows[0] as ProfessionalProfile;
    } catch (error) {
      console.error('Error in updateProfessionalProfile:', error);
      throw error;
    }
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const companyId = randomUUID();
      const result = await db.execute(sql`
        INSERT INTO companies (
          id,
          name,
          description,
          website,
          location,
          industry,
          size,
          owner_id,
          created_at
        ) VALUES (
          ${companyId},
          ${company.name},
          ${company.description || null},
          ${company.website || null},
          ${company.location || null},
          ${company.industry || null},
          ${company.size || null},
          ${company.ownerId},
          ${new Date()}
        ) RETURNING *
      `);
      return result.rows[0] as Company;
    } catch (error) {
      console.error('Error in createCompany:', error);
      throw error;
    }
  }

  async getCompaniesByOwner(ownerId: string): Promise<Company[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM companies WHERE owner_id = ${ownerId}`
      );
      return result.rows as Company[];
    } catch (error) {
      console.error('Error in getCompaniesByOwner:', error);
      throw error;
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      const result = await db.execute(sql`SELECT * FROM companies`);
      return result.rows as Company[];
    } catch (error) {
      console.error('Error in getAllCompanies:', error);
      throw error;
    }
  }

  async getAllCompaniesWithDetails(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          c.*,
          u.email AS owner_email,
          u.first_name AS owner_first_name,
          u.last_name AS owner_last_name,
          u.user_type AS owner_user_type,
          COALESCE((
            SELECT COUNT(j.id)::int
            FROM jobs j
            WHERE j.company_id = c.id
          ), 0) AS job_postings
        FROM companies c
        LEFT JOIN users u ON c.owner_id = u.id
        ORDER BY job_postings DESC, c.name ASC
      `);

      return result.rows.map((row: any) => ({
        id: row.id ? String(row.id) : "",
        name: row.name ? String(row.name) : "",
        description: row.description ? String(row.description) : null,
        website: row.website ? String(row.website) : null,
        location: row.location ? String(row.location) : null,
        size: row.size ? String(row.size) : null,
        industry: row.industry ? String(row.industry) : null,
        logo: row.logo ? String(row.logo) : null,
        ownerId: row.owner_id ? String(row.owner_id) : null,
        createdAt: row.created_at ? new Date(String(row.created_at)) : null,
        ownerEmail: row.owner_email ? String(row.owner_email) : null,
        ownerFirstName: row.owner_first_name ? String(row.owner_first_name) : null,
        ownerLastName: row.owner_last_name ? String(row.owner_last_name) : null,
        ownerUserType: row.owner_user_type ? String(row.owner_user_type) : null,
        jobPostings: parseJobPostingsCount(row.job_postings),
        status: row.owner_id ? "approved" : "pending",
      }));
    } catch (error) {
      console.error('Error in getAllCompaniesWithDetails:', error);
      throw error;
    }
  }

  async updateCompany(id: string, updates: Partial<Company & { profileScore?: number }>): Promise<Company> {
    try {
      const setParts: any[] = [];

      // Map camelCase to snake_case and build SQL parts
      if (updates.name !== undefined) {
        setParts.push(sql`name = ${updates.name}`);
      }
      if (updates.description !== undefined) {
        setParts.push(sql`description = ${updates.description}`);
      }
      if (updates.website !== undefined) {
        setParts.push(sql`website = ${updates.website}`);
      }
      if (updates.location !== undefined) {
        setParts.push(sql`location = ${updates.location}`);
      }
      if (updates.industry !== undefined) {
        setParts.push(sql`industry = ${updates.industry}`);
      }
      if (updates.size !== undefined) {
        setParts.push(sql`size = ${updates.size}`);
      }
      if (updates.logo !== undefined) {
        setParts.push(sql`logo = ${updates.logo}`);
      }
      if ((updates as { coverImage?: string | null }).coverImage !== undefined) {
        setParts.push(sql`cover_image = ${(updates as { coverImage?: string | null }).coverImage}`);
      }
      if ((updates as { culture?: unknown }).culture !== undefined) {
        const cultureJson = JSON.stringify((updates as { culture?: unknown }).culture ?? { tags: [], benefits: [] });
        setParts.push(sql`culture = ${cultureJson}::jsonb`);
      }
      // Allow ownerId to be updated (for claiming companies without owners)
      if ((updates as any).ownerId !== undefined) {
        setParts.push(sql`owner_id = ${(updates as any).ownerId}`);
      }
      // Handle profileScore separately if needed (it's not in Company schema)
      if ((updates as any).profileScore !== undefined) {
        // Skip - profileScore is calculated on-the-fly
      }

      if (setParts.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Build the SET clause by joining all parts
      const setClause = setParts.reduce((acc, curr, index) => {
        return index === 0 ? curr : sql`${acc}, ${curr}`;
      });

      const result = await db.execute(
        sql`UPDATE companies SET ${setClause} WHERE id = ${id} RETURNING *`
      );

      return result.rows[0] as Company;
    } catch (error) {
      console.error('Error in updateCompany:', error);
      throw error;
    }
  }

  async deleteCompany(id: string): Promise<void> {
    try {
      await db.execute(sql`
        DELETE FROM messages
        WHERE application_id IN (
          SELECT id FROM applications
          WHERE job_id IN (SELECT id FROM jobs WHERE company_id = ${id})
        )
      `);
      await db.execute(sql`
        DELETE FROM applications
        WHERE job_id IN (
          SELECT id FROM jobs WHERE company_id = ${id}
        )
      `);
      await db.execute(sql`DELETE FROM jobs WHERE company_id = ${id}`);
      await db.execute(sql`DELETE FROM companies WHERE id = ${id}`);
    } catch (error) {
      console.error('Error in deleteCompany:', error);
      throw error;
    }
  }

  // Calculate profile completion score for a company
  async calculateCompanyProfileScore(company: Company | null, user: any): Promise<number> {
    if (!company) return 0;

    let totalFields = 0;
    let completedFields = 0;

    // Core company fields
    const fields = [
      { key: 'name', value: company.name },
      { key: 'industry', value: company.industry },
      { key: 'location', value: company.location },
      { key: 'size', value: company.size },
      { key: 'description', value: company.description },
      { key: 'website', value: company.website },
      { key: 'logo', value: company.logo }
    ];

    fields.forEach(field => {
      totalFields++;
      if (field.value && String(field.value).trim() !== '') {
        completedFields++;
      }
    });

    // Contact info from user
    if (user?.email) {
      totalFields++;
      completedFields++;
    }
    if (user?.telephoneNumber) {
      totalFields++;
      if (user.telephoneNumber.trim() !== '') completedFields++;
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  // Stories methods
  private mapStoryRow(row: Record<string, unknown>): Story & {
    name: string;
    submitterName: string | null;
    submitterEmail: string | null;
    author?: { firstName: string; lastName: string } | null;
    authorUserType?: string | null;
  } {
    const authorFirstName = row.authorFirstName ?? row.author_first_name;
    const authorLastName = row.authorLastName ?? row.author_last_name;
    const authorEmail = row.authorEmail ?? row.author_email;
    const authorName = [authorFirstName, authorLastName]
      .map((part) => (part != null ? String(part).trim() : ""))
      .filter(Boolean)
      .join(" ");
    const submitterName = row.submitterName ?? row.submitter_name;
    const submitterEmail = row.submitterEmail ?? row.submitter_email;
    const displayName =
      submitterName != null && String(submitterName).trim()
        ? String(submitterName).trim()
        : authorName ||
          (submitterEmail != null && String(submitterEmail).trim() ? String(submitterEmail).trim() : "") ||
          (authorEmail != null && String(authorEmail).trim() ? String(authorEmail).trim() : "") ||
          "Unknown User";

    return {
      ...(row as any),
      id: Number(row.id),
      title: String(row.title ?? ""),
      content: String(row.content ?? ""),
      tags: Array.isArray(row.tags) ? row.tags : [],
      authorId:
        row.authorId != null
          ? String(row.authorId)
          : row.author_id != null
            ? String(row.author_id)
            : null,
      submitterName: displayName,
      submitterEmail:
        submitterEmail != null
          ? String(submitterEmail)
            : null,
      name: displayName,
      approved: Boolean(row.approved),
      featured: Boolean(row.featured),
      views: row.views != null ? Number(row.views) : 0,
      createdAt: (row.createdAt ?? row.created_at) as Story["createdAt"],
      updatedAt: (row.updatedAt ?? row.updated_at) as Story["updatedAt"],
      author: authorName
        ? {
            firstName: authorFirstName != null ? String(authorFirstName) : "",
            lastName: authorLastName != null ? String(authorLastName) : "",
          }
        : null,
      authorUserType:
        row.authorUserType != null
          ? String(row.authorUserType)
          : row.author_user_type != null
            ? String(row.author_user_type)
            : null,
    };
  }

  async getPaginatedStories(limit: number, offset: number): Promise<Story[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          s.id,
          s.title,
          s.content,
          s.tags,
          s.submitter_name AS "submitterName",
          s.submitter_email AS "submitterEmail",
          s.author_id AS "authorId",
          s.approved,
          s.featured,
          s.views,
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt",
          u.first_name AS "authorFirstName",
          u.last_name AS "authorLastName",
          u.email AS "authorEmail",
          u.user_type AS "authorUserType"
        FROM stories s
        LEFT JOIN users u ON s.author_id = u.id
        WHERE s.approved = true
        ORDER BY s.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      return result.rows.map((row) => this.mapStoryRow(row as Record<string, unknown>)) as Story[];
    } catch (error) {
      console.error('Error in getPaginatedStories:', error);
      throw error;
    }
  }

  async getStoryCount(): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*)::int AS count FROM stories WHERE approved = true
      `);
      return parseInt(String(result.rows[0]?.count || '0'));
    } catch (error) {
      console.error('Error in getStoryCount:', error);
      throw error;
    }
  }

  async getAllStories(): Promise<(Story & { authorUserType?: string | null })[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          s.*,
          s.submitter_name AS "submitterName",
          s.submitter_email AS "submitterEmail",
          s.author_id AS "authorId",
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt",
          u.first_name AS "authorFirstName",
          u.last_name AS "authorLastName",
          u.email AS "authorEmail",
          u.user_type AS "authorUserType"
        FROM stories s
        LEFT JOIN users u ON s.author_id = u.id
        ORDER BY s.featured DESC, s.created_at DESC
      `);
      return result.rows.map((row) => this.mapStoryRow(row as Record<string, unknown>)) as (Story & { authorUserType?: string | null })[];
    } catch (error) {
      console.error('Error in getAllStories:', error);
      throw error;
    }
  }

  async updateStoryApproval(id: string, approved: boolean): Promise<Story | null> {
    try {
      const result = await db.execute(sql`
        UPDATE stories 
        SET 
          approved = ${approved},
          updated_at = ${new Date()}
        WHERE id = ${id}
        RETURNING *
      `);
      return result.rows[0] ? this.mapStoryRow(result.rows[0] as Record<string, unknown>) : null;
    } catch (error) {
      console.error('Error in updateStoryApproval:', error);
      throw error;
    }
  }

  async deleteStory(id: string): Promise<void> {
    try {
      await db.execute(sql`DELETE FROM stories WHERE id = ${id}`);
    } catch (error) {
      console.error('Error in deleteStory:', error);
      throw error;
    }
  }

  // Helper method to check database connection
  async checkConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  // Message methods
  async getConversation(userId: string, otherUserId: string): Promise<Message[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          m.*,
          s.first_name AS sender_first_name,
          s.last_name AS sender_last_name,
          s.email AS sender_email,
          s.user_type AS sender_user_type,
          sc.name AS sender_company_name,
          r.first_name AS receiver_first_name,
          r.last_name AS receiver_last_name,
          r.email AS receiver_email,
          r.user_type AS receiver_user_type,
          rc.name AS receiver_company_name
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        LEFT JOIN (
          SELECT owner_id, MIN(name) AS name FROM companies GROUP BY owner_id
        ) sc ON sc.owner_id = s.id
        LEFT JOIN (
          SELECT owner_id, MIN(name) AS name FROM companies GROUP BY owner_id
        ) rc ON rc.owner_id = r.id
        WHERE (m.sender_id = ${userId} AND m.receiver_id = ${otherUserId})
        OR (m.sender_id = ${otherUserId} AND m.receiver_id = ${userId})
        ORDER BY m.created_at ASC
      `);
      return result.rows.map((row) => mapEnrichedMessageRow(row as Record<string, unknown>)) as unknown as Message[];
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw error;
    }
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          m.*,
          s.first_name AS sender_first_name,
          s.last_name AS sender_last_name,
          s.email AS sender_email,
          s.user_type AS sender_user_type,
          sc.name AS sender_company_name,
          r.first_name AS receiver_first_name,
          r.last_name AS receiver_last_name,
          r.email AS receiver_email,
          r.user_type AS receiver_user_type,
          rc.name AS receiver_company_name
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        LEFT JOIN (
          SELECT owner_id, MIN(name) AS name FROM companies GROUP BY owner_id
        ) sc ON sc.owner_id = s.id
        LEFT JOIN (
          SELECT owner_id, MIN(name) AS name FROM companies GROUP BY owner_id
        ) rc ON rc.owner_id = r.id
        WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
        ORDER BY m.created_at DESC
      `);
      return result.rows.map((row) => mapEnrichedMessageRow(row as Record<string, unknown>)) as unknown as Message[];
    } catch (error) {
      console.error('Error in getMessagesByUser:', error);
      throw error;
    }
  }

  async createMessage(message: {
    senderId: string;
    receiverId: string;
    content: string;
    applicationId?: number | null;
  }): Promise<Message> {
    try {
      const applicationId =
        message.applicationId != null && !Number.isNaN(Number(message.applicationId))
          ? Number(message.applicationId)
          : null;

      const result = await db.execute(sql`
        INSERT INTO messages (
          sender_id,
          receiver_id,
          application_id,
          content,
          is_read,
          created_at
        ) VALUES (
          ${message.senderId},
          ${message.receiverId},
          ${applicationId},
          ${message.content},
          ${false},
          ${new Date()}
        ) RETURNING *
      `);
      return result.rows[0] as Message;
    } catch (error) {
      console.error('Error in createMessage:', error);
      throw error;
    }
  }

  async getApplicationMessagingContext(applicationId: number): Promise<{
    applicationId: number;
    applicantId: string;
    employerId: string;
    jobId: string;
    jobTitle: string | null;
    companyName: string | null;
    status: string;
    employerHasMessaged: boolean;
  } | null> {
    try {
      const result = await db.execute(sql`
        SELECT
          a.id AS application_id,
          a.applicant_id,
          a.status,
          j.id AS job_id,
          j.title AS job_title,
          j.employer_id,
          c.name AS company_name,
          EXISTS (
            SELECT 1 FROM messages m
            WHERE m.application_id = a.id
              AND m.sender_id = j.employer_id
          ) AS employer_has_messaged
        FROM applications a
        INNER JOIN jobs j ON a.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE a.id = ${applicationId}
        LIMIT 1
      `);
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row?.application_id || !row.applicant_id || !row.employer_id) return null;
      return {
        applicationId: Number(row.application_id),
        applicantId: String(row.applicant_id),
        employerId: String(row.employer_id),
        jobId: String(row.job_id),
        jobTitle: row.job_title != null ? String(row.job_title) : null,
        companyName: row.company_name != null ? String(row.company_name) : null,
        status: String(row.status ?? "applied"),
        employerHasMessaged: Boolean(row.employer_has_messaged),
      };
    } catch (error) {
      console.error('Error in getApplicationMessagingContext:', error);
      throw error;
    }
  }

  async findApplicationForMessagingPair(
    applicantId: string,
    employerId: string,
    applicationId?: number | null
  ): Promise<Awaited<ReturnType<Storage['getApplicationMessagingContext']>>> {
    if (applicationId != null) {
      const ctx = await this.getApplicationMessagingContext(applicationId);
      if (
        ctx &&
        ctx.applicantId === String(applicantId) &&
        ctx.employerId === String(employerId)
      ) {
        return ctx;
      }
      return null;
    }

    try {
      const result = await db.execute(sql`
        SELECT a.id AS application_id
        FROM applications a
        INNER JOIN jobs j ON a.job_id = j.id
        WHERE a.applicant_id = ${applicantId}
          AND j.employer_id = ${employerId}
        ORDER BY a.applied_at DESC
        LIMIT 1
      `);
      const id = result.rows[0]?.application_id;
      if (id == null) return null;
      return this.getApplicationMessagingContext(Number(id));
    } catch (error) {
      console.error('Error in findApplicationForMessagingPair:', error);
      throw error;
    }
  }

  async getRecruiterThreadsForApplicant(applicantId: string): Promise<
    Array<{
      applicationId: number;
      jobId: string;
      jobTitle: string | null;
      companyName: string | null;
      employerId: string;
      employerName: string;
      status: string;
      employerHasMessaged: boolean;
      canSend: boolean;
      unlockReason: string | null;
      lastMessage: string | null;
      lastMessageAt: string | null;
      unreadCount: number;
    }>
  > {
    try {
      const result = await db.execute(sql`
        SELECT
          a.id AS application_id,
          a.status,
          j.id AS job_id,
          j.title AS job_title,
          j.employer_id,
          c.name AS company_name,
          e.first_name AS employer_first_name,
          e.last_name AS employer_last_name,
          e.email AS employer_email,
          EXISTS (
            SELECT 1 FROM messages m
            WHERE m.application_id = a.id AND m.sender_id = j.employer_id
          ) AS employer_has_messaged,
          (
            SELECT m.content FROM messages m
            WHERE m.application_id = a.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS last_message,
          (
            SELECT m.created_at FROM messages m
            WHERE m.application_id = a.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS last_message_at,
          (
            SELECT COUNT(*)::int FROM messages m
            WHERE m.application_id = a.id
              AND m.receiver_id = ${applicantId}
              AND m.is_read = false
          ) AS unread_count
        FROM applications a
        INNER JOIN jobs j ON a.job_id = j.id
        INNER JOIN users e ON j.employer_id = e.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE a.applicant_id = ${applicantId}
        ORDER BY last_message_at DESC NULLS LAST, a.applied_at DESC
      `);

      return result.rows.map((row) => {
        const employerHasMessaged = Boolean(row.employer_has_messaged);
        const access = resolveEmployeeMessagingAccess(row.status, employerHasMessaged);
        const employerName = buildUserDisplayName(
          row.employer_first_name as string | undefined,
          row.employer_last_name as string | undefined,
          row.employer_email as string | undefined,
          "employer",
          row.company_name as string | undefined,
        );

        return {
          applicationId: Number(row.application_id),
          jobId: String(row.job_id),
          jobTitle: row.job_title != null ? String(row.job_title) : null,
          companyName: row.company_name != null ? String(row.company_name) : null,
          employerId: String(row.employer_id),
          employerName,
          status: String(row.status ?? "applied"),
          employerHasMessaged,
          canSend: access.canSend,
          unlockReason: access.unlockReason,
          lastMessage: row.last_message != null ? String(row.last_message) : null,
          lastMessageAt: row.last_message_at != null ? String(row.last_message_at) : null,
          unreadCount: Number(row.unread_count ?? 0),
        };
      });
    } catch (error) {
      console.error('Error in getRecruiterThreadsForApplicant:', error);
      throw error;
    }
  }

  async getApplicantThreadsForEmployer(employerId: string): Promise<
    Array<{
      applicationId: number;
      jobId: string;
      jobTitle: string | null;
      applicantId: string;
      applicantName: string;
      status: string;
      lastMessage: string | null;
      lastMessageAt: string | null;
      unreadCount: number;
    }>
  > {
    try {
      const result = await db.execute(sql`
        SELECT
          a.id AS application_id,
          a.status,
          a.applicant_id,
          j.id AS job_id,
          j.title AS job_title,
          u.first_name AS applicant_first_name,
          u.last_name AS applicant_last_name,
          u.email AS applicant_email,
          (
            SELECT m.content FROM messages m
            WHERE m.application_id = a.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS last_message,
          (
            SELECT m.created_at FROM messages m
            WHERE m.application_id = a.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS last_message_at,
          (
            SELECT COUNT(*)::int FROM messages m
            WHERE m.application_id = a.id
              AND m.receiver_id = ${employerId}
              AND m.is_read = false
          ) AS unread_count
        FROM applications a
        INNER JOIN jobs j ON a.job_id = j.id
        INNER JOIN users u ON a.applicant_id = u.id
        WHERE j.employer_id = ${employerId}
        ORDER BY last_message_at DESC NULLS LAST, a.applied_at DESC
      `);

      return result.rows.map((row) => ({
        applicationId: Number(row.application_id),
        jobId: String(row.job_id),
        jobTitle: row.job_title != null ? String(row.job_title) : null,
        applicantId: String(row.applicant_id),
        applicantName: buildUserDisplayName(
          row.applicant_first_name as string | undefined,
          row.applicant_last_name as string | undefined,
          row.applicant_email as string | undefined,
          "professional",
          null,
        ),
        status: String(row.status ?? "applied"),
        lastMessage: row.last_message != null ? String(row.last_message) : null,
        lastMessageAt: row.last_message_at != null ? String(row.last_message_at) : null,
        unreadCount: Number(row.unread_count ?? 0),
      }));
    } catch (error) {
      console.error('Error in getApplicantThreadsForEmployer:', error);
      throw error;
    }
  }

  async getConversationByApplication(
    userId: string,
    applicationId: number
  ): Promise<Message[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          m.*,
          s.first_name AS sender_first_name,
          s.last_name AS sender_last_name,
          s.email AS sender_email,
          s.user_type AS sender_user_type,
          sc.name AS sender_company_name,
          r.first_name AS receiver_first_name,
          r.last_name AS receiver_last_name,
          r.email AS receiver_email,
          r.user_type AS receiver_user_type,
          rc.name AS receiver_company_name
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        LEFT JOIN (
          SELECT owner_id, MIN(name) AS name FROM companies GROUP BY owner_id
        ) sc ON sc.owner_id = s.id
        LEFT JOIN (
          SELECT owner_id, MIN(name) AS name FROM companies GROUP BY owner_id
        ) rc ON rc.owner_id = r.id
        WHERE m.application_id = ${applicationId}
          AND (m.sender_id = ${userId} OR m.receiver_id = ${userId})
        ORDER BY m.created_at ASC
      `);
      return result.rows.map((row) => mapEnrichedMessageRow(row as Record<string, unknown>)) as unknown as Message[];
    } catch (error) {
      console.error('Error in getConversationByApplication:', error);
      throw error;
    }
  }

  async getMessage(id: string): Promise<Message | null> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM messages WHERE id = ${id} LIMIT 1
      `);
      return result.rows[0] as Message || null;
    } catch (error) {
      console.error('Error in getMessage:', error);
      throw error;
    }
  }

  async markMessageAsRead(id: string): Promise<Message> {
    try {
      const result = await db.execute(sql`
        UPDATE messages SET is_read = true WHERE id = ${id} RETURNING *
      `);
      return result.rows[0] as Message;
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
      throw error;
    }
  }

  // Experience methods
  async getExperiencesByUser(userId: string): Promise<Experience[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM experiences WHERE user_id = ${userId}
        ORDER BY start_date DESC
      `);
      return result.rows as Experience[];
    } catch (error) {
      console.error('Error in getExperiencesByUser:', error);
      throw error;
    }
  }

  async createExperience(experience: InsertExperience): Promise<Experience> {
    try {
      const result = await db.execute(sql`
        INSERT INTO experiences (
          user_id,
          title,
          company,
          description,
          start_date,
          end_date,
          is_current
        ) VALUES (
          ${experience.userId},
          ${experience.title},
          ${experience.company},
          ${experience.description || null},
          ${experience.startDate},
          ${experience.endDate || null},
          ${experience.isCurrent || false}
        ) RETURNING *
      `);
      return result.rows[0] as Experience;
    } catch (error) {
      console.error('Error in createExperience:', error);
      throw error;
    }
  }

  async getExperience(id: string): Promise<Experience | null> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM experiences WHERE id = ${id} LIMIT 1
      `);
      return result.rows[0] as Experience || null;
    } catch (error) {
      console.error('Error in getExperience:', error);
      throw error;
    }
  }

  async updateExperience(id: string, updates: Partial<Experience>): Promise<Experience> {
    try {
      const setFields = [];
      const updates_values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setFields.push(`${key} = ${sql.raw('$' + String(updates_values.length + 1))}`);
          updates_values.push(value instanceof Date ? value.toISOString() : String(value));
        }
      }

      const result = await db.execute(sql`
        UPDATE experiences 
        SET ${sql.raw(setFields.join(', '))} 
        WHERE id = ${id} 
        RETURNING *`);
      return result.rows[0] as Experience;
    } catch (error) {
      console.error('Error in updateExperience:', error);
      throw error;
    }
  }

  async deleteExperience(id: string): Promise<void> {
    try {
      await db.execute(sql`DELETE FROM experiences WHERE id = ${id}`);
    } catch (error) {
      console.error('Error in deleteExperience:', error);
      throw error;
    }
  }

  // Job methods
  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM jobs WHERE employer_id = ${employerId} ORDER BY created_at DESC`
      );
      return result.rows.map((row: any) => ({
        id: String(row.id),
        title: String(row.title),
        description: String(row.description || ''),
        requirements: String(row.requirements || ''),
        location: String(row.location),
        jobType: String(row.job_type),
        salaryMin: row.salary_min ? Number(row.salary_min) : null,
        salaryMax: row.salary_max ? Number(row.salary_max) : null,
        skills: Array.isArray(row.skills) ? row.skills : [],
        companyId: row.company_id ? String(row.company_id) : null,
        employerId: String(row.employer_id),
        isActive: Boolean(row.is_active ?? true),
        createdAt: row.created_at ? new Date(row.created_at) : new Date()
      })) as Job[];
    } catch (error) {
      console.error('Error in getJobsByEmployer:', error);
      throw error;
    }
  }

  // Application methods
  async getApplication(id: string): Promise<Application | null> {
    try {
      const applicationId = Number(id);
      if (!Number.isFinite(applicationId)) {
        return null;
      }
      const result = await db.execute(
        sql`SELECT * FROM applications WHERE id = ${applicationId} LIMIT 1`
      );
      const row = result.rows[0] as Record<string, unknown> | undefined;
      return row ? this.mapApplicationRow(row) : null;
    } catch (error) {
      console.error('Error in getApplication:', error);
      throw error;
    }
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    try {
      if (jobId === 'all') {
        const result = await db.execute(sql`SELECT * FROM applications`);
        return result.rows as Application[];
      }
      const result = await db.execute(
        sql`SELECT * FROM applications WHERE job_id = ${jobId}`
      );
      return result.rows as Application[];
    } catch (error) {
      console.error('Error in getApplicationsByJob:', error);
      throw error;
    }
  }

  async getApplicationsByApplicant(applicantId: string): Promise<Application[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM applications 
        WHERE applicant_id = ${applicantId}
        ORDER BY applied_at DESC
      `);
      return result.rows as Application[];
    } catch (error) {
      console.error('Error in getApplicationsByApplicant:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  async getApplicationsWithDetailsByApplicant(applicantId: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          a.*,
          j.id AS job_id,
          j.title AS job_title,
          j.description AS job_description,
          j.requirements AS job_requirements,
          j.location AS job_location,
          j.job_type AS job_type,
          j.salary_min AS salary_min,
          j.salary_max AS salary_max,
          j.skills AS job_skills,
          j.company_id AS job_company_id,
          j.employer_id AS job_employer_id,
          j.is_active AS job_is_active,
          j.created_at AS job_created_at,
          u.id AS applicant_id,
          u.email AS applicant_email,
          u.first_name AS applicant_first_name,
          u.last_name AS applicant_last_name,
          u.user_type AS applicant_user_type,
          u.location AS applicant_location,
          u.profile_photo AS applicant_profile_photo,
          u.telephone_number AS applicant_telephone_number,
          c.id AS company_id,
          c.name AS company_name,
          c.description AS company_description,
          c.website AS company_website,
          c.location AS company_location,
          c.size AS company_size,
          c.industry AS company_industry,
          c.logo AS company_logo,
          c.owner_id AS company_owner_id
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN users u ON a.applicant_id = u.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE a.applicant_id = ${applicantId}
        ORDER BY a.applied_at DESC
      `);
      return result.rows.map((row) => this.mapApplicationWithDetailsRow(row));
    } catch (error) {
      console.error('Error in getApplicationsWithDetailsByApplicant:', error);
      throw error;
    }
  }

  async getApplicationsWithDetailsByJob(jobId: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          a.*,
          j.id AS job_id,
          j.title AS job_title,
          j.description AS job_description,
          j.requirements AS job_requirements,
          j.location AS job_location,
          j.job_type AS job_type,
          j.salary_min AS salary_min,
          j.salary_max AS salary_max,
          j.skills AS job_skills,
          j.company_id AS job_company_id,
          j.employer_id AS job_employer_id,
          j.is_active AS job_is_active,
          j.created_at AS job_created_at,
          u.id AS applicant_id,
          u.email AS applicant_email,
          u.first_name AS applicant_first_name,
          u.last_name AS applicant_last_name,
          u.user_type AS applicant_user_type,
          u.location AS applicant_location,
          u.profile_photo AS applicant_profile_photo,
          u.telephone_number AS applicant_telephone_number,
          c.id AS company_id,
          c.name AS company_name,
          c.description AS company_description,
          c.website AS company_website,
          c.location AS company_location,
          c.size AS company_size,
          c.industry AS company_industry,
          c.logo AS company_logo,
          c.owner_id AS company_owner_id
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN users u ON a.applicant_id = u.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE a.job_id = ${jobId}
        ORDER BY a.applied_at DESC
      `);
      return result.rows.map((row) => this.mapApplicationWithDetailsRow(row));
    } catch (error) {
      console.error('Error in getApplicationsWithDetailsByJob:', error);
      throw error;
    }
  }

  async getApplicationsWithDetailsByEmployer(employerId: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT
          a.*,
          j.id AS job_id,
          j.title AS job_title,
          j.description AS job_description,
          j.requirements AS job_requirements,
          j.location AS job_location,
          j.job_type AS job_type,
          j.salary_min AS salary_min,
          j.salary_max AS salary_max,
          j.skills AS job_skills,
          j.company_id AS job_company_id,
          j.employer_id AS job_employer_id,
          j.is_active AS job_is_active,
          j.created_at AS job_created_at,
          u.id AS applicant_id,
          u.email AS applicant_email,
          u.first_name AS applicant_first_name,
          u.last_name AS applicant_last_name,
          u.user_type AS applicant_user_type,
          u.location AS applicant_location,
          u.profile_photo AS applicant_profile_photo,
          u.telephone_number AS applicant_telephone_number,
          c.id AS company_id,
          c.name AS company_name,
          c.description AS company_description,
          c.website AS company_website,
          c.location AS company_location,
          c.size AS company_size,
          c.industry AS company_industry,
          c.logo AS company_logo,
          c.owner_id AS company_owner_id
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN users u ON a.applicant_id = u.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE j.employer_id = ${employerId}
        ORDER BY a.applied_at DESC
      `);
      return result.rows.map((row) => this.mapApplicationWithDetailsRow(row));
    } catch (error) {
      console.error('Error in getApplicationsWithDetailsByEmployer:', error);
      throw error;
    }
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    try {
      const result = await db.execute(sql`
        INSERT INTO applications (
          job_id,
          applicant_id,
          status,
          applied_at
        ) VALUES (
          ${application.jobId},
          ${application.applicantId},
          ${application.status},
          ${new Date()}
        ) RETURNING *
      `);
      return result.rows[0] as Application;
    } catch (error) {
      console.error('Error in createApplication:', error);
      throw error;
    }
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    try {
      const applicationId = Number(id);
      if (!Number.isFinite(applicationId)) {
        throw new Error(`Invalid application id: ${id}`);
      }

      if (updates.status !== undefined) {
        // Try updating with updated_at first; fall back without it if column missing
        try {
          const result = await db.execute(sql`
            UPDATE applications
            SET status = ${String(updates.status)}, updated_at = ${new Date()}
            WHERE id = ${applicationId}
            RETURNING *
          `);
          if (result.rows[0]) {
            return this.mapApplicationRow(result.rows[0] as Record<string, unknown>);
          }
        } catch (colErr: any) {
          // If updated_at column doesn't exist, retry without it
          if (String(colErr?.message || '').includes('updated_at')) {
            const result = await db.execute(sql`
              UPDATE applications
              SET status = ${String(updates.status)}
              WHERE id = ${applicationId}
              RETURNING *
            `);
            if (result.rows[0]) {
              return this.mapApplicationRow(result.rows[0] as Record<string, unknown>);
            }
          } else {
            throw colErr;
          }
        }
      }

      const result = await db.execute(sql`
        SELECT * FROM applications WHERE id = ${applicationId} LIMIT 1
      `);
      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) throw new Error(`Application not found: ${id}`);
      return this.mapApplicationRow(row);
    } catch (error) {
      console.error('Error in updateApplication:', error);
      throw error;
    }
  }

  /**
   * Computes a multi-factor match score (0–100) between a candidate profile and a job.
   *
   * Weights:
   *  - Skills overlap       40 pts  (Jaccard-ish: matching / union)
   *  - Location match       20 pts  (exact city / "Remote" / partial)
   *  - Salary fit           20 pts  (candidate's expected range vs job range)
   *  - Experience tier      20 pts  (headline / bio keywords)
   *
   * Returns an object with the total score and per-dimension breakdown.
   */
  static computeMatchScore(params: {
    candidateSkills: string[];
    jobSkills: string[];
    candidateLocation?: string | null;
    jobLocation?: string | null;
    candidateHeadline?: string | null;
    jobTitle?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
  }): { total: number; breakdown: Record<string, number> } {
    const norm = (s: string) => s.toLowerCase().trim();

    // ── 1. Skills (40 pts) ─────────────────────────────────────────────────────
    const cSkills = (params.candidateSkills || []).map(norm);
    const jSkills = (params.jobSkills || []).map(norm);
    let skillScore = 0;
    if (jSkills.length > 0 && cSkills.length > 0) {
      const intersection = cSkills.filter(s => jSkills.includes(s)).length;
      const union = new Set([...cSkills, ...jSkills]).size;
      // Weighted toward job requirements: 60% Jaccard + 40% recall
      const jaccard = intersection / union;
      const recall  = intersection / jSkills.length;
      skillScore = Math.round((jaccard * 0.6 + recall * 0.4) * 40);
    } else if (jSkills.length === 0) {
      // No skill requirements — neutral full score
      skillScore = 40;
    }

    // ── 2. Location (20 pts) ───────────────────────────────────────────────────
    const cLoc = norm(params.candidateLocation || '');
    const jLoc = norm(params.jobLocation || '');
    let locationScore = 0;
    if (!jLoc || jLoc === 'remote' || jLoc.includes('remote')) {
      locationScore = 20; // Remote job — everyone qualifies
    } else if (!cLoc) {
      locationScore = 10; // Candidate location unknown — neutral
    } else if (cLoc === jLoc) {
      locationScore = 20;
    } else {
      // Partial match: city name overlap
      const jWords = jLoc.split(/[,\s]+/).filter(Boolean);
      const cWords = cLoc.split(/[,\s]+/).filter(Boolean);
      const overlap = jWords.filter(w => cWords.includes(w)).length;
      if (overlap > 0) locationScore = 12;
    }

    // ── 3. Salary fit (20 pts) ────────────────────────────────────────────────
    // We give full marks unless salary is far outside range
    let salaryScore = 20;
    if (params.salaryMin && params.salaryMax) {
      // For now assume candidate's expected salary is mid-point of listed range
      // The score penalises only when the listed salary is very low (< 60k)
      const mid = (params.salaryMin + params.salaryMax) / 2;
      if (mid < 40) salaryScore = 8;
      else if (mid < 60) salaryScore = 14;
      else salaryScore = 20;
    }

    // ── 4. Experience/title relevance (20 pts) ────────────────────────────────
    const headline = norm(params.candidateHeadline || '');
    const jobTitle = norm(params.jobTitle || '');
    let expScore = 10; // default neutral
    if (headline && jobTitle) {
      const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 3);
      const matches  = jobWords.filter(w => headline.includes(w)).length;
      expScore = jobWords.length > 0
        ? Math.min(20, Math.round((matches / jobWords.length) * 20))
        : 10;
    }

    const total = Math.min(100, skillScore + locationScore + salaryScore + expScore);

    return {
      total,
      breakdown: { skills: skillScore, location: locationScore, salary: salaryScore, experience: expScore },
    };
  }

  // Notification methods
  async getNotificationsByUser(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      return (result.rows as any[]).map((row) => this.mapNotificationRow(row));
    } catch (error) {
      console.error("Error in getNotificationsByUser:", error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*)::int AS count FROM notifications
        WHERE user_id = ${userId} AND is_read = false
      `);
      return Number((result.rows[0] as any)?.count ?? 0);
    } catch (error) {
      console.error("Error in getUnreadNotificationCount:", error);
      return 0;
    }
  }

  async createNotification(notification: {
    userId: string;
    type: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    isRead?: boolean;
    linkTab?: string | null;
  }): Promise<Notification> {
    try {
      const result = await db.execute(sql`
        INSERT INTO notifications (
          user_id, type, title, body, metadata, is_read, link_tab, created_at
        ) VALUES (
          ${notification.userId},
          ${notification.type},
          ${notification.title},
          ${notification.body},
          ${JSON.stringify(notification.metadata ?? {})}::jsonb,
          ${notification.isRead ?? false},
          ${notification.linkTab ?? null},
          ${new Date()}
        ) RETURNING *
      `);
      return this.mapNotificationRow(result.rows[0]);
    } catch (error) {
      console.error("Error in createNotification:", error);
      throw error;
    }
  }

  async markNotificationRead(id: string, userId: string): Promise<Notification | null> {
    try {
      const notificationId = Number(id);
      if (!Number.isFinite(notificationId)) return null;
      const result = await db.execute(sql`
        UPDATE notifications SET is_read = true
        WHERE id = ${notificationId} AND user_id = ${userId}
        RETURNING *
      `);
      return result.rows[0] ? this.mapNotificationRow(result.rows[0]) : null;
    } catch (error) {
      console.error("Error in markNotificationRead:", error);
      throw error;
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE notifications SET is_read = true WHERE user_id = ${userId} AND is_read = false
      `);
    } catch (error) {
      console.error("Error in markAllNotificationsRead:", error);
      throw error;
    }
  }

  private mapNotificationRow(row: any): Notification {
    return {
      id: Number(row.id),
      userId: String(row.user_id),
      type: String(row.type),
      title: String(row.title),
      body: String(row.body),
      metadata: row.metadata ?? {},
      isRead: Boolean(row.is_read),
      linkTab: row.link_tab ? String(row.link_tab) : null,
      createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
    };
  }
}

// Create and export a singleton instance
export const storage = new Storage();
