import {
  createManagedAccount,
  waitForAccountCreation,
  bootstrapManagedAccount,
} from '../lib/aws/vending';
import { putMetric } from '../lib/metrics';
import { createServerlessSCP, attachSCPToAccount } from '../lib/aws/governance';
import { CreateManagedAccountSchema } from '../lib/validation/schemas';

export const handler = async (event: any) => {
  let parsed;
  try {
    const body = JSON.parse(event.body || '{}');
    parsed = CreateManagedAccountSchema.safeParse(body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid input',
        details: parsed.error.flatten().fieldErrors,
      }),
    };
  }
  const { userEmail, userName } = parsed.data;

  try {
    console.log(`Initiating account creation for ${userEmail}...`);
    const { requestId } = await createManagedAccount(userEmail, userName);

    console.log(`Waiting for account creation (RequestID: ${requestId})...`);
    const accountId = await waitForAccountCreation(requestId);

    console.log(`Account created: ${accountId}. Attaching Serverless SCP...`);
    const scpId = await createServerlessSCP();
    await attachSCPToAccount(scpId, accountId);

    console.log(
      `SCP attached successfully. Bootstrapping account ${accountId}...`
    );
    const bootstrapRoleArn = await bootstrapManagedAccount(
      accountId,
      'clawmost'
    );
    console.log(`Account bootstrapped with role: ${bootstrapRoleArn}`);

    await putMetric({
      name: 'ManagedAccountCreated',
      value: 1,
      unit: 'Count',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Account created and secured successfully',
        accountId,
      }),
    };
  } catch (error: any) {
    await putMetric({
      name: 'ManagedAccountCreationErrors',
      value: 1,
      unit: 'Count',
    });

    console.error('Error in create-managed-account handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create or secure managed account',
      }),
    };
  }
};
