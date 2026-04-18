import React from "react";
import './NavBar.css';
import { FaUserCircle } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

function NavBar({ 
  isDono, 
  isEntregador, 
  totalItensBadge, 
  onNavigate, // Objeto com as funções de navegação
  onProfileClick 
}) {
  return (
    <>
      {/* 1. LOGOTIPO E SLOGAN */}
      <div className="header-logo">
        <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
        <div>
          <h1>Adega Skynão</h1>
          <p className="slogan">Rapidez e qualidade na sua festa!</p>
        </div>
      </div>

      {/* 2. BARRA DE NAVEGAÇÃO */}
      <div className="top-bar">
        <div className="top-bar-buttons">
          {!isEntregador && (
            <>
              {isDono && (
                <button onClick={onNavigate.dashboard} className="botao">
                  Dashboard
                </button>
              )}
              <button onClick={onNavigate.pedidos} className="botao">
                Menu de Pedidos
              </button>
              <button onClick={onNavigate.catalogo} className="botao">
                Catálogo
              </button>
              <button onClick={onNavigate.carrinho} className="botao">
                Carrinho
                {totalItensBadge > 0 && (
                  <span className="badge-carrinho">{totalItensBadge}</span>
                )}
              </button>
            </>
          )}
        </div>

        <div className="top-bar-actions">
          <button onClick={() => signOut(auth)} className="botao botao-vermelho">
            Sair
          </button>
          <div onClick={onProfileClick} className="icon-perfil">
            <FaUserCircle />
          </div>
        </div>
      </div>
    </>
  );
}

export default NavBar;