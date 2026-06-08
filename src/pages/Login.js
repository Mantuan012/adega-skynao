import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase/firebaseConfig"; 
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth"; 
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa"; 
import './Login.css';

export default function Login({ showToast }) { 
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState(""); 
  const [modoCadastro, setModoCadastro] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleLogin = async () => {
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          nome: user.displayName || "", 
          foto: user.photoURL || "",    
          tipo: "cliente", 
          dataCadastro: new Date().toISOString()
        });
        showToast("Conta criada com Google com sucesso!");
      } else {
        showToast("Login com Google realizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro no pop-up do Google:", error);
      
      if (error.code !== 'auth/popup-closed-by-user') {
        if (error.code === 'auth/internal-error' || error.message.includes('missing initial state')) {
           showToast("Bloqueio da Apple detectado! Tente abrir o site direto no navegador Safari.", 'error');
        } else {
           showToast("Erro ao fazer login com Google.", 'error');
        }
      }
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showToast("Erro: Digite um e-mail válido (ex: seuemail@gmail.com).", 'error');
      return;
    }

    if (modoCadastro && senha !== confirmarSenha) {
      showToast("Erro: As senhas não conferem!", 'error'); 
      return; 
    }

    try {
      if (modoCadastro) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        await setDoc(doc(db, "usuarios", user.uid), {
          email: user.email,
          tipo: "cliente", 
          dataCadastro: new Date().toISOString()
        });

        showToast("Cadastro realizado com sucesso! Faça o login agora."); 
        setModoCadastro(false); 
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') showToast("Erro: Este e-mail já está cadastrado no sistema.", 'error');
      else if (error.code === 'auth/weak-password') showToast("Erro: A senha deve ter pelo menos 6 caracteres.", 'error');
      else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') showToast("Erro: E-mail ou senha incorretos.", 'error');
      else showToast("Erro: " + error.message, 'error'); 
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
        <h2>{modoCadastro ? "Criar Conta" : "Entrar na Adega Skynão"}</h2>
        
        <form onSubmit={handleAuth} noValidate>
          <div className="input-container">
            <FaEnvelope className="input-icon" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-container">
            <FaLock className="input-icon" />
            <input type={showPassword ? "text" : "password"} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {modoCadastro && (
            <div className="input-container">
              <FaLock className="input-icon" />
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirmar Senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
              <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle-icon">
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          )}

          <button type="submit" className="btn-padrao">
            {modoCadastro ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <div className="divisor-login">
          <hr />
          <span>OU</span>
          <hr />
        </div>

        <button type="button" onClick={handleGoogleLogin} className="btn-google">
          <FaGoogle className="btn-google-icon" />
          Continuar com o Google
        </button>

        <p className="link-cadastro" onClick={() => setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tem uma conta? Faça login" : "Não tem conta? Cadastre-se"}
        </p>
      </div>
    </div>
  );
}