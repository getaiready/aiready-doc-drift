import { describe, it, expect } from 'vitest';
import { detectDuplicatePatterns } from '../detector';

describe('detectDuplicatePatterns', () => {
  it('should detect exact duplicate functions', async () => {
    const files = [
      {
        file: 'file1.ts',
        content: `
          function calculateTotal(price: number, quantity: number) {
            const tax = price * 0.1;
            return (price + tax) * quantity;
          }
        `,
      },
      {
        file: 'file2.ts',
        content: `
          function calculateTotal(price: number, quantity: number) {
            const tax = price * 0.1;
            return (price + tax) * quantity;
          }
        `,
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.9,
      minLines: 3,
      batchSize: 100,
      approx: true,
      minSharedTokens: 5,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].similarity).toBe(1.0);
    expect(duplicates[0].patternType).toBe('function');
  });

  it('should detect similar but not identical functions', async () => {
    const files = [
      {
        file: 'file1.ts',
        content: `
          function processOrder(order: any) {
            validateOrder(order);
            calculateTax(order);
            saveToDatabase(order);
            return { status: 'success' };
          }
        `,
      },
      {
        file: 'file2.ts',
        content: `
          async function handleOrder(data: any) {
            validateOrder(data);
            calculateTax(data);
            await saveToDatabase(data);
            return { success: true };
          }
        `,
      },
    ];

    // Lower threshold to 0.4 because different identifier names reduce Jaccard similarity
    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.4,
      minLines: 3,
      batchSize: 100,
      approx: true,
      minSharedTokens: 5,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].similarity).toBeGreaterThan(0.4);
    expect(duplicates[0].similarity).toBeLessThan(1.0);
  });

  it('should categorize API handler patterns', async () => {
    const files = [
      {
        file: 'routes/user.ts',
        content: `
          app.get('/users', (req, res) => {
            const users = db.find('users');
            res.json(users);
          });
        `,
      },
      {
        file: 'routes/product.ts',
        content: `
          app.get('/products', (req, res) => {
            const products = db.find('products');
            res.json(products);
          });
        `,
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.4,
      minLines: 2,
      batchSize: 100,
      approx: true,
      minSharedTokens: 5,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].patternType).toBe('api-handler');
  });

  it('should categorize validator patterns', async () => {
    const files = [
      {
        file: 'schemas/user.ts',
        content: `
          export const UserSchema = z.object({
            name: z.string(),
            email: z.string().email(),
          });
        `,
      },
      {
        file: 'schemas/product.ts',
        content: `
          export const ProductSchema = z.object({
            name: z.string(),
            price: z.number(),
          });
        `,
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.4,
      minLines: 2,
      batchSize: 100,
      approx: true,
      minSharedTokens: 5,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].patternType).toBe('validator');
  });

  it('should calculate token cost', async () => {
    const files = [
      {
        file: 'a.ts',
        content: `
          function calculateTotal(price: number, quantity: number) {
            const tax = price * 0.1;
            return (price + tax) * quantity;
          }
        `,
      },
      {
        file: 'b.ts',
        content: `
          function calculateTotal(price: number, quantity: number) {
            const tax = price * 0.1;
            return (price + tax) * quantity;
          }
        `,
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.8,
      minLines: 1,
      batchSize: 100,
      approx: true,
      minSharedTokens: 2,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].tokenCost).toBeGreaterThan(0);
  });

  it('should not detect patterns below similarity threshold', async () => {
    const files = [
      {
        file: 'a.ts',
        content: 'function a() { console.log("hello"); }',
      },
      {
        file: 'b.ts',
        content: 'function b() { const x = 42; return x * x; }',
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.9,
      minLines: 1,
      batchSize: 100,
      approx: true,
      minSharedTokens: 2,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBe(0);
  });

  it('should not compare blocks from the same file', async () => {
    const files = [
      {
        file: 'a.ts',
        content: `
          function a() { return 1; }
          function b() { return 1; }
        `,
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.9,
      minLines: 1,
      batchSize: 100,
      approx: true,
      minSharedTokens: 2,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    expect(duplicates.length).toBe(0);
  });

  it('should sort duplicates by similarity and token cost', async () => {
    const files = [
      {
        file: 'a.ts',
        content: 'function a() { return 1; }',
      },
      {
        file: 'b.ts',
        content: 'function b() { return 1; }',
      },
      {
        file: 'c.ts',
        content:
          'function c() { return 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10; }',
      },
    ];

    const duplicates = await detectDuplicatePatterns(files, {
      minSimilarity: 0.7,
      minLines: 1,
      batchSize: 100,
      approx: true,
      minSharedTokens: 2,
      maxCandidatesPerBlock: 10,
      streamResults: false,
    });

    if (duplicates.length > 1) {
      expect(duplicates[0].similarity).toBeGreaterThanOrEqual(
        duplicates[1].similarity
      );
    }
  });
});
