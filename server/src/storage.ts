import { type User, type InsertUser, type Company, type InsertCompany, type Job, type InsertJob, type Application, type InsertApplication, type Message, type InsertMessage, type Experience, type InsertExperience, type Story, type ProfessionalProfile, type InsertProfessionalProfile } from "../../shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Helper function to cast database results to proper types
function castDbResult<T>(result: Record<string, unknown> | null): T | null {
  return result as T | null;
}

export class Storage {
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

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await db.execute(sql`
        INSERT INTO users (
          email, password, user_type, first_name, last_name,
          location, profile_photo, telephone_number, created_at
        ) VALUES (
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
      const setFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setFields.push(`${key} = ${sql.raw('?')}`);
          values.push(value instanceof Date ? value.toISOString() : String(value));
        }
      }

      const result = await db.execute(
        sql`UPDATE users SET ${sql.raw(setFields.join(', '))} WHERE id = ${id} RETURNING *`);
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await db.execute(sql`DELETE FROM users WHERE id = ${id}`);
    } catch (error) {
      console.error('Error in deleteUser:', error);
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
        WHERE j.is_active = true
      `;

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
          companyId: String(row.company_id),
          employerId: String(row.employer_id),
          isActive: Boolean(row.is_active),
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

  async getJob(id: string | null): Promise<Job | null> {
    try {
      if (!id) {
        console.log('No job ID provided to getJob');
        return null;
      }

      const result = await db.execute(sql`
        SELECT * 
        FROM jobs 
        WHERE id = ${String(id)}
      `);
      return castDbResult<Job>(result.rows[0]);
    } catch (error) {
      console.error('Error in getJob:', error);
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

  async createJob(job: Omit<InsertJob, 'id'>): Promise<Job> {
    try {
      const result = await db.execute(sql`
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
          ${job.title},
          ${job.description},
          ${job.requirements},
          ${job.location},
          ${job.jobType},
          ${job.salaryMin || null},
          ${job.salaryMax || null},
          ${sql.raw(`'${JSON.stringify(job.skills || [])}'::jsonb`)},
          ${job.companyId},
          ${job.employerId},
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
  }): Promise<Story> {
    try {
      console.log('Creating story with data:', story);
      
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
      const result = await db.execute(sql`
        INSERT INTO professional_profiles (
          user_id,
          headline,
          bio,
          skills
        ) VALUES (
          ${profile.userId},
          ${profile.headline || null},
          ${profile.bio || null},
          ${sql.raw(`'${JSON.stringify(profile.skills || [])}'::jsonb`)}
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

  async updateProfessionalProfile(userId: string, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile> {
    try {
      const setFields = [];
      const updates_values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setFields.push(`${key} = ${sql.raw('$' + String(updates_values.length + 1))}`);
          updates_values.push(String(value));
        }
      }

      const result = await db.execute(sql`
        UPDATE professional_profiles 
        SET ${sql.raw(setFields.join(', '))} 
        WHERE user_id = ${userId} 
        RETURNING *
      `);

      return result.rows[0] as ProfessionalProfile;
    } catch (error) {
      console.error('Error in updateProfessionalProfile:', error);
      throw error;
    }
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const result = await db.execute(sql`
        INSERT INTO companies (
          name,
          description,
          website,
          location,
          industry,
          size,
          owner_id,
          created_at
        ) VALUES (
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

  // Stories methods
  async getStories(): Promise<Story[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM stories 
        ORDER BY created_at DESC
      `);
      return result.rows as Story[];
    } catch (error) {
      console.error('Error in getStories:', error);
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error('Database connection failed - please check if database is running');
      }
      throw error;
    }
  }

  async getAllStories(): Promise<Story[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM stories 
        ORDER BY featured DESC, created_at DESC
      `);
      return result.rows as Story[];
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
      return result.rows[0] as Story || null;
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
        SELECT * FROM messages 
        WHERE (sender_id = ${userId} AND receiver_id = ${otherUserId})
        OR (sender_id = ${otherUserId} AND receiver_id = ${userId})
        ORDER BY created_at ASC
      `);
      return result.rows as Message[];
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw error;
    }
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM messages 
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
        ORDER BY created_at DESC
      `);
      return result.rows as Message[];
    } catch (error) {
      console.error('Error in getMessagesByUser:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const result = await db.execute(sql`
        INSERT INTO messages (
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at
        ) VALUES (
          ${message.senderId},
          ${message.receiverId},
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
        sql`SELECT * FROM jobs WHERE employer_id = ${employerId}`
      );
      return result.rows as Job[];
    } catch (error) {
      console.error('Error in getJobsByEmployer:', error);
      throw error;
    }
  }

  // Application methods
  async getApplication(id: string): Promise<Application | null> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM applications WHERE id = ${id} LIMIT 1`
      );
      return result.rows[0] as Application | null;
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
      const setFields = [];
      const updates_values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setFields.push(`${key} = ${sql.raw('$' + String(updates_values.length + 1))}`);
          updates_values.push(String(value));
        }
      }

      const result = await db.execute(sql`
        UPDATE applications 
        SET ${sql.raw(setFields.join(', '))} 
        WHERE id = ${id} 
        RETURNING *
      `);

      return result.rows[0] as Application;
    } catch (error) {
      console.error('Error in updateApplication:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const storage = new Storage();
