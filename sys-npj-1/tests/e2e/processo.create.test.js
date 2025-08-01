const puppeteer = require('puppeteer');

describe('Teste de Criação de Processo', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Para visualizar o teste
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

  test('Usuário admin deve conseguir criar um novo processo', async () => {
    try {
      // 1. Fazer login como admin
      await login(page, global.testConfig.credenciais.admin);
      
      // 2. Aguardar carregar o dashboard
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
      
      // 3. Navegar para a página de processos
      const processosLink = await page.$('[href="/processos"]');
      if (processosLink) {
        await processosLink.click();
      } else {
        // Tentar pelo menu ou botão de processos
        await page.click('a[href*="processo"], button[data-testid="processos-menu"]');
      }
      
      await page.waitForNavigation();
      
      // 4. Clicar no botão "Novo Processo"
      const novoProcessoBtn = await page.$('button[data-testid="novo-processo"], button:has-text("Novo Processo")');
      if (novoProcessoBtn) {
        await novoProcessoBtn.click();
      } else {
        // Buscar por texto alternativo
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent.includes('Novo') || b.textContent.includes('Criar'));
          if (btn) btn.click();
        });
      }
      
      // 5. Aguardar o formulário aparecer
      await page.waitForSelector('form', { timeout: 5000 });
      
      // 6. Preencher dados do processo
      const dadosProcesso = {
        numero: `${Date.now()}/2025`, // Número único
        titulo: 'Processo de Teste Automatizado',
        descricao: 'Este é um processo criado automaticamente pelo teste',
        cliente_nome: 'Cliente Teste',
        cliente_email: 'cliente@teste.com',
        cliente_telefone: '(11) 99999-9999'
      };
      
      // Preencher campos do formulário
      for (const [campo, valor] of Object.entries(dadosProcesso)) {
        const seletor = `input[name="${campo}"], input[id="${campo}"], textarea[name="${campo}"]`;
        const elemento = await page.$(seletor);
        if (elemento) {
          await page.focus(seletor);
          await page.keyboard.selectAll();
          await page.type(seletor, valor);
        }
      }
      
      // 7. Selecionar matéria/assunto se existir
      const materiaSelect = await page.$('select[name="materia_assunto_id"]');
      if (materiaSelect) {
        await page.select('select[name="materia_assunto_id"]', '1'); // Primeira opção
      }
      
      // 8. Salvar o processo
      const salvarBtn = await page.$('button[type="submit"], button:has-text("Salvar")');
      if (salvarBtn) {
        await salvarBtn.click();
      }
      
      // 9. Aguardar confirmação de sucesso
      const sucessoMsg = await page.waitForSelector(
        '.success, .alert-success, [data-testid="success-message"]',
        { timeout: 10000 }
      );
      
      expect(sucessoMsg).toBeTruthy();
      
      // 10. Verificar se o processo aparece na lista
      await page.waitForSelector('.processo-item, tr, [data-testid="processo-lista"]');
      
      const processoNaLista = await page.evaluate((numero) => {
        const elementos = document.querySelectorAll('*');
        return Array.from(elementos).some(el => 
          el.textContent && el.textContent.includes(numero)
        );
      }, dadosProcesso.numero);
      
      expect(processoNaLista).toBe(true);
      
    } catch (error) {
      await captureScreenshot(page, 'criar-processo-erro');
      throw error;
    }
  });

  test('Validação de campos obrigatórios na criação de processo', async () => {
    try {
      // Navegar para criar novo processo
      await page.goto(`${global.testConfig.baseUrl}/processos/novo`);
      
      // Tentar salvar sem preencher campos obrigatórios
      const salvarBtn = await page.$('button[type="submit"]');
      if (salvarBtn) {
        await salvarBtn.click();
      }
      
      // Verificar se aparecem mensagens de erro
      const erros = await page.$$('.error, .invalid-feedback, .field-error');
      expect(erros.length).toBeGreaterThan(0);
      
    } catch (error) {
      await captureScreenshot(page, 'validacao-processo-erro');
      throw error;
    }
  });
});
