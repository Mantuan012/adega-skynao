import React, { useEffect, useState } from "react";
// Corrigido: Importar 'auth' também
import { db, auth } from "../firebase/firebaseConfig"; 
import { doc, getDoc, setDoc } from "firebase/firestore";

// Renomeado para seguir a convenção de nomes de componentes
export default function UserInfo({ fechar }) { 
  // Usa o 'usuario' do auth diretamente, como no seu código original
  const usuario = auth.currentUser; 

  // Estados individuais em vez de um objeto 'dados'
  const [nome, setNome] = useState("");
  const [rua, setRua] = useState(""); 
  const [numero, setNumero] = useState(""); 
  const [bairro, setBairro] = useState(""); 
  const [referencia, setReferencia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [editando, setEditando] = useState(false); // Adicionado modo de edição
  const [carregando, setCarregando] = useState(true); // Adicionado estado de carregamento

  // E-mail vem do auth e não muda
  const email = usuario?.email || ""; 

  useEffect(() => {
    const carregarDados = async () => {
      if (usuario) {
        setCarregando(true);
        const ref = doc(db, "usuarios", usuario.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // Preenche os estados individuais
          setNome(data.nome || "");
          setTelefone(data.telefone || "");
          setReferencia(data.referencia || "");

          // Lógica para preencher os novos campos de endereço
          if (data.rua) { 
            setRua(data.rua || "");
            setNumero(data.numero || "");
            setBairro(data.bairro || "");
          } else if (data.endereco) { // Tenta separar o endereço antigo
            const matchNumero = data.endereco.match(/,\s*n?º?\s*(\d+)/i);
            const numeroExtraido = matchNumero ? matchNumero[1] : "";
            const ruaExtraida = matchNumero ? data.endereco.substring(0, matchNumero.index).trim() : data.endereco.trim();
            setRua(ruaExtraida);
            setNumero(numeroExtraido);
            setBairro(""); // Bairro não tem como adivinhar
          } else {
             setRua("");
             setNumero("");
             setBairro("");
          }
          setEditando(false); // Começa em modo visualização
        } else {
          setEditando(true); // Se não tem dados, começa editando
        }
        setCarregando(false);
      }
    };
    carregarDados();
  }, [usuario]); // Depende do usuário

  const salvar = async () => {
    // Validação usando os estados individuais
    if (!nome || !rua || !numero || !bairro || !telefone) { 
      alert("Preencha todos os campos obrigatórios (*).");
      return;
    }
    try {
      // Salva os estados individuais no Firestore
      await setDoc(doc(db, "usuarios", usuario.uid), {
        nome,
        rua,
        numero,
        bairro,
        referencia,
        telefone,
      }, { merge: true }); // Merge é importante para não apagar outros campos

      alert("Informações salvas com sucesso.");
      setEditando(false); // Volta para visualização
      fechar(); // Fecha o modal
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados.");
    }
  };

  if (carregando) {
    return (
      <div className="user-info user-info-container"> {/* Aplica a classe base */}
        <h3>Carregando seus dados...</h3>
      </div>
    );
  }

  return (
    // Usa as novas classes CSS para layout
    <div className="user-info user-info-container"> 
      <h3>Seus Dados</h3>
      {/* Botão fechar agora usa a classe CSS */}
      <button onClick={fechar} className="botao botao-vermelho close-button">
        Fechar
      </button>

      {/* Estrutura de campos atualizada */}
      <div className="user-info-field">
        <label htmlFor="nome">Nome Completo*:</label>
        {editando ? (
          <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
        ) : (
          <p>{nome || "Não informado"}</p>
        )}
      </div>

      {/* Grid para Rua e Número */}
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
        {/* Mostra o e-mail (não editável) */}
        <p>{email}</p> 
      </div>

      {/* Botões Salvar/Editar agora usam a classe CSS */}
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