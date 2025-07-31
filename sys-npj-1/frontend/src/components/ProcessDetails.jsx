import { useEffect, useState } from 'react';

export default function ProcessDetails({ processoId }) {
    const [pagina, setPagina] = useState(1);
    const [usuarios, setUsuarios] = useState([]);
    const [arquivos, setArquivos] = useState([]);
    const [novoArquivoId, setNovoArquivoId] = useState('');

    useEffect(() => {
        const fetchUsuarios = async () => {
            const response = await fetch(`/api/processos/${processoId}/usuarios?pagina=${pagina}&porPagina=10`);
            const data = await response.json();
            setUsuarios(data);
        };
        fetchUsuarios();
    }, [pagina, processoId]);

    useEffect(() => {
        const fetchArquivos = async () => {
            try {
                const response = await fetch(`/api/arquivos/processo/${processoId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setArquivos(data);
                } else {
                    console.error('Erro ao buscar arquivos:', response.statusText);
                }
            } catch (error) {
                console.error('Erro ao buscar arquivos:', error);
            }
        };
        fetchArquivos();
    }, [processoId]);

    const handleVincularUsuario = (e) => {
        e.preventDefault();
        // Lógica para vincular usuário
    };

    const handleVincularArquivo = async () => {
        try {
            const response = await fetch(`/api/arquivos/anexar`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ processo_id: processoId, arquivo_id: novoArquivoId })
            });
            if (response.ok) {
                alert('Arquivo vinculado com sucesso!');
                setNovoArquivoId('');
                // Recarregar a lista de arquivos
                const fetchArquivos = async () => {
                    const arquivosResponse = await fetch(`/api/arquivos/processo/${processoId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (arquivosResponse.ok) {
                        const data = await arquivosResponse.json();
                        setArquivos(data);
                    }
                };
                fetchArquivos();
            } else {
                alert('Erro ao vincular arquivo.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao vincular arquivo.');
        }
    };

    const handleDesvincularArquivo = async (arquivoId) => {
        try {
            const response = await fetch(`/api/arquivos/desvincular/${arquivoId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                alert('Arquivo desvinculado com sucesso!');
                setArquivos(arquivos.filter(arquivo => arquivo.id !== arquivoId));
            } else {
                alert('Erro ao desvincular arquivo.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao desvincular arquivo.');
        }
    };

    return (
        <div>
            <form onSubmit={handleVincularUsuario}>
                <label htmlFor="usuarioId">ID do Usuário:</label>
                <input type="text" id="usuarioId" name="usuarioId" placeholder="Digite o ID do usuário" required />

                <label htmlFor="role">Role:</label>
                <select id="role" name="role" required>
                    <option value="Aluno">Aluno</option>
                    <option value="Professor">Professor</option>
                </select>

                <button type="submit">Vincular Usuário</button>
            </form>

            <h2>Usuários Vinculados</h2>
            {usuarios.map(usuario => (
                <p key={usuario.nome}>{usuario.role}: {usuario.nome}</p>
            ))}

            {/* Botões de navegação */}
            <div>
                <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1}>Anterior</button>
                <button onClick={() => setPagina(pagina + 1)}>Próximo</button>
            </div>

            <h2>Arquivos Anexados</h2>
            {arquivos.length > 0 ? (
                <ul>
                    {arquivos.map(arquivo => (
                        <li key={arquivo.id}>
                            {arquivo.nome}
                            <button onClick={() => handleDesvincularArquivo(arquivo.id)}>Desvincular</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Nenhum arquivo anexado.</p>
            )}

            <h3>Vincular Novo Arquivo</h3>
            <input
                type="text"
                value={novoArquivoId}
                onChange={(e) => setNovoArquivoId(e.target.value)}
                placeholder="ID do arquivo"
            />
            <button onClick={handleVincularArquivo}>Vincular Arquivo</button>
        </div>
    );
}