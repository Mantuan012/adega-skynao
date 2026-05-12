import React, { useState } from 'react';
import { FaUser, FaUserShield, FaMotorcycle, FaSearch, FaLock } from 'react-icons/fa';
import './TabelaUsuarios.css';

export default function TabelaUsuarios({ usuarios = [], alterarCargo, loadingUsuarios }) {
  const [busca, setBusca] = useState('');
  
  // ESTADO NOVO: Começa mostrando apenas 5 usuários
  const [limiteVisivel, setLimiteVisivel] = useState(5);

  if (loadingUsuarios) {
    return <div className="loading-text">Sincronizando usuários...</div>;
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    const nomeStr = u.nome ? u.nome.toLowerCase() : '';
    const emailStr = u.email ? u.email.toLowerCase() : '';
    return nomeStr.includes(termo) || emailStr.includes(termo);
  });

  const usuariosParaExibir = usuariosFiltrados.slice(0, limiteVisivel);

  return (
    <div className="gerenciamento-usuarios-container">
      
      <div className="busca-wrapper">
        <FaSearch className="icone-busca" />
        <input
          type="text"
          placeholder="Buscar usuário por nome ou e-mail..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setLimiteVisivel(5);
          }}
          className="input-busca-usuarios"
        />
      </div>

      <div className="tabela-usuarios-responsiva">
        <table className="tabela-usuarios">
          <thead>
            <tr>
              <th className="coluna-nome">Usuário</th>
              <th className="coluna-cargo">Cargo Atual</th>
              <th className="coluna-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosParaExibir.map((u) => {
              const tipoUsuario = u.tipo || 'cliente';
              
              return (
                <tr key={u.id}>
                  <td className="coluna-nome">
                    <div className="info-usuario">
                      <strong className="nome-usuario">{u.nome || 'Usuário Sem Nome'}</strong>
                      <span className="email-usuario">{u.email}</span>
                    </div>
                  </td>
                  
                  <td className="coluna-cargo">
                    <span className={`badge-cargo ${tipoUsuario}`}>
                      {tipoUsuario === 'admin' && <FaUserShield />}
                      {tipoUsuario === 'entregador' && <FaMotorcycle />}
                      {tipoUsuario === 'cliente' && <FaUser />}
                      
                      {tipoUsuario === 'admin' ? ' Administrador' : 
                       tipoUsuario === 'entregador' ? ' Entregador' : ' Cliente'}
                    </span>
                  </td>
                  
                  <td className="coluna-acoes">
                    <div className="acoes-wrapper">
                      {tipoUsuario === 'admin' ? (
                        <div className="admin-lock">
                          <FaLock size={12} /> Restrito
                        </div>
                      ) : tipoUsuario === 'entregador' ? (
                        <button 
                          className="btn-tabela btn-vermelho"
                          onClick={() => alterarCargo(u.id, 'cliente')}
                        >
                          Remover Acesso
                        </button>
                      ) : (
                        <button 
                          className="btn-tabela btn-verde"
                          onClick={() => alterarCargo(u.id, 'entregador')}
                        >
                          Tornar Entregador
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {usuariosFiltrados.length === 0 && (
          <div className="mensagem-vazia">Nenhum usuário encontrado na busca.</div>
        )}
      </div>

      {usuariosFiltrados.length > 5 && (
        <div className="paginacao-usuarios">
          {limiteVisivel < usuariosFiltrados.length && (
            <button 
              onClick={() => setLimiteVisivel(prev => prev + 5)} 
              className="btn-paginacao btn-ver-mais"
            >
              Ver Mais (+5)
            </button>
          )}
          
          {limiteVisivel > 5 && (
            <button 
              onClick={() => setLimiteVisivel(5)} 
              className="btn-paginacao btn-ver-menos"
            >
              Ver Menos
            </button>
          )}
        </div>
      )}

    </div>
  );
}