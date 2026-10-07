import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import app from './app.js';

test('a visitor key overrides the demo key for a real API request', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GROQ_API_KEY;
  const sentToGroq: string[] = [];
  process.env.GROQ_API_KEY = 'shared-demo-key';
  globalThis.fetch = async (_url, init) => {
    sentToGroq.push((init?.headers as Record<string, string>).Authorization);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ question: { text: 'Tell me about your project.', focus: 'Ownership' } }) } }] }), { status: 200 });
  };
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try {
    const address = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${address.port}/api/index?action=start`;
    const analysis = {
      role: { title: 'Product Engineer', requiredSkills: ['React'], responsibilities: ['Build interfaces'] },
      candidate: { name: 'Aarav', projects: ['CampusPath'], experience: ['Internship'], claimsToProbe: [] },
      fit: { score: 100, items: [] },
    };
    const request = (key?: string) => originalFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(key ? { 'x-groq-api-key': key } : {}) },
      body: JSON.stringify({ analysis }),
    });
    assert.equal((await request('visitor-key')).status, 200);
    assert.equal((await request()).status, 200);
    assert.deepEqual(sentToGroq, ['Bearer visitor-key', 'Bearer shared-demo-key']);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = originalKey;
  }
});
