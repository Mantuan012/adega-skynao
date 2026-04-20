import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  deleteDoc, orderBy, limit, startAfter, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import dayjs from 'dayjs'; 
import { FaHistory, FaBolt } from 'react-icons/fa'; 

const MenuPedidos = ({ isDono, usuario }) => {
  const [pedidos, setPedidos] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('Pendentes');
  const [modoHistoricoAdmin, setModoHistoricoAdmin] = useState(false);

  // Define quantos itens aparecem por vez (10 pro Admin, 5 pro Cliente)
  const limiteItens = isDono ? 10 : 5;

  const obterInicioTurno = () => {
    const agora = dayjs();
    if (agora.hour() < 5) {
      return agora.subtract(1, 'day').hour(5).minute(0).second(0).toISOString();
    }
    return agora.hour(5).minute(0).second(0).toISOString();
  };

  useEffect(() => {
    if (!usuario) return;

    let q;
    
    if (isDono) {
      if (!modoHistoricoAdmin) {
        const inicioTurno = obterInicioTurno();
        q = query(
          collection(db, "pedidos"),
          where("data", ">=", inicioTurno),
          orderBy("data", "desc")
        );
      } else {
        q = query(
          collection(db, "pedidos"),
          orderBy("data", "desc"),
          limit(limiteItens + 1) // TRUQUE N+1
        );
      }
    } else {
      q = query(
        collection(db, "pedidos"),
        where("userId", "==", usuario.uid),
        orderBy("data", "desc"),
        limit(limiteItens + 1) // TRUQUE N+1
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs;
      
      if (isDono && !modoHistoricoAdmin) {
        const pedidosData = docs.map(d => ({ id: d.id, ...d.data() }));
        setPedidos(pedidosData);
        setTemMais(false);
      } else {
        // Lógica do N+1: Se veio mais que o limite, tem próxima página
        const temMaisDocs = docs.length > limiteItens;
        setTemMais(temMaisDocs);
        
        // Corta o item extra para não aparecer na tela
        const docsParaExibir = temMaisDocs ? docs.slice(0, limiteItens) : docs;
        
        if (docsParaExibir.length > 0) {
          setUltimoDoc(docsParaExibir[docsParaExibir.length - 1]);
        } else {
          setUltimoDoc(null);
        }

        const pedidosData = docsParaExibir.map(d => ({ id: d.id, ...d.data() }));
        setPedidos(pedidosData);
      }
    });

    return () => unsubscribe();
  }, [usuario, isDono, modoHistoricoAdmin, limiteItens]);

  const carregarMaisPedidos = async () => {
    if (!ultimoDoc || carregandoMais) return;
    
    setCarregandoMais(true);
    try {
      let qMais;
      
      if (isDono) {
        qMais = query(
          collection(db, "pedidos"),
          orderBy("data", "desc"),
          startAfter(ultimoDoc),
          limit(limiteItens + 1) // TRUQUE N+1
        );
      } else {
        qMais = query(
          collection(db, "pedidos"),
          where("userId", "==", usuario.uid),
          orderBy("data", "desc"),
          startAfter(ultimoDoc),
          limit(limiteItens + 1) // TRUQUE N+1
        );
      }

      const snapshot = await getDocs(qMais);
      const docs = snapshot.docs;
      const temMaisDocs = docs.length > limiteItens;
      setTemMais(temMaisDocs);
      
      const docsParaExibir = temMaisDocs ? docs.slice(0, limiteItens) : docs;
      
      if (docsParaExibir.length > 0) {
        setUltimoDoc(docsParaExibir[docsParaExibir.length - 1]);
        const novosPedidos = docsParaExibir.map(d => ({ id: d.id, ...d.data() }));
        setPedidos(prev => [...prev, ...novosPedidos]);
      }
    } catch (error) {
      console.error("Erro ao carregar mais pedidos:", error);
    } finally {
      setCarregandoMais(false);
    }
  };

  const atualizarStatus = async (pedidoId, novoStatus) => {
    try {
      await updateDoc(doc(db, "pedidos", pedidoId), { status: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const excluirPedido = async (pedidoId) => {
    if (window.confirm("Atenção: Você está excluindo este pedido permanentemente. Deseja continuar?")) {
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
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="titulo-principal" style={{ marginBottom: isDono ? '10px' : '20px' }}>
          {!isDono ? "Meus Pedidos" : (modoHistoricoAdmin ? "Histórico Geral de Pedidos" : "Painel de Operação (Turno Atual)")}
        </h2>
        
        {isDono && (
          <button 
            onClick={() => setModoHistoricoAdmin(!modoHistoricoAdmin)} 
            className="botao"
            style={{ 
              backgroundColor: modoHistoricoAdmin ? '#222' : '#00ff66', 
              color: modoHistoricoAdmin ? '#00ff66' : '#000',
              border: '1px solid #00ff66',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {modoHistoricoAdmin ? <><FaBolt /> Voltar para Operação</> : <><FaHistory /> Ver Histórico Completo</>}
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ color: '#00ff66', marginRight: '10px', fontWeight: 'bold' }}>Status:</label>
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="dash-select" 
        >
          <option value="Pendentes">Pendentes</option>
          <option value="Todos">Todos</option>
          <option value="Em Preparo">Em Preparo</option>
          <option value="Saiu para Entrega">Saiu para Entrega</option>
          <option value="Entregue">Entregue</option>
        </select>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="cartao" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#888', fontSize: '1.2rem', margin: 0 }}>
            {isDono ? "Nenhum pedido encontrado para este filtro." : "Você ainda não tem pedidos."}
          </p>
        </div>
      ) : (
        <>
          {pedidosFiltrados.map((pedido) => (
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
              <p><b>Data:</b> {dayjs(pedido.data).format("DD/MM/YYYY HH:mm")}</p>
              
              <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', marginTop: '15px', borderLeft: '3px solid #00ff66' }}>
                <p><b>Entrega para:</b> {pedido.enderecoEntrega?.nome}</p>
                <p><b>Endereço:</b> {pedido.enderecoEntrega?.rua}, {pedido.enderecoEntrega?.numero}</p>
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
                      Despachar
                    </button>
                  )}
                  {pedido.status === 'Saiu para Entrega' && (
                    <button onClick={() => atualizarStatus(pedido.id, 'Entregue')} className="botao">
                      Confirmar Entrega
                    </button>
                  )}
                  <button onClick={() => excluirPedido(pedido.id)} className="botao botao-vermelho" style={{ marginLeft: 'auto' }}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* O SEGREDO ESTÁ AQUI: Só renderiza se a tela estiver com o limite cheio! */}
          {(!isDono || modoHistoricoAdmin) && temMais && pedidosFiltrados.length >= limiteItens && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                onClick={carregarMaisPedidos} 
                className="botao"
                disabled={carregandoMais}
                style={{ width: '200px' }}
              >
                {carregandoMais ? "Carregando..." : "Carregar Mais Histórico"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MenuPedidos;