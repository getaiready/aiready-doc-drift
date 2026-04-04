import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { putMetric } from './metrics';

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

// Mock CloudWatchClient and Command
vi.mock('@aws-sdk/client-cloudwatch', () => {
  class MockCloudWatchClient {
    send = mockSend;
  }
  class MockPutMetricDataCommand {
    constructor(public input: any) {}
  }
  return {
    CloudWatchClient: MockCloudWatchClient,
    PutMetricDataCommand: MockPutMetricDataCommand,
  };
});

describe('Metrics Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set NODE_ENV to production to enable metrics
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    // Restore NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  it('should send metric data to CloudWatch in production', async () => {
    mockSend.mockResolvedValue({});

    await putMetric({
      name: 'TestMetric',
      value: 100,
      unit: 'Count',
      dimensions: { Service: 'Test' },
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Namespace: 'ClawMore',
          MetricData: expect.arrayContaining([
            expect.objectContaining({
              MetricName: 'TestMetric',
              Value: 100,
              Unit: 'Count',
              Dimensions: expect.arrayContaining([
                { Name: 'Service', Value: 'Test' },
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it('should skip sending metrics when not in production', async () => {
    process.env.NODE_ENV = 'development';

    await putMetric({
      name: 'DevMetric',
      value: 1,
    });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should log an error if CloudWatch send fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSend.mockRejectedValue(new Error('CloudWatch Error'));

    await putMetric({
      name: 'ErrorMetric',
      value: 1,
    });

    expect(mockSend).toHaveBeenCalled();
  });
});
