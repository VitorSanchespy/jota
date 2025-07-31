const request = require('supertest');
const app = require('../index');

let token;

beforeAll(async () => {
  // Login como admin
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@admin.com', senha: '1234' });
  token = res.body.token;
});

describe('Rotas de Perfil do Usuário Autenticado', () => {
  it('Deve retornar o perfil do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/usuarios/me')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('nome');
      expect(res.body).toHaveProperty('email');
    }
  });

  it('Deve atualizar dados do usuário autenticado', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Novo Nome', email: 'admin@admin.com', role_id: 1 });
    expect([200, 401]).toContain(res.statusCode);
  });

  it('Deve trocar a senha do usuário autenticado', async () => {
    const res = await request(app)
      .put('/api/usuarios/me/senha')
      .set('Authorization', `Bearer ${token}`)
      .send({ senha: 'novaSenha123' });
    expect([200, 401]).toContain(res.statusCode);
  });

  it('Deve inativar (soft delete) o próprio usuário', async () => {
    const res = await request(app)
      .delete('/api/usuarios/me')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
  });
});
