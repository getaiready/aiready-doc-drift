import { vi } from 'vitest';

// Set required env vars before any module imports
process.env.DYNAMO_TABLE = 'test-table';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:8886';
process.env.SES_FROM_EMAIL = 'test@example.com';

// Next's virtual `server-only` import is not available in the test environment.
// Mock it as a no-op so server-only imports don't fail in unit tests.
vi.mock('server-only', () => ({}));

// Mock SST Resource (Ion/v4)
vi.mock('sst', () => ({
  Resource: {
    ClawMoreTable: { name: 'test-table' },
    ClawMoreBus: { name: 'test-bus' },
    ClawMoreSite: { url: 'http://localhost:8886' },
    StripeSecretKey: { value: 'sk_test_mock' },
    GithubServiceToken: { value: 'github_test_mock' },
    OpenRouterApiKey: { value: 'openrouter_test_mock' },
    SpokeTelegramBotToken: { value: 'bot_test_mock' },
    SpokeMiniMaxApiKey: { value: 'minimax_test_mock' },
    SpokeOpenAIApiKey: { value: 'openai_test_mock' },
    SpokeGithubToken: { value: 'gh_test_mock' },
  },
}));
