import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const source = stripTypeScriptTypes(readFileSync(new URL('../app/api/finance/stats/route.ts', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace('export async function GET', 'async function GET');

function harness(results, rejectIndex = -1) {
    let connected = false;
    const calls = [];
    const pending = [];
    const aggregate = (model) => (pipeline) => {
        assert.ok(connected, 'database connection must finish first');
        const index = calls.length;
        calls.push({ model, pipeline });
        return new Promise((resolve, reject) => pending.push(() =>
            index === rejectIndex ? reject(new Error('query failed')) : resolve(results[index])));
    };
    const context = vm.createContext({
        dbConnect: async () => { connected = true; },
        Order: { aggregate: aggregate('Order') },
        Transaction: { aggregate: aggregate('Transaction') },
        startOfMonth: () => new Date('2026-11-01T00:00:00Z'),
        NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) },
        console: { error() {} },
    });
    const GET = vm.runInContext(`${source}\nGET`, context);
    return { GET, calls, pending };
}

async function execute(results, rejectIndex) {
    const h = harness(results, rejectIndex);
    const response = h.GET();
    await new Promise(setImmediate);
    assert.equal(h.pending.length, 4, 'all queries start before any query resolves');
    // Complete out of order to check result-to-field mapping.
    for (const index of [3, 1, 2, 0]) h.pending[index]();
    return { result: JSON.parse(JSON.stringify(await response)), calls: h.calls };
}

test('runs independent aggregations concurrently and preserves financial totals', async () => {
    const { result, calls } = await execute([
        [{ totalRevenue: 120, pendingRevenue: 30 }],
        [{ totalExpenses: 40 }], [{ total: 50 }], [{ total: 15 }],
    ]);
    assert.deepEqual(result, { status: 200, body: { success: true, data: {
        totalRevenue: 120, pendingRevenue: 30, totalExpenses: 40, netProfit: 80,
        currentMonth: { revenue: 50, expenses: 15 },
    } } });
    assert.deepEqual(calls.map(c => c.model), ['Order', 'Transaction', 'Order', 'Transaction']);
    assert.equal(calls[1].pipeline[0].$match.type, 'EXPENSE');
    assert.equal(calls[2].pipeline[0].$match.createdAt.$gte.toISOString(), '2026-11-01T00:00:00.000Z');
    assert.equal(calls[3].pipeline[0].$match.type, 'EXPENSE');
});

test('empty aggregates keep zero defaults', async () => {
    const { result } = await execute([[], [], [], []]);
    assert.deepEqual(result.body.data, {
        totalRevenue: 0, pendingRevenue: 0, totalExpenses: 0, netProfit: 0,
        currentMonth: { revenue: 0, expenses: 0 },
    });
});

test('a failed aggregation returns the existing 500 response', async () => {
    const { result } = await execute([[], [], [], []], 1);
    assert.deepEqual(result, { status: 500, body: {
        success: false, error: 'Failed to calculate stats',
    } });
});
