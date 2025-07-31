const bcrypt = require('bcryptjs');
const Sequelize = require('sequelize');

// Usar SQLite para teste (não precisa de servidor)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './teste_npj.db',
    logging: false
});

// Definir modelos simples
const Role = sequelize.define('Role', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(50), allowNull: false, unique: true }
}, { tableName: 'roles', timestamps: false });

const Usuario = sequelize.define('Usuario', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: false },
    email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    senha: { type: Sequelize.STRING(255), allowNull: false },
    role_id: { type: Sequelize.INTEGER, allowNull: false },
    criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
    telefone: { type: Sequelize.STRING(20) }
}, { tableName: 'usuarios', timestamps: false });

const Diligencia = sequelize.define('Diligencia', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: false, unique: true }
}, { tableName: 'diligencia', timestamps: false });

const Fase = sequelize.define('Fase', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: false, unique: true }
}, { tableName: 'fase', timestamps: false });

const MateriaAssunto = sequelize.define('MateriaAssunto', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: false, unique: true }
}, { tableName: 'materia_assunto', timestamps: false });

const LocalTramitacao = sequelize.define('LocalTramitacao', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(255), allowNull: false }
}, { tableName: 'local_tramitacao', timestamps: false });

const Processo = sequelize.define('Processo', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    numero_processo: { type: Sequelize.STRING, allowNull: false },
    descricao: { type: Sequelize.TEXT },
    criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    status: { type: Sequelize.STRING },  
    tipo_processo: { type: Sequelize.STRING },
    idusuario_responsavel: { type: Sequelize.INTEGER },
    data_encerramento: { type: Sequelize.DATE },
    observacoes: { type: Sequelize.TEXT },
    sistema: { type: Sequelize.STRING, defaultValue: 'Físico' }, // STRING no SQLite
    materia_assunto_id: { type: Sequelize.INTEGER },
    fase_id: { type: Sequelize.INTEGER },
    diligencia_id: { type: Sequelize.INTEGER },
    num_processo_sei: { type: Sequelize.STRING },
    assistido: { type: Sequelize.STRING },
    contato_assistido: { type: Sequelize.STRING },
    local_tramitacao_id: { type: Sequelize.INTEGER }
}, { tableName: 'processos', timestamps: false });

const Agendamento = sequelize.define('Agendamento', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    processo_id: { type: Sequelize.INTEGER },
    criado_por: { type: Sequelize.INTEGER, allowNull: false },
    usuario_id: { type: Sequelize.INTEGER, allowNull: false },
    tipo_evento: { type: Sequelize.STRING, allowNull: false }, // STRING no SQLite
    titulo: { type: Sequelize.STRING(200), allowNull: false },
    descricao: { type: Sequelize.TEXT },
    data_evento: { type: Sequelize.DATE, allowNull: false },
    local: { type: Sequelize.STRING(300) },
    status: { type: Sequelize.STRING, defaultValue: 'agendado' } // STRING no SQLite
}, { tableName: 'agendamentos', timestamps: false });

