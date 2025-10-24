import { db } from '../server/src/db.js';
import { users, companies, professionalProfiles } from '../shared/schema.js';
import bcrypt from 'bcrypt';

async function addMissingUsers() {
  try {
    console.log('Adding missing users to reach 9 total...');
    
    // Get current user count
    const currentUsers = await db.select().from(users);
    console.log(`Current users: ${currentUsers.length}`);
    
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
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        telephoneNumber: '+1-555-0101',
        createdAt: new Date()
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
        skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
        telephoneNumber: '+1-555-0102',
        createdAt: new Date()
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
        skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
        telephoneNumber: '+1-555-0103',
        createdAt: new Date()
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
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        telephoneNumber: '+1-555-0104',
        createdAt: new Date()
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
        skills: ['Product Strategy', 'Agile', 'Analytics', 'Leadership'],
        telephoneNumber: '+1-555-0105',
        createdAt: new Date()
      },
      {
        email: 'frank@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Frank',
        lastName: 'Miller',
        userType: 'Employer',
        location: 'Boston, MA',
        telephoneNumber: '+1-555-0106',
        createdAt: new Date()
      }
    ];
    
    // Add users
    for (const userData of additionalUsers) {
      try {
        const [newUser] = await db.insert(users).values(userData).returning();
        console.log(`✅ Added user: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
        
        // Create professional profile for Professional users
        if (userData.userType === 'Professional') {
          await db.insert(professionalProfiles).values({
            userId: newUser.id,
            headline: userData.title,
            bio: userData.bio,
            skills: userData.skills
          });
          console.log(`  📝 Created professional profile for ${newUser.firstName}`);
        }
        
        // Create company for Employer users
        if (userData.userType === 'Employer') {
          await db.insert(companies).values({
            name: `${userData.firstName}'s Company`,
            description: `A growing company led by ${userData.firstName} ${userData.lastName}`,
            website: `https://${userData.firstName.toLowerCase()}company.com`,
            location: userData.location,
            industry: 'Technology',
            size: 'Small',
            ownerId: newUser.id,
            createdAt: new Date()
          });
          console.log(`  🏢 Created company for ${newUser.firstName}`);
        }
      } catch (error) {
        console.error(`❌ Error adding user ${userData.email}:`, error.message);
      }
    }
    
    // Check final count
    const finalUsers = await db.select().from(users);
    console.log(`\n✅ Final user count: ${finalUsers.length}`);
    
    console.log('\nAll users:');
    finalUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.userType}`);
    });
    
  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    process.exit(0);
  }
}

addMissingUsers();



