/**
 * Simple tests that don't depend on auth modules
 * These tests are designed to run for the POC without any complex dependencies
 */

describe('Simple Tests', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('math operations work correctly', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 5).toBe(25);
    expect(10 / 2).toBe(5);
  });

  test('string operations work correctly', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('hello world'.split(' ')).toEqual(['hello', 'world']);
    expect('  trim me  '.trim()).toBe('trim me');
  });

  test('array operations work correctly', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
  });
}); 