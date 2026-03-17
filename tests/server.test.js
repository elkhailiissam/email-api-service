const request = require('supertest');
const app = require('../server');

describe('Server API Endpoints', () => {
  it('GET / should return service info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual('Email API Service');
  });

  it('GET /api/health should return status success', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
  });

  it('GET /unknown should return 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toEqual(404);
  });
});
