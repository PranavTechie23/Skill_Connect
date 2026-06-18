import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema.js';
import { runModerationScan } from '../server/src/ai/moderation-scanner.js';
import { storage } from '../server/src/storage.js';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skill_connect';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function runTests() {
  console.log('--- Admin AI Moderation Test ---');

  // get any user ID to use as the admin
  const allUsers = await storage.getAllUsers();
  const adminId = allUsers[0]?.id || 'admin-123';

  console.log('\n[1] Testing runModerationScan (High Risk Job)');
  const spamJobResult = await runModerationScan({
    entityType: 'job',
    entityId: 'test-job-999',
    details: {
      title: 'GET RICH QUICK GUARANTEED',
      description: 'Send $500 crypto to this address to start working. No experience needed! Guaranteed thousands per week.',
      companyName: 'Crypto Scams LLC'
    }
  });
  console.log('Scan Result:', spamJobResult);

  console.log('\n[2] Testing runModerationScan (Low Risk Job)');
  const cleanJobResult = await runModerationScan({
    entityType: 'job',
    entityId: 'test-job-1000',
    details: {
      title: 'Senior Software Engineer',
      description: 'We are looking for a senior software engineer with 5+ years of experience in React and Node.js.',
      companyName: 'Tech Corp'
    }
  });
  console.log('Scan Result:', cleanJobResult);

  // 2. Test audit logging helper
  console.log('\n[3] Testing Audit Log Creation');
  try {
    const auditLog = await storage.createAuditLog({
      adminId: String(adminId),
      action: 'rejected',
      targetType: 'job',
      targetId: 'test-job-999',
      adminReason: 'Clear spam',
      aiRiskLevel: spamJobResult.riskLevel,
      aiSuggested: spamJobResult.suggestedAction,
      aiReasoning: spamJobResult.reasoning,
      aiFollowed: true,
    });
    console.log('Created Audit Log:', auditLog);
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }

  console.log('\n[4] Testing Audit Summary');
  const summary = await storage.getAuditSummary();
  console.log('Audit Summary:', summary);

  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
