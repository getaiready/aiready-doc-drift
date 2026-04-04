import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { createLogger } from './logger';

const log = createLogger('metrics');
const client = new CloudWatchClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
});

export interface MetricData {
  name: string;
  value: number;
  unit?: 'Count' | 'Seconds' | 'Milliseconds' | 'Bytes' | 'Percent' | 'None';
  dimensions?: Record<string, string>;
}

export async function putMetric(metric: MetricData) {
  if (process.env.NODE_ENV !== 'production') {
    log.debug({ metric }, 'Skipping metric in non-production environment');
    return;
  }

  try {
    const dimensions = Object.entries(metric.dimensions || {}).map(
      ([Name, Value]) => ({ Name, Value })
    );
    const command = new PutMetricDataCommand({
      Namespace: 'ClawMore',
      MetricData: [
        {
          MetricName: metric.name,
          Value: metric.value,
          Unit: metric.unit || 'Count',
          Dimensions: dimensions,
          Timestamp: new Date(),
        },
      ],
    });

    await client.send(command);
  } catch (error) {
    log.error({ err: error, metric }, 'Failed to put metric data');
  }
}
