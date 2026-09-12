/**
 * Testing Techniques Demo — 单元测试、集成测试与TDD模式
 *
 * 运行: npx vitest run examples/index.ts
 *
 * 内容:
 * 1. 单元测试 (简单数学函数、字符串操作)
 * 2. 集成测试 (Mock数据库/API调用)
 * 3. TDD演示 (先写测试再实现)
 * 4. Mock/Stub模式
 */

// ─── 被测代码 (Implementation) ──────────────────────────────

/** 简单数学函数 */
class MathUtils {
  add(a: number, b: number): number { return a + b; }
  subtract(a: number, b: number): number { return a - b; }
  multiply(a: number, b: number): number { return a * b; }
  divide(a: number, b: number): number {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  }
}

/** 字符串操作 */
class StringUtils {
  reverse(str: string): string { return str.split('').reverse().join(''); }
  isPalindrome(str: string): boolean {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  }
  truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }
}

/** 模拟数据库 */
class MockDatabase {
  private data: Map<string, any> = new Map();

  query(id: string): any { return this.data.get(id); }
  insert(id: string, value: any): void { this.data.set(id, value); }
  delete(id: string): boolean { return this.data.delete(id); }
  getAll(): any[] { return Array.from(this.data.values()); }
}

/** 模拟API客户端 */
class HttpClient {
  async fetch(url: string): Promise<any> {
    return { status: 200, data: {} };
  }
}

// ─── 单元测试示例 ───────────────────────────────────────────

describe('MathUtils', () => {
  let utils: MathUtils;

  beforeEach(() => { utils = new MathUtils(); });

  test('add: 2 + 3 = 5', () => {
    expect(utils.add(2, 3)).toBe(5);
  });

  test('subtract: 10 - 4 = 6', () => {
    expect(utils.subtract(10, 4)).toBe(6);
  });

  test('multiply: 3 * 4 = 12', () => {
    expect(utils.multiply(3, 4)).toBe(12);
  });

  test('divide: 15 / 3 = 5', () => {
    expect(utils.divide(15, 3)).toBe(5);
  });

  test('divide by zero throws error', () => {
    expect(() => utils.divide(10, 0)).toThrow('Division by zero');
  });
});

describe('StringUtils', () => {
  let strUtils: StringUtils;

  beforeEach(() => { strUtils = new StringUtils(); });

  test('reverse: "hello" -> "olleh"', () => {
    expect(strUtils.reverse('hello')).toBe('olleh');
  });

  test('isPalindrome: "racecar" is palindrome', () => {
    expect(strUtils.isPalindrome('racecar')).toBe(true);
  });

  test('isPalindrome: "hello" is not palindrome', () => {
    expect(strUtils.isPalindrome('hello')).toBe(false);
  });

  test('truncate: long string gets truncated', () => {
    expect(strUtils.truncate('Hello World', 5)).toBe('Hello...');
  });

  test('truncate: short string remains unchanged', () => {
    expect(strUtils.truncate('Hi', 5)).toBe('Hi');
  });
});

// ─── 集成测试示例 (Mock) ────────────────────────────────────

describe('Integration Test: Database Query', () => {
  test('insert and retrieve data', () => {
    const db = new MockDatabase();

    db.insert('user1', { name: 'Alice', age: 30 });
    db.insert('user2', { name: 'Bob', age: 25 });

    expect(db.query('user1')).toEqual({ name: 'Alice', age: 30 });
    expect(db.getAll()).toHaveLength(2);
  });

  test('delete removes data', () => {
    const db = new MockDatabase();
    db.insert('item1', { value: 100 });

    expect(db.delete('item1')).toBe(true);
    expect(db.query('item1')).toBeUndefined();
  });
});

describe('Integration Test: HTTP Client with Mock', () => {
  test('fetch API response', async () => {
    const client = new HttpClient();
    const mockResponse = { status: 200, data: { id: 1, name: 'Test' } };

    // 实际测试中会 spy/mock fetch 方法
    const originalFetch = client.fetch;
    client.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await client.fetch('/api/users/1');
    expect(result.status).toBe(200);
    expect(result.data.name).toBe('Test');

    client.fetch = originalFetch;
  });
});

// ─── TDD 演示 ───────────────────────────────────────────────

/**
 * TDD 流程:
 * 1. Red: 先写失败的测试
 * 2. Green: 写最少的代码使测试通过
 * 3. Refactor: 重构代码
 */

describe('TDD: Calculator', () => {
  class Calculator {
    private history: number[] = [];

    add(n: number): number {
      this.history.push(n);
      return this.history.reduce((a, b) => a + b, 0);
    }

    clear(): void { this.history = []; }
    getHistory(): number[] { return [...this.history]; }
  }

  let calc: Calculator;

  beforeEach(() => { calc = new Calculator(); });

  // Test 1: 初始状态
  test('initial calculation is 0', () => {
    expect(calc.add(0)).toBe(0);
  });

  // Test 2: 单次加法
  test('single addition', () => {
    expect(calc.add(5)).toBe(5);
  });

  // Test 3: 多次累加
  test('multiple additions', () => {
    calc.add(3);
    calc.add(4);
    expect(calc.add(5)).toBe(12);
  });

  // Test 4: 历史记录
  test('history tracking', () => {
    calc.add(2);
    calc.add(3);
    expect(calc.getHistory()).toEqual([2, 3]);
  });

  // Test 5: 清除功能
  test('clear resets calculation', () => {
    calc.add(10);
    calc.clear();
    expect(calc.add(5)).toBe(5);
    expect(calc.getHistory()).toEqual([5]);
  });
});

// ─── Mock/Stub 模式 ─────────────────────────────────────────

describe('Mock Patterns', () => {
  test('spy on method call', () => {
    const db = new MockDatabase();
    const spy = jest.spyOn(db, 'insert');

    db.insert('key1', 'value1');
    db.insert('key2', 'value2');

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('key1', 'value1');
    expect(spy).toHaveBeenCalledWith('key2', 'value2');

    spy.mockRestore();
  });

  test('stub return value', () => {
    const db = new MockDatabase();
    const stub = jest.spyOn(db, 'query').mockReturnValue({ stubbed: true });

    expect(db.query('any')).toEqual({ stubbed: true });

    stub.mockRestore();
  });

  test('mock async function', async () => {
    const client = new HttpClient();
    const mockData = { success: true, count: 42 };

    const mockFn = jest.fn().mockResolvedValue(mockData);
    client.fetch = mockFn;

    const result = await client.fetch('/api/data');
    expect(result).toEqual(mockData);
    expect(mockFn).toHaveBeenCalledWith('/api/data');
  });
});

// ─── 测试套件总结 ───────────────────────────────────────────

console.log('\n✅ Testing Techniques Demo Completed');
console.log('   - Unit tests: MathUtils, StringUtils');
console.log('   - Integration tests: MockDatabase, HttpClient');
console.log('   - TDD demo: Calculator (Red-Green-Refactor)');
console.log('   - Mock patterns: Spy, Stub, Async mock');

/**
 * 运行测试:
 * npx vitest run examples/index.ts
 *
 * 或单个测试:
 * npx vitest run examples/index.ts -t "MathUtils"
 */
