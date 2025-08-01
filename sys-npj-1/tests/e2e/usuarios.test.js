const puppeteer = require('puppeteer');

describe('Teste de Gestão de Usuários', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Admin deve conseguir criar novo usuário', async () => {
    try {
      // Login como admin
      await login(page, global.testConfig.credenciais.admin);
      
      // Navegar para usuários
      await page.goto(`${global.testConfig.baseUrl}/usuarios`);
      await page.waitForSelector('.usuarios-page, .user-list, table');
      
      // Clicar em novo usuário
      const novoBtn = await page.$('button:has-text("Novo"), button:has-text("Criar"), .add-user-btn');
      if (novoBtn) {
        await novoBtn.click();
      }
      
      await page.waitForSelector('form, .user-form');
      
      // Dados do novo usuário
      const timestamp = Date.now();
      const novoUsuario = {
        nome: `Usuário Teste ${timestamp}`,
        email: `teste${timestamp}@email.com`,
        senha: 'senha123',
        telefone: '(11) 99999-9999'
      };
      
      // Preencher formulário
      await page.type('input[name="nome"]', novoUsuario.nome);
      await page.type('input[name="email"]', novoUsuario.email);
      await page.type('input[name="senha"], input[type="password"]', novoUsuario.senha);
      
      const telefoneField = await page.$('input[name="telefone"]');
      if (telefoneField) {
        await page.type('input[name="telefone"]', novoUsuario.telefone);
      }
      
      // Selecionar role
      const roleSelect = await page.$('select[name="role_id"], select[name="role"]');
      if (roleSelect) {
        await page.select('select[name="role_id"], select[name="role"]', '2'); // Professor
      }
      
      // Salvar
      await page.click('button[type="submit"]');
      
      // Aguardar sucesso
      await page.waitForSelector('.success, .alert-success', { timeout: 10000 });
      
      // Verificar se usuário aparece na lista
      const usuarioNaLista = await page.evaluate((email) => {
        const elementos = document.querySelectorAll('*');
        return Array.from(elementos).some(el => 
          el.textContent && el.textContent.includes(email)
        );
      }, novoUsuario.email);
      
      expect(usuarioNaLista).toBe(true);
      
    } catch (error) {
      await captureScreenshot(page, 'criar-usuario-erro');
      throw error;
    }
  });

  test('Deve validar email único', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/usuarios`);
      
      const novoBtn = await page.$('button:has-text("Novo"), .add-user-btn');
      if (novoBtn) {
        await novoBtn.click();
        await page.waitForSelector('form');
        
        // Tentar criar usuário com email já existente
        await page.type('input[name="nome"]', 'Usuário Duplicado');
        await page.type('input[name="email"]', global.testConfig.credenciais.admin.email);
        await page.type('input[name="senha"]', 'senha123');
        
        await page.click('button[type="submit"]');
        
        // Aguardar erro
        const erro = await page.waitForSelector('.error, .alert-danger', { timeout: 5000 });
        expect(erro).toBeTruthy();
      }
      
    } catch (error) {
      await captureScreenshot(page, 'validacao-email-erro');
      throw error;
    }
  });

  test('Deve editar usuário existente', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/usuarios`);
      await page.waitForSelector('table, .user-list');
      
      // Clicar no primeiro usuário para editar
      const editarBtn = await page.$('button:has-text("Editar"), .edit-btn, .fa-edit');
      if (editarBtn) {
        await editarBtn.click();
      } else {
        // Tentar clicar na primeira linha
        await page.click('tbody tr:first-child');
        await page.waitForTimeout(1000);
        
        const editModal = await page.$('button:has-text("Editar")');
        if (editModal) {
          await editModal.click();
        }
      }
      
      await page.waitForSelector('form input[name="nome"]');
      
      // Modificar nome
      const nomeAtual = await page.$eval('input[name="nome"]', el => el.value);
      const novoNome = `${nomeAtual} - EDITADO`;
      
      await page.focus('input[name="nome"]');
      await page.keyboard.selectAll();
      await page.type('input[name="nome"]', novoNome);
      
      // Salvar
      await page.click('button[type="submit"]');
      
      // Aguardar sucesso
      await page.waitForSelector('.success, .alert-success');
      
      // Verificar mudança
      const nomeEditado = await page.evaluate((nome) => {
        const elementos = document.querySelectorAll('*');
        return Array.from(elementos).some(el => 
          el.textContent && el.textContent.includes(nome)
        );
      }, novoNome);
      
      expect(nomeEditado).toBe(true);
      
    } catch (error) {
      await captureScreenshot(page, 'editar-usuario-erro');
      throw error;
    }
  });

  test('Deve desativar usuário', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/usuarios`);
      
      // Procurar usuário ativo
      const desativarBtn = await page.$('button:has-text("Desativar"), .deactivate-btn');
      if (desativarBtn) {
        await desativarBtn.click();
        
        // Confirmar ação se houver modal
        const confirmarBtn = await page.$('button:has-text("Confirmar"), .confirm-btn');
        if (confirmarBtn) {
          await confirmarBtn.click();
        }
        
        // Aguardar sucesso
        await page.waitForSelector('.success, .alert-success');
        
        // Verificar se status mudou
        const usuarioDesativado = await page.$('.user-inactive, .status-inactive');
        expect(usuarioDesativado).toBeTruthy();
      }
      
    } catch (error) {
      await captureScreenshot(page, 'desativar-usuario-erro');
      throw error;
    }
  });

  test('Deve filtrar usuários por role', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/usuarios`);
      
      const filtroRole = await page.$('select[name="role"], .role-filter');
      if (filtroRole) {
        // Filtrar por professores
        await page.select('select[name="role"], .role-filter', 'Professor');
        
        await page.waitForTimeout(2000);
        
        // Verificar se apenas professores aparecem
        const roles = await page.$$eval('.user-role, .role-cell', elements => 
          elements.map(el => el.textContent.trim())
        );
        
        const apenasProfs = roles.every(role => role === 'Professor');
        expect(apenasProfs).toBe(true);
      }
      
    } catch (error) {
      await captureScreenshot(page, 'filtro-usuario-erro');
      throw error;
    }
  });

  test('Deve buscar usuários por nome', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/usuarios`);
      
      const campoBusca = await page.$('input[name="search"], .search-input');
      if (campoBusca) {
        // Buscar por "admin"
        await page.type('input[name="search"], .search-input', 'admin');
        
        // Aguardar filtro
        await page.waitForTimeout(2000);
        
        // Verificar se resultados contêm "admin"
        const nomes = await page.$$eval('.user-name, .name-cell', elements => 
          elements.map(el => el.textContent.toLowerCase())
        );
        
        const contemAdmin = nomes.some(nome => nome.includes('admin'));
        expect(contemAdmin).toBe(true);
      }
      
    } catch (error) {
      await captureScreenshot(page, 'busca-usuario-erro');
      throw error;
    }
  });
});
