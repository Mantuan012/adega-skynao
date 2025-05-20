import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function UserInfo({ usuario, fechar }) {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [backup, setBackup] = useState(null);

  // 1️⃣ Busca os dados do usuário no Firestore ao montar
  useEffect(() => {
    if (!usuario) return;

    const fetchDados = async () => {
      const ref = doc(db, "usuarios", usuario.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setForm(snap.data());
      }
      setLoading(false);
    };

    fetchDados();
  }, [usuario]);

  // 2️⃣ Atualiza o state do formulário
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // 3️⃣ Entra no modo edição, guardando um backup
  const iniciarEdicao = () => {
    setBackup(form);
    setEditando(true);
  };

  // 4️⃣ Cancela edição e restaura backup
  const cancelarEdicao = () => {
    setForm(backup);
    setEditando(false);
  };

  // 5️⃣ Salva no Firestore e sai do modo edição
  const salvarEdicao = async () => {
    try {
      const ref = doc(db, "usuarios", usuario.uid);
      await setDoc(ref, form, { merge: true });
      setEditando(false);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Não foi possível salvar. Tente novamente.");
    }
  };

  if (loading) return <p>Carregando informações...</p>;

  return (
    <div className="cartao user-info">
      {/* Botão Fechar no topo */}
      <button className="botao botao-vermelho" onClick={fechar}>
        Fechar
      </button>

      <h3>Suas Informações</h3>

      {/* Nome */}
      <label>Nome:</label>
      {editando ? (
        <input
          name="nome"
          value={form.nome}
          onChange={handleChange}
          placeholder="Seu nome"
        />
      ) : (
        <p>{form.nome || "Não informado"}</p>
      )}

      {/* Telefone */}
      <label>Telefone:</label>
      {editando ? (
        <input
          name="telefone"
          value={form.telefone}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
        />
      ) : (
        <p>{form.telefone || "Não informado"}</p>
      )}

      {/* Endereço */}
      <label>Endereço:</label>
      {editando ? (
        <input
          name="endereco"
          value={form.endereco}
          onChange={handleChange}
          placeholder="Seu endereço"
        />
      ) : (
        <p>{form.endereco || "Não informado"}</p>
      )}

      {/* Botões de ação */}
      <div style={{ marginTop: "1rem" }}>
        {!editando ? (
          <button className="botao" onClick={iniciarEdicao}>
            Editar
          </button>
        ) : (
          <>
            <button className="botao" onClick={salvarEdicao}>
              Salvar
            </button>
            <button
              className="botao botao-vermelho"
              onClick={cancelarEdicao}
              style={{ marginLeft: "0.5rem" }}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}