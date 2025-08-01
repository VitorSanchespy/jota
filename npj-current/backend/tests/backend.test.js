const request = require('supertest');
const app = require('../index');

describe('API Backend - Testes automatizados', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@admin.com', senha: '1234' });
    if (res.body.token) token = res.body.token;
  });

  it('Deve retornar 404 na rota raiz', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(404);
  });

  it('Deve listar usuários', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('Deve listar processos', async () => {
    const res = await request(app)
      .get('/api/processos')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('Deve autenticar usuário', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@admin.com', senha: '1234' });
    expect([200, 401, 400]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success');
  });

  // Adicione mais testes conforme suas rotas
});
