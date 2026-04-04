import {
  createManagedAccount,
  findAvailableAccountInPool,
  assignAccountToOwner,
} from '../lib/aws/vending';
import { PromisePool } from '@supercharge/promise-pool';
import { createLogger } from '../lib/logger';

const log = createLogger('load-test-vending');

async function runLoadTest(concurrency: number, totalUsers: number) {
  log.info(
    `Starting load test with ${concurrency} concurrency and ${totalUsers} users...`
  );

  const users = Array.from({ length: totalUsers }, (_, i) => ({
    email: `loadtest+${Date.now()}+${i}@example.com`,
    name: `LoadTest User ${i}`,
    userId: `loadtest-${i}`,
  }));

  const startTime = Date.now();

  const { results, errors } = await PromisePool.withConcurrency(concurrency)
    .for(users)
    .process(async (user) => {
      const candidateId = await findAvailableAccountInPool();
      if (candidateId) {
        log.info(`Found warm account ${candidateId} for ${user.email}`);
        await assignAccountToOwner(candidateId, user.email, 'loadtest-repo');
        return { type: 'warm', email: user.email, accountId: candidateId };
      } else {
        log.info(
          `No warm account found, creating new account for ${user.email}...`
        );
        const { requestId } = await createManagedAccount(
          user.email,
          user.name,
          user.userId
        );
        return { type: 'new', email: user.email, requestId };
      }
    });

  const duration = (Date.now() - startTime) / 1000;

  log.info(`Load test completed in ${duration}s`);
  log.info(`Successful: ${results.length}, Failed: ${errors.length}`);

  if (errors.length > 0) {
    log.error({ errors }, 'Some provisioning attempts failed');
  }
}

// Run the script if executed directly
if (require.main === module) {
  runLoadTest(5, 20).catch((err) => log.error(err));
}
