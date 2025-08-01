import React, { useState } from 'react';
import { userService } from '../api/services';
import { useAuthContext } from '../contexts/AuthContext';

// Adicionar campo de pesquisa e exibir resultados
const AssignUser = () => {
  const { token } = useAuthContext();
  const [nome, setNome] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  const buscarUsuarios = async () => {
    try {
      const data = await userService.getAllUsers(token, nome);
      setUsuarios(data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setUsuarios([]);
    }
  };

  return (
      <div>
          <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome para buscar"
          />
          <button onClick={buscarUsuarios}>Buscar</button>

          <ul>
              {usuarios.map(usuario => (
                  <li key={usuario.id}>{usuario.role}: {usuario.nome}</li>
              ))}
          </ul>
      </div>
  );
};

export default AssignUser;