/**
 * DynamoDB Query builder utility.
 * Consolidates repeated KeyConditionExpression and ExpressionAttributeValues patterns.
 * Reduces token duplication across clawmore routes and services.
 */

interface QueryBuilderOptions {
  indexName?: string;
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
  scanIndexForward?: boolean;
}

interface QueryParams {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, unknown>;
  ExpressionAttributeNames?: Record<string, string>;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
  ScanIndexForward?: boolean;
}

export class QueryBuilder {
  private conditions: string[] = [];
  private attributeValues: Record<string, unknown> = {};
  private attributeNames: Record<string, string> = {};
  private valueCounter = 0;
  private options: QueryBuilderOptions;

  constructor(options: QueryBuilderOptions = {}) {
    this.options = options;
  }

  /**
   * Add a partition key condition (= operator).
   * Pattern: PK = :pk, GSI1PK = :gsi1pk, etc.
   */
  pk(pkName: string, pkValue: unknown): this {
    const placeholder = `:pk${this.valueCounter++}`;
    this.attributeValues[placeholder] = pkValue;
    this.conditions.push(`${pkName} = ${placeholder}`);
    return this;
  }

  /**
   * Add a sort key condition (=, begins_with, between, <, >, <=, >=).
   * Patterns:
   * - SKName = :sk
   * - begins_with(SKName, :sk)
   * - SKName BETWEEN :sk1 AND :sk2
   */
  sk(
    skName: string,
    operator: 'eq' | 'begins' | 'between' | 'lt' | 'le' | 'gt' | 'ge',
    value: unknown | [unknown, unknown]
  ): this {
    const placeholder1 = `:sk${this.valueCounter++}`;

    if (operator === 'eq') {
      this.attributeValues[placeholder1] = value;
      this.conditions.push(`${skName} = ${placeholder1}`);
    } else if (operator === 'begins') {
      this.attributeValues[placeholder1] = value;
      this.conditions.push(`begins_with(${skName}, ${placeholder1})`);
    } else if (operator === 'between') {
      const [val1, val2] = value as [unknown, unknown];
      const placeholder2 = `:sk${this.valueCounter++}`;
      this.attributeValues[placeholder1] = val1;
      this.attributeValues[placeholder2] = val2;
      this.conditions.push(
        `${skName} BETWEEN ${placeholder1} AND ${placeholder2}`
      );
    } else {
      const opMap: Record<string, string> = {
        lt: '<',
        le: '<=',
        gt: '>',
        ge: '>=',
      };
      this.attributeValues[placeholder1] = value;
      this.conditions.push(`${skName} ${opMap[operator]} ${placeholder1}`);
    }
    return this;
  }

  /**
   * Build the final query parameters for DynamoDB Query operation.
   */
  build(tableName: string): QueryParams {
    if (this.conditions.length === 0) {
      throw new Error('QueryBuilder: No conditions specified');
    }

    const params: QueryParams = {
      TableName: tableName,
      KeyConditionExpression: this.conditions.join(' AND '),
      ExpressionAttributeValues: this.attributeValues,
    };

    if (Object.keys(this.attributeNames).length > 0) {
      params.ExpressionAttributeNames = this.attributeNames;
    }

    if (this.options.indexName) {
      params.IndexName = this.options.indexName;
    }

    if (this.options.limit) {
      params.Limit = this.options.limit;
    }

    if (this.options.exclusiveStartKey) {
      params.ExclusiveStartKey = this.options.exclusiveStartKey;
    }

    if (this.options.scanIndexForward !== undefined) {
      params.ScanIndexForward = this.options.scanIndexForward;
    }

    return params;
  }
}

/**
 * Factory functions for common query patterns to reduce boilerplate.
 * These directly replace the most repeated KeyConditionExpression patterns.
 */

/**
 * Query by GSI1PK and GSI1SK (most common pattern in clawmore).
 * Usage: queryByGSI1(tableName, pkValue, skValue)
 */
export function queryByGSI1(
  tableName: string,
  pkValue: string,
  skValue: string
): QueryParams {
  return new QueryBuilder({ indexName: 'GSI1' })
    .pk('GSI1PK', pkValue)
    .sk('GSI1SK', 'eq', skValue)
    .build(tableName);
}

/**
 * Query by PK only.
 * Usage: queryByPK(tableName, pkValue)
 */
export function queryByPK(tableName: string, pkValue: string): QueryParams {
  return new QueryBuilder().pk('PK', pkValue).build(tableName);
}

/**
 * Query by PK with SK prefix (begins_with pattern).
 * Usage: queryByPKPrefix(tableName, pkValue, skPrefix)
 */
export function queryByPKPrefix(
  tableName: string,
  pkValue: string,
  skPrefix: string
): QueryParams {
  return new QueryBuilder()
    .pk('PK', pkValue)
    .sk('SK', 'begins', skPrefix)
    .build(tableName);
}

/**
 * Query by GSI1PK only.
 * Usage: queryByGSI1PK(tableName, pkValue)
 */
export function queryByGSI1PK(tableName: string, pkValue: string): QueryParams {
  return new QueryBuilder({ indexName: 'GSI1' })
    .pk('GSI1PK', pkValue)
    .build(tableName);
}

/**
 * Query by GSI1PK and GSI1SK prefix.
 * Usage: queryByGSI1Prefix(tableName, pkValue, skPrefix)
 */
export function queryByGSI1Prefix(
  tableName: string,
  pkValue: string,
  skPrefix: string
): QueryParams {
  return new QueryBuilder({ indexName: 'GSI1' })
    .pk('GSI1PK', pkValue)
    .sk('GSI1SK', 'begins', skPrefix)
    .build(tableName);
}
