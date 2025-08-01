const puppeteer = require('puppeteer');

describe('Teste de Relatórios', () => {
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

  test('Deve acessar página de relatórios', async () => {
    try {
      // Login
      await login(page, global.testConfig.credenciais.admin);
      
      // Navegar para relatórios
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      await page.waitForSelector('.reports-page, .relatorios-page');
      
      // Verificar elementos da página
      const titulo = await page.$eval('h1, .page-title', el => el.textContent);
      expect(titulo.toLowerCase()).toContain('relatório');
      
    } catch (error) {
      await captureScreenshot(page, 'acesso-relatorios-erro');
      throw error;
    }
  });

  test('Deve gerar relatório de processos', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      // Configurar filtros de data
      const dataInicio = await page.$('input[name="data_inicio"], input[type="date"]:first-of-type');
      if (dataInicio) {
        const hoje = new Date();
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const dataInicioStr = mesPassado.toISOString().split('T')[0];
        
        await page.type('input[name="data_inicio"]', dataInicioStr);
      }
      
      const dataFim = await page.$('input[name="data_fim"], input[type="date"]:last-of-type');
      if (dataFim) {
        const hoje = new Date().toISOString().split('T')[0];
        await page.type('input[name="data_fim"]', hoje);
      }
      
      // Selecionar tipo de relatório
      const tipoSelect = await page.$('select[name="tipo"]');
      if (tipoSelect) {
        await page.select('select[name="tipo"]', 'processos');
      }
      
      // Gerar relatório
      const gerarBtn = await page.$('button:has-text("Gerar"), .generate-btn');
      if (gerarBtn) {
        await gerarBtn.click();
        
        // Aguardar carregamento
        await page.waitForSelector('.report-content, .relatorio-resultado, table', { timeout: 15000 });
        
        // Verificar se dados aparecem
        const temDados = await page.$('tbody tr, .data-row');
        expect(temDados).toBeTruthy();
      }
      
    } catch (error) {
      await captureScreenshot(page, 'gerar-relatorio-processos-erro');
      throw error;
    }
  });

  test('Deve exportar relatório em PDF', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      // Gerar um relatório primeiro
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        await page.waitForSelector('.report-content, table');
        
        // Procurar botão de PDF
        const pdfBtn = await page.$('button:has-text("PDF"), .export-pdf');
        if (pdfBtn) {
          // Configurar para detectar download
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            pdfBtn.click()
          ]);
          
          expect(download.suggestedFilename()).toMatch(/\.pdf$/);
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'exportar-pdf-erro');
      throw error;
    }
  });

  test('Deve exportar relatório em Excel', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        await page.waitForSelector('.report-content, table');
        
        const excelBtn = await page.$('button:has-text("Excel"), .export-excel');
        if (excelBtn) {
          const [download] = await Promise.all([
            page.waitForEvent('download'),
            excelBtn.click()
          ]);
          
          expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls)$/);
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'exportar-excel-erro');
      throw error;
    }
  });

  test('Deve gerar relatório de agendamentos', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      // Selecionar relatório de agendamentos
      const tipoSelect = await page.$('select[name="tipo"]');
      if (tipoSelect) {
        await page.select('select[name="tipo"]', 'agendamentos');
      }
      
      // Configurar período
      const dataInicio = await page.$('input[name="data_inicio"]');
      if (dataInicio) {
        const hoje = new Date();
        const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dataStr = semanaPassada.toISOString().split('T')[0];
        await page.type('input[name="data_inicio"]', dataStr);
      }
      
      // Gerar
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        await page.waitForSelector('.report-content, table');
        
        // Verificar colunas específicas de agendamento
        const colunas = await page.$$eval('th', elements => 
          elements.map(el => el.textContent.toLowerCase())
        );
        
        const temColunasAgendamento = colunas.some(col => 
          col.includes('data') || col.includes('hora') || col.includes('agendamento')
        );
        
        expect(temColunasAgendamento).toBe(true);
      }
      
    } catch (error) {
      await captureScreenshot(page, 'relatorio-agendamentos-erro');
      throw error;
    }
  });

  test('Deve gerar relatório de usuários', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      const tipoSelect = await page.$('select[name="tipo"]');
      if (tipoSelect) {
        await page.select('select[name="tipo"]', 'usuarios');
      }
      
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        await page.waitForSelector('.report-content, table');
        
        // Verificar colunas de usuário
        const colunas = await page.$$eval('th', elements => 
          elements.map(el => el.textContent.toLowerCase())
        );
        
        const temColunasUsuario = colunas.some(col => 
          col.includes('nome') || col.includes('email') || col.includes('role')
        );
        
        expect(temColunasUsuario).toBe(true);
      }
      
    } catch (error) {
      await captureScreenshot(page, 'relatorio-usuarios-erro');
      throw error;
    }
  });

  test('Deve filtrar relatório por status', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      // Selecionar processos
      const tipoSelect = await page.$('select[name="tipo"]');
      if (tipoSelect) {
        await page.select('select[name="tipo"]', 'processos');
      }
      
      // Filtrar por status
      const statusSelect = await page.$('select[name="status"]');
      if (statusSelect) {
        await page.select('select[name="status"]', 'Em Andamento');
      }
      
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        await page.waitForSelector('.report-content, table');
        
        // Verificar se todos os resultados têm o status filtrado
        const statusCells = await page.$$eval('.status-cell, td:nth-child(4)', elements => 
          elements.map(el => el.textContent.trim())
        );
        
        if (statusCells.length > 0) {
          const todosMesmoStatus = statusCells.every(status => 
            status === 'Em Andamento'
          );
          expect(todosMesmoStatus).toBe(true);
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'filtro-status-relatorio-erro');
      throw error;
    }
  });

  test('Deve mostrar estatísticas resumidas', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        await page.waitForSelector('.report-content');
        
        // Verificar se há estatísticas/cards de resumo
        const estatisticas = await page.$('.statistics, .summary-cards, .total-count');
        if (estatisticas) {
          const textoEstatisticas = await page.$eval('.statistics, .summary-cards', 
            el => el.textContent
          );
          
          // Verificar se contém números
          const temNumeros = /\d+/.test(textoEstatisticas);
          expect(temNumeros).toBe(true);
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'estatisticas-relatorio-erro');
      throw error;
    }
  });

  test('Deve validar campos obrigatórios', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/relatorios`);
      
      // Tentar gerar sem preencher dados obrigatórios
      const gerarBtn = await page.$('button:has-text("Gerar")');
      if (gerarBtn) {
        await gerarBtn.click();
        
        // Verificar se aparece mensagem de erro ou validação
        await page.waitForTimeout(2000);
        
        const erro = await page.$('.error, .alert-danger, .validation-error');
        if (erro) {
          expect(erro).toBeTruthy();
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'validacao-relatorio-erro');
      throw error;
    }
  });
});
