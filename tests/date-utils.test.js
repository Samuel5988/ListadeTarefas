/**
 * Date Utils Tests - Testes simples para funções de manipulação de datas
 * @author Lista de Tarefas App
 * @version 1.0.0
 * @description Testes unitários para addHours, addDays e setHour
 *
 * Para executar:
 * 1. No navegador: Importar este script no console ou HTML
 * 2. Node.js: node --experimental-modules tests/date-utils.test.js
 */

import { addHours, addDays, setHour, isToday, isTomorrow, isPast } from '../utils/date-utils.js';

// Simple test framework
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    test(name, fn) {
        try {
            fn();
            this.passed++;
            this.results.push({ name, status: 'PASS' });
            console.log(`✓ ${name}`);
        } catch (error) {
            this.failed++;
            this.results.push({ name, status: 'FAIL', error: error.message });
            console.error(`✗ ${name}: ${error.message}`);
        }
    }

    assertEqual(actual, expected, message) {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(`${message || ''}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`);
        }
    }

    assertTrue(condition, message) {
        if (!condition) {
            throw new Error(message || 'Expected truthy value');
        }
    }

    assertFalse(condition, message) {
        if (condition) {
            throw new Error(message || 'Expected falsy value');
        }
    }

    assertValidISODate(dateString, message) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error(`${message || ''}\n  Invalid ISO date: ${dateString}`);
        }
    }

    summary() {
        console.log('\n=== Test Summary ===');
        console.log(`Total: ${this.passed + this.failed}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);

        if (this.failed > 0) {
            console.log('\nFailed tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`  - ${r.name}: ${r.error}`);
            });
        }

        return this.failed === 0;
    }
}

// Run tests
const runner = new TestRunner();

console.log('Running date-utils tests...\n');

// === addHours tests ===
runner.test('addHours should add 1 hour to date', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addHours(baseDate, 1);
    const expected = '2025-01-07T11:00:00.000Z';
    runner.assertEqual(result, expected, 'addHours(1h) should return correct ISO date');
    runner.assertValidISODate(result, 'Result should be valid ISO date');
});

runner.test('addHours should add 3 hours to date', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addHours(baseDate, 3);
    const expected = '2025-01-07T13:00:00.000Z';
    runner.assertEqual(result, expected, 'addHours(3h) should return correct ISO date');
});

runner.test('addHours should handle Date object input', () => {
    const baseDate = new Date('2025-01-07T10:00:00.000Z');
    const result = addHours(baseDate, 2);
    const expected = '2025-01-07T12:00:00.000Z';
    runner.assertEqual(result, expected, 'addHours should accept Date object');
});

runner.test('addHours should handle negative hours', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addHours(baseDate, -2);
    const expected = '2025-01-07T08:00:00.000Z';
    runner.assertEqual(result, expected, 'addHours should handle negative values');
});

// === addDays tests ===
runner.test('addDays should add 1 day to date', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addDays(baseDate, 1);
    const expected = '2025-01-08T10:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays(1d) should return correct ISO date');
    runner.assertValidISODate(result, 'Result should be valid ISO date');
});

runner.test('addDays should add 7 days to date', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addDays(baseDate, 7);
    const expected = '2025-01-14T10:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays(7d) should return correct ISO date');
});

runner.test('addDays should handle Date object input', () => {
    const baseDate = new Date('2025-01-07T10:00:00.000Z');
    const result = addDays(baseDate, 2);
    const expected = '2025-01-09T10:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays should accept Date object');
});

runner.test('addDays should handle negative days', () => {
    const baseDate = '2025-01-10T10:00:00.000Z';
    const result = addDays(baseDate, -3);
    const expected = '2025-01-07T10:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays should handle negative values');
});

runner.test('addDays should handle month boundaries', () => {
    const baseDate = '2025-01-31T10:00:00.000Z';
    const result = addDays(baseDate, 1);
    const expected = '2025-02-01T10:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays should handle month boundaries');
});

// === setHour tests ===
runner.test('setHour should set hour to 9', () => {
    const baseDate = '2025-01-07T10:30:45.000Z';
    const result = setHour(baseDate, 9);
    // Expected: 2025-01-07T09:00:00.000Z (minutes and seconds reset to 0)
    const resultDate = new Date(result);
    runner.assertEqual(resultDate.getHours(), 9, 'setHour(9) should set hour to 9');
    runner.assertEqual(resultDate.getMinutes(), 0, 'setHour should reset minutes to 0');
    runner.assertEqual(resultDate.getSeconds(), 0, 'setHour should reset seconds to 0');
    runner.assertValidISODate(result, 'Result should be valid ISO date');
});

runner.test('setHour should set hour to 0 (midnight)', () => {
    const baseDate = '2025-01-07T10:30:45.000Z';
    const result = setHour(baseDate, 0);
    const resultDate = new Date(result);
    runner.assertEqual(resultDate.getHours(), 0, 'setHour(0) should set hour to 0');
});

runner.test('setHour should set hour to 23 (11pm)', () => {
    const baseDate = '2025-01-07T10:30:45.000Z';
    const result = setHour(baseDate, 23);
    const resultDate = new Date(result);
    runner.assertEqual(resultDate.getHours(), 23, 'setHour(23) should set hour to 23');
});

runner.test('setHour should handle Date object input', () => {
    const baseDate = new Date('2025-01-07T10:30:45.000Z');
    const result = setHour(baseDate, 14);
    const resultDate = new Date(result);
    runner.assertEqual(resultDate.getHours(), 14, 'setHour should accept Date object');
});

// === Integration tests (PostponeMenu scenarios) ===
runner.test('Integration: Postpone 1 hour scenario', () => {
    const currentDate = '2025-01-07T10:00:00.000Z';
    const newDate = addHours(currentDate, 1);
    const expected = '2025-01-07T11:00:00.000Z';
    runner.assertEqual(newDate, expected, 'Postpone 1h should work correctly');
});

runner.test('Integration: Postpone 3 hours scenario', () => {
    const currentDate = '2025-01-07T10:00:00.000Z';
    const newDate = addHours(currentDate, 3);
    const expected = '2025-01-07T13:00:00.000Z';
    runner.assertEqual(newDate, expected, 'Postpone 3h should work correctly');
});

runner.test('Integration: Postpone to tomorrow 9am scenario', () => {
    const now = new Date('2025-01-07T14:00:00.000Z');
    const tomorrow = addDays(now, 1);
    const tomorrow9am = setHour(tomorrow, 9);
    const resultDate = new Date(tomorrow9am);
    runner.assertEqual(resultDate.getDate(), 8, 'Should be day 8');
    runner.assertEqual(resultDate.getHours(), 9, 'Should be 9am');
});

runner.test('Integration: Postpone to next week scenario', () => {
    const now = new Date('2025-01-07T10:00:00.000Z');
    const nextWeek = addDays(now, 7);
    const expected = '2025-01-14T10:00:00.000Z';
    runner.assertEqual(nextWeek, expected, 'Postpone 7 days should work correctly');
});

// === Edge cases ===
runner.test('Edge case: addHours with 0 hours', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addHours(baseDate, 0);
    runner.assertEqual(result, baseDate, 'addHours(0) should return same date');
});

runner.test('Edge case: addDays with 0 days', () => {
    const baseDate = '2025-01-07T10:00:00.000Z';
    const result = addDays(baseDate, 0);
    runner.assertEqual(result, baseDate, 'addDays(0) should return same date');
});

runner.test('Edge case: addHours crossing day boundary', () => {
    const baseDate = '2025-01-07T23:00:00.000Z';
    const result = addHours(baseDate, 2);
    const expected = '2025-01-08T01:00:00.000Z';
    runner.assertEqual(result, expected, 'addHours should cross day boundary');
});

runner.test('Edge case: addDays crossing year boundary', () => {
    const baseDate = '2025-12-31T23:00:00.000Z';
    const result = addDays(baseDate, 1);
    const expected = '2026-01-01T23:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays should cross year boundary');
});

runner.test('Edge case: addDays crossing leap year', () => {
    const baseDate = '2024-02-28T10:00:00.000Z';
    const result = addDays(baseDate, 1);
    // 2024 is a leap year, so Feb 29 exists
    const expected = '2024-02-29T10:00:00.000Z';
    runner.assertEqual(result, expected, 'addDays should handle leap year');
});

// Print summary
const allPassed = runner.summary();

// Export result for CI/CD
export { runner, allPassed };
