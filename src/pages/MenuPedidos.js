import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const MenuPedidos = ({ isDono, usuario }) => {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('Pendentes');

  useEffect(() => {
    if (!usuario) return;

    let q;
    if (isDono) {
      q = query(collection(db, "pedidos")); 
    } else {
      q = query(collection(db, "pedidos"), where("userId", "==", usuario.uid)); 
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pedidosData = [];
      querySnapshot.forEach((documento) => {
        pedidosData.push({ id: documento.id, ...documento.data() });
      });
      pedidosData.sort((a, b) => new Date(b.data) - new Date(a.data));
      setPedidos(pedidosData);
    });

    return () => unsubscribe();
  }, [usuario, isDono]);

  const atualizarStatus = async (pedidoId, novoStatus) => {
    try {
      await updateDoc(doc(db, "pedidos", pedidoId), { status: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const excluirPedido = async (pedidoId) => {
    if (window.confirm("Tem certeza que deseja excluir este pedido?")) {
      try {
        await deleteDoc(doc(db, "pedidos", pedidoId));
      } catch (error) {
        console.error("Erro ao excluir pedido:", error);
      }
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroStatus === 'Todos') return true;
    if (filtroStatus === 'Pendentes') return p.status !== 'Entregue';
    return p.status === filtroStatus;
  });

  return (
    <div style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}>
      <h2 className="titulo-principal">Menu de Pedidos</h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#00ff66', marginRight: '10px', fontWeight: 'bold' }}>Filtrar por Status:</label>
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{
            backgroundColor: '#222',
            color: '#fff',
            border: '1px solid #00ff66',
            padding: '8px 15px',
            borderRadius: '6px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="Pendentes">Apenas Pendentes</option>
          <option value="Todos">Mostrar Todos</option>
          <option value="Em Preparo">Em Preparo</option>
          <option value="Saiu para Entrega">Saiu para Entrega</option>
          <option value="Entregue">Entregue</option>
        </select>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="cartao" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#888', fontSize: '1.2rem', margin: 0 }}>Nenhum pedido encontrado nesta categoria.</p>
        </div>
      ) : (
        pedidosFiltrados.map((pedido) => (
          <div key={pedido.id} className="cartao" style={{ marginBottom: '20px', padding: '20px' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
              <b style={{ color: '#00ff66' }}>ID:</b> #{pedido.idPedido}
            </p>
            <p>
              <b>Status:</b>{' '}
              <span style={{ 
                color: pedido.status === 'Entregue' ? '#00cc44' : '#fff',
                fontWeight: 'bold' 
              }}>
                {pedido.status}
              </span>
            </p>
            <p><b>Itens:</b> {pedido.itens?.map(item => `${item.quantidade}x ${item.nome}`).join(', ')}</p>
            <p><b>Forma de Pagamento:</b> {pedido.formaPagamento}</p>
            <p><b>Data:</b> {new Date(pedido.data).toLocaleString()}</p>
            
            <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', marginTop: '15px', borderLeft: '3px solid #00ff66' }}>
              <p style={{ color: '#00ff66', marginBottom: '8px', fontWeight: 'bold' }}>📍 Dados de Entrega</p>
              <p><b>Cliente:</b> {pedido.enderecoEntrega?.nome}</p>
              <p><b>Endereço:</b> {pedido.enderecoEntrega?.rua}, {pedido.enderecoEntrega?.numero} - {pedido.enderecoEntrega?.bairro}</p>
              <p><b>Tel:</b> {pedido.enderecoEntrega?.telefone}</p>
            </div>

            <h3 style={{ color: '#00ff66', marginTop: '15px', fontSize: '1.4rem' }}>
              Total: R$ {pedido.total?.toFixed(2)}
            </h3>

            {!isDono && pedido.codigoSeguranca && pedido.status !== 'Entregue' && (
              <div style={{ backgroundColor: '#111', border: '1px dashed #00ff66', padding: '15px', borderRadius: '8px', marginTop: '20px', textAlign: 'center' }}>
                <p style={{ color: '#00ff66', fontWeight: 'bold', marginBottom: '5px' }}>🔐 Seu Código de Segurança</p>
                <p style={{ fontSize: '2rem', letterSpacing: '10px', color: '#fff', margin: 0 }}>{pedido.codigoSeguranca}</p>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>Informe este código ao entregador para finalizar a entrega.</p>
              </div>
            )}

            {isDono && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                {pedido.status === 'Em Preparo' && (
                  <button onClick={() => atualizarStatus(pedido.id, 'Saiu para Entrega')} className="botao">
                    Sair para Entrega
                  </button>
                )}
                
                {pedido.status === 'Saiu para Entrega' && (
                  <>
                    <button onClick={() => atualizarStatus(pedido.id, 'Em Preparo')} className="botao botao-vermelho">
                      Voltar para Preparo
                    </button>
                    <button onClick={() => atualizarStatus(pedido.id, 'Entregue')} className="botao">
                      Forçar Conclusão
                    </button>
                  </>
                )}

                <button onClick={() => excluirPedido(pedido.id)} className="botao botao-vermelho" style={{ marginLeft: 'auto' }}>
                  Excluir
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MenuPedidos;