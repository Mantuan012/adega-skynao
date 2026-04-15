import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaShieldAlt, FaUserCircle } from 'react-icons/fa';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig'; 

const PerfilEntregador = ({ showToast, dadosUsuario }) => {
  const [pedidoAtual, setPedidoAtual] = useState(null);
  const [codigoValidacao, setCodigoValidacao] = useState('');

  useEffect(() => {
    const q = query(collection(db, "pedidos"), where("status", "==", "Saiu para Entrega"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        setPedidoAtual({
          docId: docData.id, 
          ...docData.data()
        });
      } else {
        setPedidoAtual(null); 
      }
    });

    return () => unsubscribe();
  }, []);

  const handleValidarEntrega = async () => {
    // BLINDAGEM DE ERRO: Força a conversão de ambos para String e remove espaços vazios.
    // Assim, se o banco trouxer um número (3442) e o input for texto ("3442"), eles vão ser iguais.
    const codigoCorreto = pedidoAtual.codigoSeguranca ? String(pedidoAtual.codigoSeguranca).trim() : "1234";
    const codigoDigitado = String(codigoValidacao).trim();

    if (codigoDigitado === codigoCorreto) {
      try {
        await updateDoc(doc(db, "pedidos", pedidoAtual.docId), {
          status: "Entregue"
        });
        showToast('✅ Sucesso: Pedido finalizado e entregue!', 'success');
        setCodigoValidacao('');
      } catch (error) {
        showToast('❌ Erro de conexão com o banco de dados.', 'error');
      }
    } else {
      showToast('❌ Erro: Código de segurança inválido.', 'error');
    }
  };

  const handleReportarProblema = async () => {
    try {
      await updateDoc(doc(db, "pedidos", pedidoAtual.docId), {
        status: "Com Problema"
      });
      showToast('⚠️ Problema reportado! O status do pedido foi atualizado.', 'error');
    } catch (error) {
      showToast('❌ Erro ao reportar problema no sistema.', 'error');
    }
  };

  return (
    <div className="cartao cartao-entregador-container">
      <div className="perfil-header">
        <div className="foto-perfil-wrapper">
          {dadosUsuario?.foto ? (
            <img src={dadosUsuario.foto} alt="Perfil Entregador" className="foto-entregador" />
          ) : (
            <FaUserCircle size={80} color="#00ff66" />
          )}
        </div>
        
        <h2 className="titulo-principal" style={{marginTop: '10px'}}>Área do Entregador</h2>
        <p className="nome-entregador">{dadosUsuario?.nome || 'Entregador'}</p>
        <div className="badge-rating">
          <FaStar color="#000" /> <span>Rating: {dadosUsuario?.rating || '0.0'}</span>
        </div>
      </div>

      {pedidoAtual ? (
        <div className="detalhes-entrega-box">
          <h3 className="subtitulo-entrega">Entrega Atual</h3>
          <p><strong>ID do Pedido:</strong> #{pedidoAtual.idPedido}</p>
          <p className="status-destaque"><strong>Status:</strong> {pedidoAtual.status}</p>
          
          <div className="endereco-box">
            <FaMapMarkerAlt color="#ff3333" size={24} style={{flexShrink: 0}} />
            <span>
              {pedidoAtual.enderecoEntrega?.rua}, {pedidoAtual.enderecoEntrega?.numero} - {pedidoAtual.enderecoEntrega?.bairro}
            </span>
          </div>

          <div className="validacao-seguranca-box">
            <FaShieldAlt size={24} color="#00ff66" style={{ marginBottom: '10px' }} />
            <p><strong>CÓDIGO DE SEGURANÇA</strong></p>
            <p className="dica-codigo">Solicite ao cliente na entrega.</p>
            <input 
              type="text" 
              className="input-otp"
              maxLength="4" 
              placeholder="0000"
              value={codigoValidacao}
              onChange={(e) => setCodigoValidacao(e.target.value.replace(/\D/g, ''))} 
            />
          </div>

          <div className="botoes-acao-entregador">
            <button className="botao botao-sucesso" onClick={handleValidarEntrega}>
              Confirmar Entrega
            </button>
            <button className="botao botao-vermelho" onClick={handleReportarProblema}>
              Reportar Problema
            </button>
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '1.2rem' }}>
          Nenhuma entrega pendente no momento. 🚀
        </p>
      )}
    </div>
  );
};

export default PerfilEntregador;