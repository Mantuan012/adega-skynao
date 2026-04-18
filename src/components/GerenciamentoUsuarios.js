import React, { useState } from "react";
import { FaSearch, FaUserShield, FaMotorcycle, FaUser, FaUsers } from "react-icons/fa";
import './GerenciamentoUsuarios.css'; 

export default function GerenciamentoUsuarios({ usuarios, alterarCargo, loadingUsuarios }) {
  const [busca, setBusca] = useState("");
  const [mostrarTodosUsuarios, setMostrarTodosUsuarios] = useState(false);

  const usuariosFiltrados = usuarios.filter((u) => {
    const termoBusca = busca.toLowerCase();
    const nome = u.nome ? u.nome.toLowerCase() : "";
    const email = u.email ? u.email.toLowerCase() : "";
    return nome.includes(termoBusca) || email.includes(termoBusca);
  });

  const usuariosExibidos = mostrarTodosUsuarios ? usuariosFiltrados : usuariosFiltrados.slice(0, 5);

  return (
    <div className="gestao-container">
      <h3 className="gestao-header"><FaUsers /> Gestão de Equipe e Usuários</h3>
      <p className="gestao-descricao">Defina quem é administrador ou entregador no sistema.</p>

      <div className="input-busca-container">
        <FaSearch className="input-busca-icone" />
        <input 
          type="text" 
          placeholder="Buscar usuário..." 
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setMostrarTodosUsuarios(e.target.value !== "");
          }}
          className="input-busca"
        />
      </div>

      {loadingUsuarios ? (
        <p className="loading-text">Carregando usuários...</p>
      ) : (
        <div className="tabela-container">
          <table className="tabela-usuarios">
            <thead>
              <tr>
                <th>Nome / Email</th>
                <th>Cargo Atual</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosExibidos.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="td-nome">{u.nome || "S/ Nome"}</span><br/>
                    <span className="td-email">{u.email}</span>
                  </td>
                  <td>
                    {u.tipo === "admin" ? <span className="tag-admin"><FaUserShield/> Admin</span> :
                     u.tipo === "entregador" ? <span className="tag-entregador"><FaMotorcycle/> Entregador</span> :
                     <span className="tag-cliente"><FaUser/> Cliente</span>}
                  </td>
                  <td className="td-acoes">
                    {u.tipo !== "admin" && (
                      <button onClick={() => alterarCargo(u.id, "admin")} className="botao btn-admin">Admin</button>
                    )}
                    {u.tipo !== "entregador" && (
                      <button onClick={() => alterarCargo(u.id, "entregador")} className="botao btn-entregador">Entregador</button>
                    )}
                    {(u.tipo === "entregador" || u.tipo === "admin") && (
                      <button onClick={() => alterarCargo(u.id, "cliente")} className="botao botao-vermelho btn-rebaixar">Remover</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!busca && usuariosFiltrados.length > 5 && (
            <div className="btn-ver-todos-container">
              <button onClick={() => setMostrarTodosUsuarios(!mostrarTodosUsuarios)} className="btn-ver-todos">
                {mostrarTodosUsuarios ? "Ver Menos" : `Ver Todos (${usuariosFiltrados.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}