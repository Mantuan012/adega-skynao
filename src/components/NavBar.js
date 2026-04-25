import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './NavBar.css';
import { FaSignOutAlt, FaShoppingCart, FaClipboardList, FaChartLine, FaStore } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

// IMPORTANDO O COFRE:
import { useCart } from "../contexts/CartContext";

function NavBar({ isDono, isEntregador, usuario, dadosUsuario }) {
  const [mostrarModalSair, setMostrarModalSair] = useState(false);
  const navigate = useNavigate();
  
  // ACESSANDO O COFRE AQUI:
  const { carrinho } = useCart();
  const totalItensBadge = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const nomeUtilizador = dadosUsuario?.nome || usuario?.displayName || "Usuário";
  const inicial = nomeUtilizador.charAt(0).toUpperCase();
  const fotoPerfil = usuario?.photoURL;

  const confirmarSaida = () => {
    signOut(auth);
    setMostrarModalSair(false);
    navigate('/');
  };

  return (
    <>
      <div className="header-logo">
        <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
        <div>
          <h1>Adega Skynão</h1>
          <p className="slogan">Rapidez e qualidade na sua festa!</p>
        </div>
      </div>

      <div className="top-bar">
        <div className="top-bar-buttons">
          {!isEntregador && (
            <>
              <button onClick={() => navigate('/catalogo')} className="botao">
                <FaStore /> Catálogo
              </button>
              
              <button onClick={() => navigate('/pedidos')} className="botao">
                <FaClipboardList /> Pedidos
              </button>

              <button onClick={() => navigate('/carrinho')} className="botao">
                <FaShoppingCart /> Carrinho
                {totalItensBadge > 0 && (
                  <span className="badge-carrinho">{totalItensBadge}</span>
                )}
              </button>

              {isDono && (
                <button onClick={() => navigate('/dashboard')} className="botao">
                  <FaChartLine /> Dashboard
                </button>
              )}
            </>
          )}
        </div>

        <div className="top-bar-actions">
          <div className="user-chip" onClick={() => navigate('/perfil')}>
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Perfil" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">{inicial}</div>
            )}
            <span className="user-name">Olá, {nomeUtilizador.split(' ')[0]}</span>
          </div>

          <button onClick={() => setMostrarModalSair(true)} className="botao-sair-clean">
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </div>

      {mostrarModalSair && (
        <div className="modal-overlay">
          <div className="modal-sair-conteudo">
            <h3 style={{ color: '#ff6666', margin: '0 0 15px 0' }}>Sair da Adega</h3>
            <p style={{ color: '#e0e0e0', marginBottom: '25px' }}>Deseja realmente desconectar?</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setMostrarModalSair(false)} className="botao" style={{ backgroundColor: '#444' }}>Cancelar</button>
              <button onClick={confirmarSaida} className="botao botao-vermelho">Sim, Sair</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NavBar;