import { storage } from '../server/src/storage';

async function verifyUser(email: string) {
  try {
    console.log(`Looking up user with email: ${email}`);
    const user = await storage.getUserByEmail(email);
    
    if (user) {
      console.log('User found:');
      console.log(JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        telephoneNumber: user.telephoneNumber,
      }, null, 2));
    } else {
      console.log('No user found with that email');
    }
  } catch (error) {
    console.error('Error looking up user:', error);
  }
  process.exit(0);
}

// Get email from command line args
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

verifyUser(email);