import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:dsa@localhost:5432/graphicgenie'
});

async function addMissingUsers() {
  try {
    console.log('Adding missing users to reach 9 total...');
    
    // Get current user count
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const currentCount = parseInt(countResult.rows[0].count);
    console.log(`Current users: ${currentCount}`);
    
    // Define additional users to add
    const additionalUsers = [
      {
        email: 'alice@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Alice',
        lastName: 'Johnson',
        userType: 'Professional',
        location: 'New York, NY',
        title: 'Software Engineer',
        bio: 'Passionate about web development and user experience',
        skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'TypeScript']),
        telephoneNumber: '+1-555-0101'
      },
      {
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Bob',
        lastName: 'Smith',
        userType: 'Professional',
        location: 'San Francisco, CA',
        title: 'Data Scientist',
        bio: 'Expert in machine learning and data analysis',
        skills: JSON.stringify(['Python', 'Machine Learning', 'SQL', 'TensorFlow']),
        telephoneNumber: '+1-555-0102'
      },
      {
        email: 'carol@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Carol',
        lastName: 'Williams',
        userType: 'Professional',
        location: 'Chicago, IL',
        title: 'UX Designer',
        bio: 'Creating beautiful and functional user interfaces',
        skills: JSON.stringify(['Figma', 'Adobe XD', 'User Research', 'Prototyping']),
        telephoneNumber: '+1-555-0103'
      },
      {
        email: 'david@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'David',
        lastName: 'Brown',
        userType: 'Professional',
        location: 'Austin, TX',
        title: 'DevOps Engineer',
        bio: 'Automating infrastructure and deployment processes',
        skills: JSON.stringify(['Docker', 'Kubernetes', 'AWS', 'CI/CD']),
        telephoneNumber: '+1-555-0104'
      },
      {
        email: 'eve@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Eve',
        lastName: 'Davis',
        userType: 'Professional',
        location: 'Seattle, WA',
        title: 'Product Manager',
        bio: 'Leading product development and strategy',
        skills: JSON.stringify(['Product Strategy', 'Agile', 'Analytics', 'Leadership']),
        telephoneNumber: '+1-555-0105'
      },
      {
        email: 'frank@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Frank',
        lastName: 'Miller',
        userType: 'Employer',
        location: 'Boston, MA',
        telephoneNumber: '+1-555-0106'
      }
    ];
    
    // Add users
    for (const userData of additionalUsers) {
      try {
        const insertQuery = `
          INSERT INTO users (email, password, first_name, last_name, user_type, location, title, bio, skills, telephone_number, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING id, first_name, last_name, email
        `;
        
        const result = await pool.query(insertQuery, [
          userData.email,
          userData.password,
          userData.firstName,
          userData.lastName,
          userData.userType,
          userData.location,
          userData.title,
          userData.bio,
          userData.skills,
          userData.telephoneNumber
        ]);
        
        const newUser = result.rows[0];
        console.log(`✅ Added user: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`);
        
        // Create professional profile for Professional users
        if (userData.userType === 'Professional') {
          const profileQuery = `
            INSERT INTO professional_profiles (user_id, headline, bio, skills)
            VALUES ($1, $2, $3, $4)
          `;
          await pool.query(profileQuery, [
            newUser.id,
            userData.title,
            userData.bio,
            userData.skills
          ]);
          console.log(`  📝 Created professional profile for ${newUser.first_name}`);
        }
        
        // Create company for Employer users
        if (userData.userType === 'Employer') {
          const companyQuery = `
            INSERT INTO companies (name, description, website, location, industry, size, owner_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `;
          await pool.query(companyQuery, [
            `${userData.firstName}'s Company`,
            `A growing company led by ${userData.firstName} ${userData.lastName}`,
            `https://${userData.firstName.toLowerCase()}company.com`,
            userData.location,
            'Technology',
            'Small',
            newUser.id
          ]);
          console.log(`  🏢 Created company for ${newUser.first_name}`);
        }
      } catch (error) {
        console.error(`❌ Error adding user ${userData.email}:`, error.message);
      }
    }
    
    // Check final count
    const finalCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const finalCount = parseInt(finalCountResult.rows[0].count);
    console.log(`\n✅ Final user count: ${finalCount}`);
    
    // List all users
    const allUsersResult = await pool.query('SELECT first_name, last_name, email, user_type FROM users ORDER BY created_at');
    console.log('\nAll users:');
    allUsersResult.rows.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name} (${user.email}) - ${user.user_type}`);
    });
    
  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    await pool.end();
  }
}

addMissingUsers();