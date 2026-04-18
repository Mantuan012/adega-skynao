import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebaseConfig"; 
import { doc, getDoc, setDoc } from "firebase/firestore";
import './UserInfo.css';

// --- MUDANÇA 1: Recebendo 'showToast' nas props ---
export default function UserInfo({ fechar, showToast }) { 
  const usuario = auth.currentUser; 

  const [nome, setNome] = useState("");
  const [rua, setRua] = useState(""); 
  const [numero, setNumero] = useState(""); 
  const [bairro, setBairro] = useState(""); 
  const [referencia, setReferencia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const email = usuario?.email || ""; 

  useEffect(() => {
    const carregarDados = async () => {
      if (usuario) {
        setCarregando(true);
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setNome(data.nome || "");
          setTelefone(data.telefone || "");
          setReferencia(data.referencia || "");
          if (data.rua) { 
            setRua(data.rua || "");
            setNumero(data.numero || "");
            setBairro(data.bairro || "");
          } else if (data.endereco) { 
            const matchNumero = data.endereco.match(/,\s*n?º?\s*(\d+)/i);
            const numeroExtraido = matchNumero ? matchNumero[1] : "";
            const ruaExtraida = matchNumero ? data.endereco.substring(0, matchNumero.index).trim() : data.endereco.trim();
            setRua(ruaExtraida);
            setNumero(numeroExtraido);
            setBairro(""); 
          } else {
             setRua("");
             setNumero("");
             setBairro("");
          }
          setEditando(false); 
        } else {
          setEditando(true); 
        }
        setCarregando(false);
      }
    };
    carregarDados();
  }, [usuario]); 

  const salvar = async () => {
    // --- MUDANÇA 2: Substituindo 'alert' por 'showToast' ---
    if (!nome || !rua || !numero || !bairro || !telefone) { 
      showToast("Preencha todos os campos obrigatórios (*).", 'error'); // <-- MUDADO
      return;
    }
    try {
      await setDoc(doc(db, "usuarios", usuario.uid), {
        nome,
        rua,
        numero,
        bairro,
        referencia,
        telefone,
      }, { merge: true }); 

      showToast("Informações salvas com sucesso.", 'success'); // <-- MUDADO
      setEditando(false); 
      fechar(); 
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      showToast("Erro ao salvar dados. Tente novamente.", 'error'); // <-- MUDADO
    }
  };

  if (carregando) {
    return (
      <div className="user-info user-info-container"> 
        <h3>Carregando seus dados...</h3>
      </div>
    );
  }

  return (
    <div className="user-info user-info-container"> 
      <h3>Seus Dados</h3>
      <button onClick={fechar} className="botao botao-vermelho close-button">
        Fechar
      </button>

      {/* (Formulário sem mudanças) */}
      <div className="user-info-field">
        <label htmlFor="nome">Nome Completo*:</label>
        {editando ? (
          <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
        ) : (
          <p>{nome || "Não informado"}</p>
        )}
      </div>

      <div className="address-grid">
        <div className="user-info-field">
          <label htmlFor="rua">Rua*:</label>
          {editando ? (
            <input id="rua" type="text" value={rua} onChange={(e) => setRua(e.target.value)} required />
          ) : (
            <p>{rua || "Não informado"}</p>
          )}
        </div>
        <div className="user-info-field">
          <label htmlFor="numero">Número*:</label>
          {editando ? (
            <input id="numero" type="text" value={numero} onChange={(e) => setNumero(e.target.value)} required />
          ) : (
            <p>{numero || "Não informado"}</p>
          )}
        </div>
      </div>

      <div className="user-info-field">
        <label htmlFor="bairro">Bairro*:</label>
        {editando ? (
          <input id="bairro" type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
        ) : (
          <p>{bairro || "Não informado"}</p>
        )}
      </div>

      <div className="user-info-field">
        <label htmlFor="referencia">Ponto de Referência (opcional):</label>
        {editando ? (
          <input id="referencia" type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        ) : (
          <p>{referencia || "Nenhum"}</p>
        )}
      </div>

      <div className="user-info-field">
        <label htmlFor="telefone">Telefone / WhatsApp*:</label>
        {editando ? (
          <input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        ) : (
          <p>{telefone || "Não informado"}</p>
        )}
      </div>

      <div className="user-info-field">
        <label htmlFor="email">E-mail:</label>
        <p>{email}</p> 
      </div>

      <div className="botoes-acoes"> 
        {editando ? (
          <button onClick={salvar} className="botao">
            Salvar Dados
          </button>
        ) : (
          <button onClick={() => setEditando(true)} className="botao">
            Editar Dados
          </button>
        )}
      </div>
    </div>
  );
}