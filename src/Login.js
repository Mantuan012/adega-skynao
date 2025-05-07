import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (modoCadastro) {
        await createUserWithEmailAndPassword(auth, email, senha);
        alert("Cadastro realizado com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, email, senha);
        alert("Login realizado com sucesso!");
      }
    } catch (error) {
      alert("Erro: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{modoCadastro ? "Criar Conta" : "Entrar na Adega Skynão"}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
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