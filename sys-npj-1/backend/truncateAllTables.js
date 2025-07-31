const Sequelize = require('sequelize');

const sequelize = new Sequelize('npjdatabase', 'root', '12345678@', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const tables = [
    'agendamentos',
    'arquivos',
    'atualizacoes_processo',
    'configuracoes_notificacao',
    'diligencia',
    'fase',
    'local_tramitacao',
    'materia_assunto',
    'migrations',
    'notificacoes',
    'processos',
    'refresh_tokens',
    'roles',
    'sequelizemeta',
    'usuarios',
    'usuarios_processo'
];

async function truncateAll() {
    try {
        await sequelize.authenticate();
        console.log('Conectado ao banco!');
        for (const table of tables) {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
            await sequelize.query(`TRUNCATE TABLE \`${table}\`;`);
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
            console.log(`Tabela truncada: ${table}`);
        }
        console.log('Todas as tabelas truncadas com sucesso!');
    } catch (error) {
        console.error('Erro ao truncar tabelas:', error.message);
    } finally {
        await sequelize.close();
    }
}

truncateAll();
