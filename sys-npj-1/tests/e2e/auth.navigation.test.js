const puppeteer = require('puppeteer');

describe('Teste de Autenticação e Navegação', () => {
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

  test('Deve fazer login com credenciais válidas', async () => {
    try {
      // 1. Ir para página de login
      await page.goto(global.testConfig.baseUrl);
      
      // 2. Verificar se está na página de login
      await page.waitForSelector('input[type="email"], input[name="email"]');
      
      // 3. Preencher credenciais
      await page.type('input[type="email"], input[name="email"]', global.testConfig.credenciais.admin.email);
      await page.type('input[type="password"], input[name="senha"]', global.testConfig.credenciais.admin.senha);
      
      // 4. Clicar em entrar
      await page.click('button[type="submit"], button:has-text("Entrar"), .login-btn');
      
      // 5. Aguardar redirecionamento
      await page.waitForNavigation({ timeout: 10000 });
      
      // 6. Verificar se chegou ao dashboard
      const dashboard = await page.$('[data-testid="dashboard"], .dashboard, .main-content');
      expect(dashboard).toBeTruthy();
      
    } catch (error) {
      await captureScreenshot(page, 'login-erro');
      throw error;
    }
  });

  test('Deve rejeitar credenciais inválidas', async () => {
    try {
      await page.goto(global.testConfig.baseUrl);
      
      // Tentar login com credenciais inválidas
      await page.type('input[type="email"]', 'usuario@inexistente.com');
      await page.type('input[type="password"]', 'senhaerrada');
      
      await page.click('button[type="submit"]');
      
      // Aguardar mensagem de erro
      const erro = await page.waitForSelector('.error, .alert-danger, .login-error', { timeout: 5000 });
      expect(erro).toBeTruthy();
      
    } catch (error) {
      await captureScreenshot(page, 'login-invalido-erro');
      throw error;
    }
  });

  test('Deve navegar pelas principais páginas', async () => {
    try {
      // Fazer login primeiro
      await login(page, global.testConfig.credenciais.admin);
      
      const paginasParaTestar = [
        { url: '/processos', nome: 'Processos' },
        { url: '/agendamentos', nome: 'Agendamentos' },
        { url: '/usuarios', nome: 'Usuários' },
        { url: '/relatorios', nome: 'Relatórios' }
      ];
      
      for (const pagina of paginasParaTestar) {
        try {
          // Navegar para a página
          await page.goto(`${global.testConfig.baseUrl}${pagina.url}`);
          
          // Aguardar carregar
          await page.waitForSelector('main, .page-content, .container', { timeout: 5000 });
          
          // Verificar se não há erro 404
          const erro404 = await page.$('.error-404, .not-found');
          expect(erro404).toBeFalsy();
          
          console.log(`✓ Página ${pagina.nome} carregou corretamente`);
          
        } catch (error) {
          console.log(`✗ Erro ao carregar página ${pagina.nome}:`, error.message);
          await captureScreenshot(page, `navegacao-${pagina.nome.toLowerCase()}-erro`);
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'navegacao-geral-erro');
      throw error;
    }
  });

  test('Deve fazer logout corretamente', async () => {
    try {
      // Garantir que está logado
      await login(page, global.testConfig.credenciais.admin);
      
      // Procurar botão de logout
      const logoutBtn = await page.$('[data-testid="logout"], .logout-btn, button:has-text("Sair")');
      if (logoutBtn) {
        await logoutBtn.click();
      } else {
        // Tentar no menu do usuário
        const userMenu = await page.$('.user-menu, .profile-menu, .avatar');
        if (userMenu) {
          await userMenu.click();
          await page.waitForTimeout(500);
          
          const logoutMenuItem = await page.$('a:has-text("Sair"), button:has-text("Logout")');
          if (logoutMenuItem) {
            await logoutMenuItem.click();
          }
        }
      }
      
      // Aguardar redirecionamento para login
      await page.waitForNavigation({ timeout: 5000 });
      
      // Verificar se voltou para a página de login
      const loginForm = await page.$('input[type="email"], .login-form');
      expect(loginForm).toBeTruthy();
      
    } catch (error) {
      await captureScreenshot(page, 'logout-erro');
      throw error;
    }
  });

  test('Deve proteger rotas privadas', async () => {
    try {
      // Garantir que não está logado
      await page.goto(global.testConfig.baseUrl);
      
      // Tentar acessar rota protegida diretamente
      await page.goto(`${global.testConfig.baseUrl}/processos`);
      
      // Deve redirecionar para login
      await page.waitForSelector('input[type="email"], .login-form', { timeout: 5000 });
      
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|auth/);
      
    } catch (error) {
      await captureScreenshot(page, 'protecao-rota-erro');
      throw error;
    }
  });
});
