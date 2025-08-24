const upload = require('../middleware/uploadMiddleware');
const { arquivoModels: Arquivo, processoModels: Processo, usuariosModels: Usuario } = require('../models/indexModels');

// uploadArquivo é responsável por receber o arquivo enviado pelo usuário
exports.uploadArquivo = [
  upload.single('arquivo'), // 'arquivo' é o nome do campo no form
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      }

      // Garante que o caminho salvo seja sempre relativo à pasta uploads
      let caminhoRelativo = req.file.path.replace(/\\/g, '/');
      const idx = caminhoRelativo.indexOf('uploads/');
      if (idx !== -1) caminhoRelativo = caminhoRelativo.substring(idx);
      const metadados = {
        nome: req.file.originalname,
        caminho: caminhoRelativo,
        tamanho: req.file.size,
        tipo: req.file.mimetype,
        processo_id: req.body.processo_id && req.body.processo_id !== 'undefined' ? req.body.processo_id : null,
        usuario_id: req.usuario.id // Usuário autenticado
      };

      const arquivo = await Arquivo.create(metadados);
      res.status(201).json(arquivo);

    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  }
];

// Soft delete de arquivo
exports.softDeleteArquivo = async (req, res) => {
  try {
    const { id } = req.params;
    const arquivo = await Arquivo.findByPk(id);
    if (!arquivo) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    arquivo.ativo = false;
    await arquivo.save();
    res.json({ mensagem: 'Arquivo deletado (soft delete) com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
// Listar arquivos de um processo específico
exports.listarArquivos = async (req, res) => {
  try {
    const { processo_id } = req.params;
    const arquivos = await Arquivo.findAll({
      where: { processo_id, ativo: true },
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario' }
      ]
    });
    res.json(arquivos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Listar arquivos enviados por um usuário
exports.listarArquivosUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const arquivos = await Arquivo.findAll({
      where: { usuario_id, ativo: true },
      include: [
        { model: Processo, as: 'processo' },
        { model: Usuario, as: 'usuario' }
      ]
    });
    res.json(arquivos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Anexar arquivo já enviado a um processo
exports.anexarArquivoExistente = async (req, res) => {
  try {
    let { processo_id, arquivo_id } = req.body;
    
    // Converter para números se necessário
    processo_id = parseInt(processo_id);
    arquivo_id = parseInt(arquivo_id);
    
    if (!processo_id || !arquivo_id || isNaN(processo_id) || isNaN(arquivo_id)) {
      return res.status(400).json({ erro: 'processo_id e arquivo_id são obrigatórios e devem ser números válidos' });
    }
    
    // Atualiza o processo_id do arquivo existente
    const resultado = await Arquivo.anexarAProcesso(arquivo_id, processo_id);
    
    res.json({ mensagem: 'Arquivo anexado ao processo com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

// Desvincular arquivo de um processo
exports.desvincularArquivo = async (req, res) => {
  try {
    const { id } = req.params;
    const arquivo = await Arquivo.findByPk(id);

    if (!arquivo) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }

    // Remove o vínculo do arquivo com o processo
    arquivo.processo_id = null;
    await arquivo.save();

    res.json({ mensagem: 'Arquivo desvinculado do processo com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};