async function popularBancoDeTeste() {
    try {
        console.log('🔍 Conectando ao banco SQLite para teste...');
        await sequelize.authenticate();
        console.log('🚀 Conectado ao banco SQLite com sucesso!\n');

        // Sincronizar modelos (criar tabelas)
        console.log('🔧 Criando tabelas...');
        await sequelize.sync({ force: true }); // force: true recria as tabelas
        console.log('✅ Tabelas criadas!\n');

        // 1. Criar Roles
        console.log('📋 Criando roles...');
        const roles = [
            { nome: 'Aluno' },
            { nome: 'Professor' },
            { nome: 'Admin' }
        ];

        const rolesIds = [];
        for (const role of roles) {
            const item = await Role.create(role);
            rolesIds.push(item.id);
            console.log(`✅ Role criado: ${role.nome}`);
        }

        // 2. Criar Usuários
        console.log('\n👥 Criando usuários...');
        const usuarios = [
            {
                nome: 'Maria Santos',
                email: 'maria@teste.com',
                senha: 'maria123',
                telefone: '(65) 99999-0003',
                role_id: rolesIds[0] // Aluno
            },
            {
                nome: 'João Silva',
                email: 'joao@teste.com',
                senha: 'joao123',
                telefone: '(65) 99999-0002',
                role_id: rolesIds[1] // Professor
            },
            {
                nome: 'Admin Teste',
                email: 'admin@teste.com',
                senha: 'admin123',
                telefone: '(65) 99999-0001',
                role_id: rolesIds[2] // Admin
            }
        ];

        const usuariosIds = [];
        for (const user of usuarios) {
            const senhaHash = await bcrypt.hash(user.senha, 10);
            const item = await Usuario.create({
                ...user,
                senha: senhaHash,
                ativo: true
            });
            usuariosIds.push(item.id);
            console.log(`✅ Usuário criado: ${user.email}`);
        }

        // 3. Criar Diligências
        console.log('\n📝 Criando diligências...');
        const diligencias = [
            { nome: 'Citação' },
            { nome: 'Intimação' },
            { nome: 'Perícia' }
        ];

        const diligenciasIds = [];
        for (const diligencia of diligencias) {
            const item = await Diligencia.create(diligencia);
            diligenciasIds.push(item.id);
            console.log(`✅ Diligência criada: ${diligencia.nome}`);
        }

        // 4. Criar Fases
        console.log('\n⚖️ Criando fases...');
        const fases = [
            { nome: 'Inicial' },
            { nome: 'Instrução' },
            { nome: 'Sentença' }
        ];

        const fasesIds = [];
        for (const fase of fases) {
            const item = await Fase.create(fase);
            fasesIds.push(item.id);
            console.log(`✅ Fase criada: ${fase.nome}`);
        }

        // 5. Criar Matérias/Assuntos
        console.log('\n📚 Criando matérias/assuntos...');
        const materias = [
            { nome: 'Direito Civil' },
            { nome: 'Direito Trabalhista' },
            { nome: 'Direito Penal' }
        ];

        const materiasIds = [];
        for (const materia of materias) {
            const item = await MateriaAssunto.create(materia);
            materiasIds.push(item.id);
            console.log(`✅ Matéria criada: ${materia.nome}`);
        }

        // 6. Criar Locais de Tramitação
        console.log('\n🏛️ Criando locais de tramitação...');
        const locais = [
            { nome: 'Tribunal de Justiça - MT' },
            { nome: 'Vara Cível - Cuiabá' },
            { nome: 'Vara Trabalhista - Várzea Grande' }
        ];

        const locaisIds = [];
        for (const local of locais) {
            const item = await LocalTramitacao.create(local);
            locaisIds.push(item.id);
            console.log(`✅ Local criado: ${local.nome}`);
        }

        // 7. Criar Processos
        console.log('\n📋 Criando processos...');
        const processosIds = [];
        const processos = [
            {
                numero_processo: '0001234-56.2025.8.11.0001',
                descricao: 'Ação de cobrança contra empresa de telefonia',
                status: 'Em andamento',
                tipo_processo: 'Cível',
                idusuario_responsavel: usuariosIds[0],
                sistema: 'PJE',
                materia_assunto_id: materiasIds[0],
                fase_id: fasesIds[0],
                diligencia_id: diligenciasIds[0],
                num_processo_sei: 'SEI-23085.012345/2025-67',
                assistido: 'José da Silva',
                contato_assistido: '(65) 99888-7777',
                local_tramitacao_id: locaisIds[0]
            },
            {
                numero_processo: '0002345-67.2025.5.23.0001',
                descricao: 'Reclamação trabalhista por rescisão indireta',
                status: 'Aguardando audiência',
                tipo_processo: 'Trabalhista',
                idusuario_responsavel: usuariosIds[1],
                sistema: 'PEA',
                materia_assunto_id: materiasIds[1],
                fase_id: fasesIds[1],
                diligencia_id: diligenciasIds[1],
                num_processo_sei: 'SEI-23085.012346/2025-68',
                assistido: 'Maria Oliveira',
                contato_assistido: '(65) 99777-6666',
                local_tramitacao_id: locaisIds[1]
            },
            {
                numero_processo: '0003456-78.2025.8.11.0002',
                descricao: 'Defesa criminal - furto simples',
                status: 'Aguardando sentença',
                tipo_processo: 'Criminal',
                idusuario_responsavel: usuariosIds[2],
                sistema: 'Físico',
                materia_assunto_id: materiasIds[2],
                fase_id: fasesIds[2],
                diligencia_id: diligenciasIds[2],
                num_processo_sei: 'SEI-23085.012347/2025-69',
                assistido: 'Pedro Santos',
                contato_assistido: '(65) 99666-5555',
                local_tramitacao_id: locaisIds[2]
            }
        ];

        for (const processo of processos) {
            const item = await Processo.create(processo);
            processosIds.push(item.id);
            console.log(`✅ Processo criado: ${processo.numero_processo}`);
        }

        // 8. Criar Agendamentos de Teste
        console.log('\n📅 Criando agendamentos de teste...');
        
        const agendamentos = [
            {
                processo_id: processosIds[0],
                criado_por: usuariosIds[0],
                usuario_id: usuariosIds[0],
                tipo_evento: 'audiencia',
                titulo: 'Audiência de Conciliação',
                descricao: 'Audiência para tentativa de acordo',
                data_evento: new Date('2025-02-15 14:00:00'),
                local: 'Sala 1 - Fórum Central',
                status: 'agendado'
            },
            {
                processo_id: processosIds[1],
                criado_por: usuariosIds[0],
                usuario_id: usuariosIds[2],
                tipo_evento: 'reuniao',
                titulo: 'Reunião de Orientação',
                descricao: 'Orientação sobre o processo trabalhista',
                data_evento: new Date('2025-02-10 10:00:00'),
                local: 'NPJ - Sala de Reuniões',
                status: 'agendado'
            },
            {
                processo_id: processosIds[2],
                criado_por: usuariosIds[1],
                usuario_id: usuariosIds[2],
                tipo_evento: 'prazo',
                titulo: 'Prazo para Contestação',
                descricao: 'Vencimento do prazo para apresentar contestação',
                data_evento: new Date('2025-02-20 23:59:00'),
                local: 'Online',
                status: 'agendado'
            },
            {
                processo_id: processosIds[0],
                criado_por: usuariosIds[2],
                usuario_id: usuariosIds[2],
                tipo_evento: 'outro',
                titulo: 'Estudo do Caso',
                descricao: 'Tempo reservado para estudar jurisprudências',
                data_evento: new Date('2025-02-12 16:00:00'),
                local: 'Biblioteca',
                status: 'agendado'
            }
        ];

        for (const agendamento of agendamentos) {
            const item = await Agendamento.create(agendamento);
            console.log(`✅ Agendamento criado: ${agendamento.titulo}`);
        }

        console.log('\n🎉 Banco de dados SQLite populado com sucesso!');
        console.log('📁 Arquivo: teste_npj.db');
        console.log('\n📊 Resumo dos dados criados:');
        console.log('   - 3 Roles');
        console.log('   - 3 Usuários');
        console.log('   - 3 Diligências');
        console.log('   - 3 Fases');
        console.log('   - 3 Matérias/Assuntos');
        console.log('   - 3 Locais de Tramitação');
        console.log('   - 3 Processos');
        console.log('   - 4 Agendamentos');
        
        console.log('\n🔑 Credenciais de acesso:');
        console.log('   Admin: admin@teste.com / admin123');
        console.log('   João: joao@teste.com / joao123');
        console.log('   Maria: maria@teste.com / maria123');

    } catch (error) {
        console.error('❌ Erro ao popular banco SQLite:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await sequelize.close();
    }
}

popularBancoDeTeste();
