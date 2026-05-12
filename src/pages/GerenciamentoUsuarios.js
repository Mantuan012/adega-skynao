import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { FaSpinner, FaBan } from "react-icons/fa";

// Agora importamos direto com o nome verdadeiro do arquivo!
import TabelaUsuarios from "../components/TabelaUsuarios";

export default function GerenciamentoUsuarios() {
  const usuario = auth.currentUser;

  const [isDono, setIsDono] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) return setIsDono(false);

      const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
      if (userDoc.exists() && userDoc.data().tipo === "admin") {
        setIsDono(true);
        const snapshotU = await getDocs(collection(db, "usuarios"));
        setUsuarios(snapshotU.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingUsuarios(false);
      } else {
        setIsDono(false);
      }
    };
    carregarDados();
  }, [usuario]);

  const alterarCargo = async (usuarioId, novoTipo) => {
    await updateDoc(doc(db, "usuarios", usuarioId), { tipo: novoTipo });
    setUsuarios(usuarios.map(u => u.id === usuarioId ? { ...u, tipo: novoTipo } : u));
  };

  if (isDono === null) return <div className="cartao" style={{textAlign: 'center', color: '#00ff66'}}><FaSpinner /> Carregando...</div>;
  if (isDono === false) return <div className="cartao" style={{textAlign: 'center', color: '#ff4444'}}><FaBan /> Acesso Negado</div>;

  return (
    <div className="cartao">
      <h2 className="dash-title" style={{ color: '#00ff66', marginBottom: '25px', textAlign: 'center' }}>Gestão de Equipe e Usuários</h2>
      
      <TabelaUsuarios usuarios={usuarios} alterarCargo={alterarCargo} loadingUsuarios={loadingUsuarios} />
    </div>
  );
}