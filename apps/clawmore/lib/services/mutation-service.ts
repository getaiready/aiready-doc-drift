/**
 * Mutation Service - Handles mutation recording and retrieval.
 * Single responsibility: mutation lifecycle operations.
 */

import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { MutationRecord } from '../types/models';
import { KeyBuilder } from '../ddb/key-builder';
import { UpdateBuilder } from '../ddb/update-builder';
import { QueryBuilder, queryByPKPrefix } from '../ddb/query-builder';
import { dbConfig } from '../ddb/env-config';

export interface CreateMutationInput {
  userId: string;
  mutationId: string;
  repoName?: string;
  type: string;
  status: 'SUCCESS' | 'FAILURE';
  complexitySaved?: number;
  estimatedHoursSaved?: number;
  tokensUsed?: number;
}

export class MutationService {
  constructor(private docClient: DynamoDBDocumentClient) {}

  /**
   * Create a new mutation record.
   */
  async createMutation(data: CreateMutationInput): Promise<void> {
    const {
      userId,
      mutationId,
      repoName,
      type,
      status,
      complexitySaved,
      estimatedHoursSaved,
      tokensUsed,
    } = data;

    const builder = new UpdateBuilder()
      .set('EntityType', 'MutationEvent')
      .set('mutationId', mutationId)
      .set('repoName', repoName || 'unknown')
      .set('mutationType', type)
      .set('mutationStatus', status)
      .set('createdAt', new Date().toISOString())
      .setIf('complexitySaved', complexitySaved)
      .setIf('estimatedHoursSaved', estimatedHoursSaved)
      .setIf('tokensUsed', tokensUsed);

    await this.docClient.send(
      new UpdateCommand({
        TableName: dbConfig.tableName,
        Key: KeyBuilder.mutation(userId, mutationId),
        ...builder.build(),
      })
    );
  }

  /**
   * Get recent mutations for a user.
   */
  async getRecentMutations(
    email: string,
    limit = 10
  ): Promise<MutationRecord[]> {
    const queryParams = new QueryBuilder({
      limit,
      scanIndexForward: false, // Descending order (recent first)
    })
      .pk('PK', `USER#${email}`)
      .sk('SK', 'begins', 'MUTATION#')
      .build(dbConfig.tableName);

    const response = await this.docClient.send(new QueryCommand(queryParams));

    return (response.Items || []) as MutationRecord[];
  }
}
