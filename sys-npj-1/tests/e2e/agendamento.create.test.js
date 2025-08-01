const puppeteer = require('puppeteer');

describe('Teste de Criação de Agendamento', () => {
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

  test('Usuário deve conseguir criar um novo agendamento', async () => {
    try {
      // 1. Fazer login
      await login(page, global.testConfig.credenciais.admin);
      
      // 2. Navegar para agendamentos
      await page.goto(`${global.testConfig.baseUrl}/agendamentos`);
      await page.waitForSelector('[data-testid="agendamentos-page"], .agendamento-container');
      
      // 3. Clicar em novo agendamento
      const novoBtn = await page.$('button[data-testid="novo-agendamento"], button:has-text("Novo Agendamento"), button:has-text("Criar")');
      if (novoBtn) {
        await novoBtn.click();
      } else {
        // Buscar por ícone ou botão de adicionar
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => 
            b.textContent.includes('Novo') || 
            b.textContent.includes('Criar') ||
            b.textContent.includes('+')
          );
          if (btn) btn.click();
        });
      }
      
      // 4. Aguardar formulário aparecer
      await page.waitForSelector('form, .agendamento-form', { timeout: 5000 });
      
      // 5. Preencher dados do agendamento
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 7); // 7 dias no futuro
      
      const dadosAgendamento = {
        titulo: 'Audiência de Teste Automatizada',
        descricao: 'Agendamento criado pelo teste automatizado',
        data_evento: dataFutura.toISOString().split('T')[0], // YYYY-MM-DD
        local: 'Sala 1 - Fórum Central'
      };
      
      // Preencher título
      const tituloField = await page.$('input[name="titulo"], input[id="titulo"]');
      if (tituloField) {
        await page.focus('input[name="titulo"], input[id="titulo"]');
        await page.type('input[name="titulo"], input[id="titulo"]', dadosAgendamento.titulo);
      }
      
      // Preencher descrição
      const descricaoField = await page.$('textarea[name="descricao"], textarea[id="descricao"]');
      if (descricaoField) {
        await page.focus('textarea[name="descricao"], textarea[id="descricao"]');
        await page.type('textarea[name="descricao"], textarea[id="descricao"]', dadosAgendamento.descricao);
      }
      
      // Preencher data
      const dataField = await page.$('input[name="data_evento"], input[type="date"]');
      if (dataField) {
        await page.focus('input[name="data_evento"], input[type="date"]');
        await page.keyboard.selectAll();
        await page.type('input[name="data_evento"], input[type="date"]', dadosAgendamento.data_evento);
      }
      
      // Preencher local
      const localField = await page.$('input[name="local"], input[id="local"]');
      if (localField) {
        await page.focus('input[name="local"], input[id="local"]');
        await page.type('input[name="local"], input[id="local"]', dadosAgendamento.local);
      }
      
      // 6. Selecionar tipo de evento
      const tipoSelect = await page.$('select[name="tipo_evento"]');
      if (tipoSelect) {
        await page.select('select[name="tipo_evento"]', 'audiencia');
      }
      
      // 7. Selecionar processo (se necessário)
      const processoSelect = await page.$('select[name="processo_id"]');
      if (processoSelect) {
        // Selecionar primeiro processo disponível
        const opcoes = await page.$$eval('select[name="processo_id"] option', 
          options => options.map(opt => opt.value).filter(val => val !== '')
        );
        if (opcoes.length > 0) {
          await page.select('select[name="processo_id"]', opcoes[0]);
        }
      }
      
      // 8. Configurar lembretes
      const lembrete1Dia = await page.$('input[name="lembrete_1_dia"], input[type="checkbox"][value="1_dia"]');
      if (lembrete1Dia) {
        const isChecked = await page.$eval('input[name="lembrete_1_dia"]', el => el.checked);
        if (!isChecked) {
          await page.click('input[name="lembrete_1_dia"]');
        }
      }
      
      // 9. Salvar agendamento
      const salvarBtn = await page.$('button[type="submit"], button:has-text("Salvar"), button:has-text("Criar")');
      if (salvarBtn) {
        await salvarBtn.click();
      }
      
      // 10. Aguardar confirmação
      const sucesso = await page.waitForSelector(
        '.success, .alert-success, [data-testid="success-message"]',
        { timeout: 10000 }
      );
      
      expect(sucesso).toBeTruthy();
      
      // 11. Verificar se o agendamento aparece na lista
      await page.waitForTimeout(2000);
      
      const agendamentoNaLista = await page.evaluate((titulo) => {
        const elementos = document.querySelectorAll('*');
        return Array.from(elementos).some(el => 
          el.textContent && el.textContent.includes(titulo)
        );
      }, dadosAgendamento.titulo);
      
      expect(agendamentoNaLista).toBe(true);
      
    } catch (error) {
      await captureScreenshot(page, 'criar-agendamento-erro');
      throw error;
    }
  });

  test('Deve validar data do agendamento', async () => {
    try {
      // Navegar para novo agendamento
      await page.goto(`${global.testConfig.baseUrl}/agendamentos`);
      
      const novoBtn = await page.$('button:has-text("Novo"), button:has-text("Criar")');
      if (novoBtn) {
        await novoBtn.click();
        await page.waitForSelector('form');
        
        // Tentar definir data no passado
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        
        const dataField = await page.$('input[type="date"], input[name="data_evento"]');
        if (dataField) {
          await page.focus('input[type="date"], input[name="data_evento"]');
          await page.type('input[type="date"], input[name="data_evento"]', ontem.toISOString().split('T')[0]);
          
          // Tentar salvar
          await page.click('button[type="submit"]');
          
          // Verificar se aparece erro de validação
          const erro = await page.$('.error, .invalid-feedback, .date-error');
          expect(erro).toBeTruthy();
        }
      }
      
    } catch (error) {
      await captureScreenshot(page, 'validacao-agendamento-erro');
      throw error;
    }
  });

  test('Deve filtrar agendamentos por tipo', async () => {
    try {
      await page.goto(`${global.testConfig.baseUrl}/agendamentos`);
      
      // Aguardar lista carregar
      await page.waitForSelector('.agendamento-item, .agendamento-list, table');
      
      // Buscar filtro de tipo
      const filtroTipo = await page.$('select[name="tipo_evento"], .filtro-tipo select');
      if (filtroTipo) {
        // Selecionar "audiencia"
        await page.select('select[name="tipo_evento"], .filtro-tipo select', 'audiencia');
        
        // Aguardar filtro ser aplicado
        await page.waitForTimeout(2000);
        
        // Verificar se apenas audiências aparecem
        const tipos = await page.$$eval('.agendamento-item, tr', elements => 
          elements.map(el => el.textContent.toLowerCase())
        );
        
        const apenasAudiencias = tipos.every(texto => 
          texto.includes('audiencia') || !texto.includes('prazo') && !texto.includes('reuniao')
        );
        
        expect(apenasAudiencias).toBe(true);
      }
      
    } catch (error) {
      await captureScreenshot(page, 'filtro-agendamento-erro');
      throw error;
    }
  });
});
