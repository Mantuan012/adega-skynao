import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaShieldAlt, FaUserCircle, FaRoute } from 'react-icons/fa';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import './PerfilEntregador.css';

const PerfilEntregador = ({ showToast, dadosUsuario }) => {
  const [pedidoAtual, setPedidoAtual] = useState(null);
  const [codigoValidacao, setCodigoValidacao] = useState('');

  useEffect(() => {
    const q = query(collection(db, "pedidos"), where("status", "==", "Saiu para Entrega"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const listaPendentes = [];
        querySnapshot.forEach((docData) => {
          listaPendentes.push({
            docId: docData.id, 
            ...docData.data()
          });
        });

        listaPendentes.sort((a, b) => new Date(a.data) - new Date(b.data));
        setPedidoAtual(listaPendentes[0]);
      } else {
        setPedidoAtual(null); 
      }
    });

    return () => unsubscribe();
  }, []);

  const handleValidarEntrega = async () => {
    const codigoCorreto = pedidoAtual.codigoSeguranca ? String(pedidoAtual.codigoSeguranca).trim() : "1234";
    const codigoDigitado = String(codigoValidacao).trim();

    if (codigoDigitado === codigoCorreto) {
      try {
        await updateDoc(doc(db, "pedidos", pedidoAtual.docId), {
          status: "Entregue"
        });
        showToast('Sucesso: Pedido finalizado e entregue!', 'success');
        setCodigoValidacao('');
      } catch (error) {
        showToast('Erro de conexão com o banco de dados.', 'error');
      }
    } else {
      showToast('Erro: Código de segurança inválido.', 'error');
    }
  };

  const iniciarRota = () => {
    if (!pedidoAtual) return;

    if (pedidoAtual.coordenadas?.latitude && pedidoAtual.coordenadas?.longitude) {
      const { latitude, longitude } = pedidoAtual.coordenadas;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`, '_blank');
    } else if (pedidoAtual.enderecoEntrega) {
      const { rua, numero } = pedidoAtual.enderecoEntrega;
      const destino = `${rua}, ${numero}, Pontal - SP`;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving`, '_blank');
    } else {
      alert("Dados de endereço insuficientes para traçar a rota.");
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
        
        <h2 className="titulo-principal titulo-entregador">Área do Entregador</h2>
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
            <FaMapMarkerAlt color="#ff3333" size={24} className="icone-mapa" />
            <span>
              {pedidoAtual.enderecoEntrega?.rua}, {pedidoAtual.enderecoEntrega?.numero}
            </span>
          </div>

          <div className="validacao-seguranca-box">
            <FaShieldAlt size={24} color="#00ff66" className="icone-seguranca" />
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
            <button className="btn-acao-dash btn-entregador-gps" onClick={iniciarRota}>
              <FaRoute className="icone-btn-acao" /> Abrir Rota no GPS
            </button>

            <button className="btn-acao-dash btn-entregador-sucesso" onClick={handleValidarEntrega}>
              Confirmar Entrega
            </button>
          </div>
        </div>
      ) : (
        <p className="msg-sem-entregas">
          Nenhuma entrega pendente no momento.
        </p>
      )}
    </div>
  );
};

export default PerfilEntregador;