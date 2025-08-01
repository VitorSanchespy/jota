const puppeteer = require('puppeteer');

// Configurações globais para todos os testes
global.testConfig = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3001',
  timeout: 30000,
  credenciais: {
    admin: { email: 'admin@teste.com', senha: 'admin123' },
    professor: { email: 'maria@teste.com', senha: '123456' },
    aluno: { email: 'joao@teste.com', senha: '123456' }
  }
};

// Função utilitária para aguardar elemento
global.waitForElement = async (page, selector, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.log(`Elemento '${selector}' não encontrado em ${timeout}ms`);
    return false;
  }
};

// Função utilitária para login
global.login = async (page, credentials) => {
  await page.goto(global.testConfig.baseUrl);
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', credentials.email);
  await page.type('input[type="password"]', credentials.senha);
  await page.click('button[type="submit"]');
  
  // Aguardar redirecionamento
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
};

// Função para capturar screenshot em caso de erro
global.captureScreenshot = async (page, name) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    const path = `tests/screenshots/${filename}`;
    
    await page.screenshot({ 
      path, 
      fullPage: true 
    });
    
    console.log(`Screenshot capturado: ${filename}`);
  } catch (error) {
    console.log('Erro ao capturar screenshot:', error.message);
  }
};

// Função utilitária para aguardar elemento
global.waitForElement = async (page, selector, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`Elemento ${selector} não encontrado:`, error.message);
    return false;
  }
};

// Função utilitária para login
global.login = async (page, credentials) => {
  await page.goto(global.testConfig.baseUrl);
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', credentials.email);
  await page.type('input[type="password"]', credentials.senha);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
};

// Função utilitária para logout
global.logout = async (page) => {
  try {
    await page.click('[data-testid="logout-button"]');
    await page.waitForNavigation();
  } catch (error) {
    console.log('Botão de logout não encontrado, tentando alternativas...');
  }
};

// Função para capturar screenshot em caso de erro
global.captureScreenshot = async (page, testName) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${testName}-${timestamp}.png`;
  await page.screenshot({ 
    path: `tests/screenshots/${filename}`,
    fullPage: true 
  });
  console.log(`Screenshot capturado: ${filename}`);
};

beforeAll(async () => {
  // Criar diretório de screenshots se não existir
  const fs = require('fs');
  if (!fs.existsSync('tests/screenshots')) {
    fs.mkdirSync('tests/screenshots', { recursive: true });
  }
});
