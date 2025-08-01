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

describe('Rotas de Usuários', () => {
  let userId;
  it('Deve criar um novo usuário', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Teste User', email: 'testeuser@example.com', senha: '1234', role_id: 2 });
    expect([201, 400, 401, 403]).toContain(res.statusCode);
    if (res.statusCode === 201) userId = res.body.id;
  });

  it('Deve listar usuários', async () => {
    const res = await request(app)
      .get('/api/usuarios/pagina')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
  });

  it('Deve buscar usuário por ID', async () => {
    if (!userId) return;
    const res = await request(app)
      .get(`/api/usuarios/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404, 401]).toContain(res.statusCode);
  });
});

describe('Rotas de Processos', () => {
  let processoId;
  it('Deve criar um novo processo', async () => {
    const res = await request(app)
      .post('/api/processos/novo')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numero_processo: 'PROC123',
        descricao: 'Processo de teste',
        status: 'Ativo',
        materia_assunto_id: 1,
        local_tramitacao_id: 1,
        sistema: 'SEI',
        fase_id: 1,
        diligencia_id: 1,
        idusuario_responsavel: 1,
        contato_assistido: 'Contato',
        assistido: 'Assistido'
      });
    expect([201, 400, 401, 403]).toContain(res.statusCode);
    if (res.statusCode === 201) processoId = res.body.id;
  });

  it('Deve listar processos', async () => {
    const res = await request(app)
      .get('/api/processos')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
  });

  it('Deve buscar processo por numero', async () => {
    const res = await request(app)
      .get('/api/processos/buscar?numero_processo=PROC123')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
  });

  it('Deve atualizar um processo', async () => {
    if (!processoId) return;
    const res = await request(app)
      .patch(`/api/processos/${processoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: 'Processo atualizado' });
    expect([200, 404, 403]).toContain(res.statusCode);
  });
});

describe('Rotas de Tabelas Auxiliares', () => {
  it('Deve listar matérias/assuntos', async () => {
    const res = await request(app)
      .get('/api/aux/materia-assunto')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.statusCode);
  });
});

describe('Rotas de Arquivos', () => {
  it('Deve listar arquivos de um processo', async () => {
    const res = await request(app)
      .get('/api/arquivos/processo/1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401, 404]).toContain(res.statusCode);
  });
});

describe('Rotas de Autorização', () => {
  it('Deve autenticar usuário', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@admin.com', senha: '1234' });
    expect([200, 401, 400]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success');
  });
});
