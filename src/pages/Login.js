import React, { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// --- MUDANÇA 1: Login agora recebe 'showToast' como prop ---
export default function Login({ showToast }) { 
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState(""); 
  const [modoCadastro, setModoCadastro] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (modoCadastro && senha !== confirmarSenha) {
      // --- MUDANÇA 2: Usar showToast no lugar de alert ---
      showToast("Erro: As senhas não conferem!", 'error'); 
      return; 
    }

    try {
      if (modoCadastro) {
        await createUserWithEmailAndPassword(auth, email, senha);
        // --- MUDANÇA 3: Usar showToast no lugar de alert ---
        showToast("Cadastro realizado com sucesso! Faça o login agora."); 
        setModoCadastro(false); 
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
        // O showToast de "Login com sucesso" já é disparado pelo App.js no useEffect
      }
    } catch (error) {
      // --- MUDANÇA 4: Usar showToast no lugar de alert ---
      showToast("Erro: " + error.message, 'error'); 
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
        <h2>{modoCadastro ? "Criar Conta" : "Entrar na Adega Skynão"}</h2>
        <form onSubmit={handleAuth}>
          
          <div className="input-container">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-container">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"} 
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              className="password-toggle-icon"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {modoCadastro && (
            <div className="input-container">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirmar Senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
              <span 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="password-toggle-icon"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          )}

          <button type="submit">
            {modoCadastro ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <p
          style={{ marginTop: '12px', color: '#00cc44', cursor: 'pointer', textAlign: 'center' }}
          onClick={() => setModoCadastro(!modoCadastro)}
        >
          {modoCadastro ? "Já tem uma conta? Faça login" : "Não tem conta? Cadastre-se"}
        </p>
      </div>
    </div>
  );
}