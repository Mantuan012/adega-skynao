import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaShieldAlt, FaUserCircle, FaRoute } from 'react-icons/fa';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const PerfilEntregador = ({ showToast, dadosUsuario }) => {
  const [pedidoAtual, setPedidoAtual] = useState(null);
  const [codigoValidacao, setCodigoValidacao] = useState('');

  useEffect(() => {
    const q = query(collection(db, "pedidos"), where("status", "==", "Saiu para Entrega"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const listaPendentes = [];
        querySnapshot.forEach((docData) => listaPendentes.push({ docId: docData.id, ...docData.data() }));
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
    if (String(codigoValidacao).trim() === codigoCorreto) {
      try {
        await updateDoc(doc(db, "pedidos", pedidoAtual.docId), { status: "Entregue" });
        showToast('Sucesso: Pedido entregue!', 'success');
        setCodigoValidacao('');
      } catch (error) { showToast('Erro de conexão.', 'error'); }
    } else { showToast('Erro: Código inválido.', 'error'); }
  };

  const iniciarRota = () => {
    if (!pedidoAtual) return;
    if (pedidoAtual.coordenadas?.latitude && pedidoAtual.coordenadas?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=$${pedidoAtual.coordenadas.latitude},${pedidoAtual.coordenadas.longitude}&travelmode=driving`, '_blank');
    } else if (pedidoAtual.enderecoEntrega) {
      const destino = `${pedidoAtual.enderecoEntrega.rua}, ${pedidoAtual.enderecoEntrega.numero}, Pontal - SP`;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=$${encodeURIComponent(destino)}&travelmode=driving`, '_blank');
    }
  };

  const btnGPSStyle = {
    flex: 1, minWidth: '150px', height: '56px', boxSizing: 'border-box', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'transparent',
    border: '2px solid #4285F4', color: '#4285F4', boxShadow: '0 0 5px rgba(66, 133, 244, 0.3)'
  };

  const btnConfirmStyle = {
    flex: 1, minWidth: '150px', height: '56px', boxSizing: 'border-box', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'transparent',
    border: '2px solid #00ff66', color: '#00ff66', boxShadow: '0 0 5px rgba(0, 255, 102, 0.3)'
  };

  return (
    <div className="cartao" style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', width: '100%' }}>
        {dadosUsuario?.foto ? ( <img src={dadosUsuario.foto} alt="Perfil" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00ff66' }} /> ) : ( <FaUserCircle size={80} color="#00ff66" /> )}
        <h2 style={{ color: '#00ff66', marginTop: '10px' }}>Área do Entregador</h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0 5px 0' }}>{dadosUsuario?.nome || 'Entregador'}</p>
      </div>

      {pedidoAtual ? (
        <div style={{ width: '100%', marginTop: '20px' }}>
          <h3 style={{ color: '#00ff66', textAlign: 'center', marginBottom: '15px' }}>Entrega Atual</h3>
          <p><strong>ID:</strong> #{pedidoAtual.idPedido}</p>
          <p><strong>Status:</strong> <span style={{ color: '#00ff66', fontWeight: 'bold' }}>{pedidoAtual.status}</span></p>
          
          <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', margin: '15px 0', borderLeft: '3px solid #ff3333' }}>
            <FaMapMarkerAlt color="#ff3333" size={24} style={{ flexShrink: 0 }} />
            <span>{pedidoAtual.enderecoEntrega?.rua}, {pedidoAtual.enderecoEntrega?.numero}</span>
          </div>

          <div style={{ background: '#111', border: '1px dashed #00ff66', padding: '20px', borderRadius: '10px', textAlign: 'center', margin: '25px 0' }}>
            <FaShieldAlt size={24} color="#00ff66" style={{ marginBottom: '10px' }} />
            <p style={{ fontWeight: 'bold' }}>CÓDIGO DE SEGURANÇA</p>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>Solicite ao cliente na entrega.</p>
            <input type="text" maxLength="4" placeholder="0000" value={codigoValidacao} onChange={(e) => setCodigoValidacao(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', maxWidth: '200px', background: '#000', border: '2px solid #00ff66', color: '#fff', fontSize: '2rem', textAlign: 'center', letterSpacing: '15px', padding: '10px', borderRadius: '10px', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button style={btnGPSStyle} onClick={iniciarRota}>
              <FaRoute size={18} /> Abrir Rota no GPS
            </button>
            <button style={btnConfirmStyle} onClick={handleValidarEntrega}>
              Confirmar Entrega
            </button>
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '1.2rem', color: '#888' }}>
          Nenhuma entrega pendente no momento.
        </p>
      )}
    </div>
  );
};

export default PerfilEntregador;