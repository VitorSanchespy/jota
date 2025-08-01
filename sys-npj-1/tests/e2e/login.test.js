const puppeteer = require('puppeteer');

describe('Teste de Login Simples', () => {
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

  test('Deve conseguir fazer login com admin', async () => {
    try {
      // Navegar para página inicial
      await page.goto(global.testConfig.baseUrl);
      
      // Aguardar aparecer os campos de login
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      
      // Preencher credenciais
      await page.type('input[type="email"]', global.testConfig.credenciais.admin.email);
      await page.type('input[type="password"]', global.testConfig.credenciais.admin.senha);
      
      // Clicar em entrar
      await page.click('button[type="submit"]');
      
      // Aguardar redirecionamento para dashboard
      await page.waitForSelector('.dashboard, .content, h1', { timeout: 15000 });
      
      // Verificar se estamos na página correta
      const currentUrl = page.url();
      expect(currentUrl).toContain('dashboard');
      
    } catch (error) {
      await captureScreenshot(page, 'login-simples-erro');
      throw error;
    }
  });

  test('Deve mostrar erro com credenciais inválidas', async () => {
    try {
      await page.goto(global.testConfig.baseUrl);
      
      await page.waitForSelector('input[type="email"]');
      
      // Limpar campos
      await page.evaluate(() => {
        document.querySelector('input[type="email"]').value = '';
        document.querySelector('input[type="password"]').value = '';
      });
      
      // Credenciais inválidas
      await page.type('input[type="email"]', 'invalido@teste.com');
      await page.type('input[type="password"]', 'senhaerrada');
      
      await page.click('button[type="submit"]');
      
      // Aguardar mensagem de erro
      const erro = await page.waitForSelector('.error, [style*="background-color: #fee"]', { timeout: 5000 });
      expect(erro).toBeTruthy();
      
    } catch (error) {
      await captureScreenshot(page, 'login-erro-credenciais');
      throw error;
    }
  });
});
