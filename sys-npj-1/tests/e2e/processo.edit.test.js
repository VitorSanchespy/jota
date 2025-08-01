const puppeteer = require('puppeteer');

describe('Teste de Edição de Processo', () => {
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

  test('Usuário deve conseguir editar um processo existente', async () => {
    try {
      // 1. Fazer login
      await login(page, global.testConfig.credenciais.admin);
      
      // 2. Navegar para processos
      await page.goto(`${global.testConfig.baseUrl}/processos`);
      await page.waitForSelector('.processo-item, tr, [data-testid="processo-lista"]');
      
      // 3. Encontrar primeiro processo na lista
      const primeiroProcesso = await page.$('.processo-item:first-child, tbody tr:first-child');
      if (!primeiroProcesso) {
        // Se não há processos, criar um primeiro
        await page.click('button[data-testid="novo-processo"], button:has-text("Novo")');
        await page.waitForSelector('form');
        
        // Criar processo básico
        await page.type('input[name="numero"]', `${Date.now()}/2025`);
        await page.type('input[name="titulo"]', 'Processo para Editar');
        await page.type('input[name="cliente_nome"]', 'Cliente Teste');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
      }
      
      // 4. Clicar no botão de editar do primeiro processo
      const editarBtn = await page.$('button[data-testid="editar-processo"], .edit-btn, button:has-text("Editar")');
      if (editarBtn) {
        await editarBtn.click();
      } else {
        // Tentar clicar na primeira linha para abrir detalhes
        await page.click('tbody tr:first-child, .processo-item:first-child');
        await page.waitForTimeout(1000);
        
        // Procurar botão de editar na modal ou página de detalhes
        const editarModal = await page.$('button:has-text("Editar"), .btn-edit');
        if (editarModal) {
          await editarModal.click();
        }
      }
      
      // 5. Aguardar formulário de edição
      await page.waitForSelector('form input[name="titulo"], form input[name="numero"]');
      
      // 6. Obter valor atual do título
      const tituloAtual = await page.$eval('input[name="titulo"]', el => el.value);
      
      // 7. Modificar o título
      const novoTitulo = `${tituloAtual} - EDITADO ${Date.now()}`;
      await page.focus('input[name="titulo"]');
      await page.keyboard.selectAll();
      await page.type('input[name="titulo"]', novoTitulo);
      
      // 8. Modificar outros campos se disponíveis
      const descricaoField = await page.$('textarea[name="descricao"]');
      if (descricaoField) {
        await page.focus('textarea[name="descricao"]');
        await page.type('textarea[name="descricao"]', ' - Descrição editada pelo teste');
      }
      
      // 9. Salvar alterações
      const salvarBtn = await page.$('button[type="submit"], button:has-text("Salvar"), button:has-text("Atualizar")');
      if (salvarBtn) {
        await salvarBtn.click();
      }
      
      // 10. Aguardar confirmação
      await page.waitForSelector(
        '.success, .alert-success, [data-testid="success-message"]',
        { timeout: 10000 }
      );
      
      // 11. Verificar se as alterações foram salvas
      await page.waitForTimeout(2000);
      
      // Buscar o processo com o novo título na lista
      const processoEditado = await page.evaluate((titulo) => {
        const elementos = document.querySelectorAll('*');
        return Array.from(elementos).some(el => 
          el.textContent && el.textContent.includes(titulo)
        );
      }, novoTitulo);
      
      expect(processoEditado).toBe(true);
      
    } catch (error) {
      await captureScreenshot(page, 'editar-processo-erro');
      throw error;
    }
  });

  test('Deve validar campos ao editar processo', async () => {
    try {
      // Assumindo que já estamos em uma página de edição
      await page.goto(`${global.testConfig.baseUrl}/processos`);
      
      // Clicar para editar primeiro processo
      const editarBtn = await page.$('button[data-testid="editar-processo"], .edit-btn');
      if (editarBtn) {
        await editarBtn.click();
        await page.waitForSelector('form');
        
        // Limpar campo obrigatório
        await page.focus('input[name="titulo"]');
        await page.keyboard.selectAll();
        await page.keyboard.press('Delete');
        
        // Tentar salvar
        await page.click('button[type="submit"]');
        
        // Verificar se aparece erro
        const erro = await page.$('.error, .invalid-feedback');
        expect(erro).toBeTruthy();
      }
      
    } catch (error) {
      await captureScreenshot(page, 'validacao-edicao-erro');
      throw error;
    }
  });
});
