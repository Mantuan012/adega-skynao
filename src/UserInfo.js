import React, { useEffect, useState } from "react";
import { db, auth } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function UserInfo({ fechar }) {
  const usuario = auth.currentUser;
  const [dados, setDados] = useState({
    nome: "",
    endereco: "",
    referencia: "",
    telefone: "",
    email: usuario?.email || "",
  });

  useEffect(() => {
    const carregarDados = async () => {
      const ref = doc(db, "usuarios", usuario.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDados(snap.data());
      }
    };
    if (usuario) carregarDados();
  }, [usuario]);

  const salvar = async () => {
    if (!dados.nome || !dados.endereco || !dados.telefone) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await setDoc(doc(db, "usuarios", usuario.uid), dados);
      alert("Informações salvas com sucesso.");
      fechar();
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados.");
    }
  };

  return (
    <div className="user-info">
      <button onClick={fechar} className="botao botao-vermelho">
        ✖️ Fechar
      </button>
      <h3>Seus Dados</h3>

      <label>
        Nome Completo*:
        <input
          value={dados.nome}
          onChange={(e) => setDados({ ...dados, nome: e.target.value })}
        />
      </label>

      <label>
        Endereço Completo*:
        <input
          value={dados.endereco}
          onChange={(e) => setDados({ ...dados, endereco: e.target.value })}
        />
      </label>

      <label>
        Ponto de Referência (opcional):
        <input
          value={dados.referencia}
          onChange={(e) => setDados({ ...dados, referencia: e.target.value })}
        />
      </label>

      <label>
        Telefone / WhatsApp*:
        <input
          value={dados.telefone}
          onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
        />
      </label>

      <label>
        E-mail:
        <p>{dados.email}</p>
      </label>

      <div className="botoes-acoes">
        <button onClick={salvar} className="botao">
          💾 Salvar Dados
        </button>
      </div>
    </div>
  );
}