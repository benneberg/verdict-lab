import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server.js';
import { evalCache } from '../server/evalCache.js';

describe('Express API Gateway Integration Tests', () => {
  beforeEach(() => {
    evalCache.clear();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK with server status and cache telemetry', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('cacheSize');
    });
  });

  describe('POST /api/evaluate — Input Validation & Error Handling', () => {
    it('should return 400 when body is missing or empty', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('variantA is required');
    });

    it('should return 400 when variantA is missing or whitespace', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          variantA: '   ',
          variantB: 'Valid variant B output',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('variantA is required');
    });

    it('should return 400 when variantB is missing', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          variantA: 'Valid variant A output',
          variantB: '',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('variantB is required');
    });

    it('should return 400 when variantA exceeds 50,000 characters', async () => {
      const longText = 'A'.repeat(50001);
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          variantA: longText,
          variantB: 'Valid variant B',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds maximum character limit');
    });

    it('should return 400 when rubric contains invalid structure', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          variantA: 'Valid variant A',
          variantB: 'Valid variant B',
          rubric: {
            Accuracy: 'invalid-structure' as any,
          },
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid rubric structure');
    });
  });

  describe('POST /api/inference — Input Validation', () => {
    it('should return 400 when prompt is empty', async () => {
      const res = await request(app)
        .post('/api/inference')
        .send({ prompt: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('prompt is required');
    });

    it('should return 400 when prompt exceeds 50,000 characters', async () => {
      const longPrompt = 'P'.repeat(50001);
      const res = await request(app)
        .post('/api/inference')
        .send({ prompt: longPrompt });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds maximum character limit');
    });
  });

  describe('Offline / Mock Evaluation Mode', () => {
    it('should execute deterministic evaluation in mock mode with complete schema', async () => {
      const payload = {
        variantA: 'Brief and structured response with key takeaways:\n- Feature 1\n- Feature 2',
        variantB: 'An overly verbose paragraph that wanders off topic and lacks structured points.',
        hypothesis: 'Bullet points improve readability and user comprehension.',
        rubric: {
          Conciseness: { max: 10, weight: 0.6 },
          Clarity: { max: 10, weight: 0.4 },
        },
        models: ['gemini-3.5-flash'],
        mockMode: true,
      };

      const res = await request(app)
        .post('/api/evaluate')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('winner');
      expect(['A', 'B', 'Tie']).toContain(res.body.winner);
      expect(res.body).toHaveProperty('confidence');
      expect(res.body).toHaveProperty('majority_vote_tally');
      expect(res.body).toHaveProperty('scores');
      expect(res.body.scores).toHaveProperty('A');
      expect(res.body.scores).toHaveProperty('B');
      expect(res.body).toHaveProperty('reasoning');
      expect(res.body.isMock).toBe(true);
    });

    it('should support mock mode via X-Mock-Mode request header', async () => {
      const payload = {
        variantA: 'Candidate A response',
        variantB: 'Candidate B response',
        hypothesis: 'Header test',
      };

      const res = await request(app)
        .post('/api/evaluate')
        .set('X-Mock-Mode', 'true')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.isMock).toBe(true);
    });

    it('should generate simulated inference text in mock mode', async () => {
      const res = await request(app)
        .post('/api/inference')
        .send({
          prompt: 'Explain quantum computing in one sentence.',
          systemInstruction: 'You are a physicist.',
          mockMode: true,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('text');
      expect(res.body.text).toContain('Simulation / Offline Mode');
      expect(res.body.isMock).toBe(true);
    });
  });

  describe('Evaluation Cache Layer & Telemetry', () => {
    const testPayload = {
      variantA: 'Deterministic output for caching test A',
      variantB: 'Deterministic output for caching test B',
      hypothesis: 'Cache verification',
      rubric: {
        Quality: { max: 10, weight: 1.0 },
      },
      mockMode: true,
    };

    it('should return X-Cache: MISS on first call and X-Cache: HIT on second identical call', async () => {
      // 1. Initial request (Cache Miss)
      const res1 = await request(app)
        .post('/api/evaluate')
        .send(testPayload);

      expect(res1.status).toBe(200);
      expect(res1.header['x-cache']).toBe('MISS');
      expect(res1.body.cached).toBe(false);

      // 2. Duplicate request (Cache Hit)
      const res2 = await request(app)
        .post('/api/evaluate')
        .send(testPayload);

      expect(res2.status).toBe(200);
      expect(res2.header['x-cache']).toBe('HIT');
      expect(res2.body.cached).toBe(true);
      expect(res2.body.winner).toBe(res1.body.winner);
    });

    it('should bypass cache when X-Bypass-Cache header is present', async () => {
      // Prime the cache
      await request(app).post('/api/evaluate').send(testPayload);

      // Request with bypass header
      const res = await request(app)
        .post('/api/evaluate')
        .set('X-Bypass-Cache', 'true')
        .send(testPayload);

      expect(res.status).toBe(200);
      expect(res.header['x-cache']).toBe('MISS');
      expect(res.body.cached).toBe(false);
    });

    it('should expose telemetry on GET /api/cache/stats and allow clearing', async () => {
      // Populate cache
      await request(app).post('/api/evaluate').send(testPayload);
      await request(app).post('/api/evaluate').send(testPayload); // 1 hit

      const statsRes = await request(app).get('/api/cache/stats');
      expect(statsRes.status).toBe(200);
      expect(statsRes.body.hits).toBeGreaterThanOrEqual(1);
      expect(statsRes.body.size).toBeGreaterThanOrEqual(1);

      const clearRes = await request(app).post('/api/cache/clear');
      expect(clearRes.status).toBe(200);
      expect(clearRes.body.stats.size).toBe(0);
    });
  });
});
