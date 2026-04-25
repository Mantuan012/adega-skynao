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
  
  // Gatilho para resetar a paginação no "Ver Menos"
  const [resetTrigger, setResetTrigger] = useState(0);
  
  // Busca Reativa Unificada
  const [busca, setBusca] = useState('');

  const limiteItens = isDono ? 10 : 5;

  const obterInicioTurno = () => {
    const agora = dayjs();
    if (agora.hour() < 5) {
      return agora.subtract(1, 'day').hour(5).minute(0).second(0).toISOString();
    }
    return agora.hour(5).minute(0).second(0).toISOString();
  };

  // 1. BUSCA APENAS OS DADOS BASE (Com Gatilho de Reset)
  useEffect(() => {
    if (!usuario) return;

    let restricoes = [];
    const pedidosRef = collection(db, "pedidos");

    if (isDono && !modoHistoricoAdmin) {
      restricoes.push(where("data", ">=", obterInicioTurno()));
    } else if (!isDono) {
      restricoes.push(where("userId", "==", usuario.uid));
    }

    restricoes.push(orderBy("data", "desc"));
    restricoes.push(limit(limiteItens + 1)); 

    const q = query(pedidosRef, ...restricoes);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs;
      
      const temMaisDocs = docs.length > limiteItens;
      setTemMais(temMaisDocs);
      
      const docsParaExibir = temMaisDocs ? docs.slice(0, limiteItens) : docs;
      setUltimoDoc(docsParaExibir.length > 0 ? docsParaExibir[docsParaExibir.length - 1] : null);

      const pedidosData = docsParaExibir.map(d => ({ id: d.id, ...d.data() }));
      setPedidos(pedidosData);
    });

    return () => unsubscribe();
  }, [usuario, isDono, modoHistoricoAdmin, limiteItens, resetTrigger]); // <-- resetTrigger adicionado aqui

  const carregarMaisPedidos = async () => {
    if (!ultimoDoc || carregandoMais) return;
    
    setCarregandoMais(true);
    try {
      let restricoes = [];
      const pedidosRef = collection(db, "pedidos");

      if (isDono && !modoHistoricoAdmin) {
        restricoes.push(where("data", ">=", obterInicioTurno()));
      } else if (!isDono) {
        restricoes.push(where("userId", "==", usuario.uid));
      }

      restricoes.push(orderBy("data", "desc"));
      restricoes.push(startAfter(ultimoDoc));
      restricoes.push(limit(limiteItens + 1));

      const qMais = query(pedidosRef, ...restricoes);
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

  // Função Mágica do Ver Menos
  const verMenosPedidos = () => {
    setResetTrigger(prev => prev + 1); // Força o useEffect a rodar de novo
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola a tela pro topo suavemente
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

  // 2. MOTOR DE FILTRAGEM EM MEMÓRIA
  const pedidosFiltrados = pedidos.filter(p => {
    let passaStatus = false;
    if (filtroStatus === 'Todos') passaStatus = true;
    else if (filtroStatus === 'Pendentes') passaStatus = p.status !== 'Entregue' && p.status !== 'Cancelado';
    else passaStatus = p.status === filtroStatus;

    let passaBusca = true;
    if (busca.trim() !== '') {
      const termo = busca.toLowerCase();
      const matchId = String(p.idPedido).includes(termo);
      const matchNome = p.enderecoEntrega?.nome?.toLowerCase().includes(termo);
      passaBusca = matchId || matchNome;
    }

    return passaStatus && passaBusca;
  });

  return (
    <div style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="titulo-principal" style={{ marginBottom: isDono ? '10px' : '20px' }}>
          {!isDono ? "Meus Pedidos" : (modoHistoricoAdmin ? "Histórico Geral de Pedidos" : "Painel de Operação (Turno Atual)")}
        </h2>
        
        {isDono && (
          <button 
            onClick={() => { setModoHistoricoAdmin(!modoHistoricoAdmin); setBusca(''); setFiltroStatus('Pendentes'); setResetTrigger(prev => prev + 1); }} 
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

      <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <input 
            type="text" 
            placeholder="Nome do cliente ou ID..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: '14px', 
              borderRadius: '6px', 
              border: '1px solid #00ff66', 
              backgroundColor: '#0d1a11', 
              color: '#fff', 
              fontSize: '1rem', 
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ color: '#00ff66', fontWeight: 'bold' }}>Status:</label>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="dash-select"
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff' }}
            >
              <option value="Pendentes">Pendentes</option>
              <option value="Todos">Todos</option>
              <option value="Em Preparo">Em Preparo</option>
              <option value="Saiu para Entrega">Saiu para Entrega</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="cartao" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#888', fontSize: '1.2rem', margin: 0 }}>
            {busca !== '' ? "Nenhum pedido encontrado com esse termo." : (isDono ? "Nenhum pedido encontrado para este filtro." : "Você ainda não tem pedidos.")}
          </p>
        </div>
      ) : (
        <>
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="cartao" style={{ marginBottom: '20px', padding: '20px', borderLeft: '4px solid #00ff66' }}>
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
              <p><b>Itens:</b> {pedido.itens?.map(item => `${item.quantidade || item.qtd}x ${item.nome}`).join(', ')}</p>
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
                    <button onClick={() => atualizarStatus(pedido.id, 'Saiu para Entrega')} className="botao" style={{ flex: 1, minWidth: '150px' }}>
                      Despachar
                    </button>
                  )}
                  {pedido.status === 'Saiu para Entrega' && (
                    <button onClick={() => atualizarStatus(pedido.id, 'Entregue')} className="botao" style={{ flex: 1, minWidth: '150px' }}>
                      Confirmar Entrega
                    </button>
                  )}
                  <button onClick={() => excluirPedido(pedido.id)} className="botao botao-vermelho" style={{ flex: 1, minWidth: '150px' }}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* PAINEL DE BOTÕES DE PAGINAÇÃO */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
            {temMais && busca === '' && (
              <button 
                onClick={carregarMaisPedidos} 
                className="botao"
                disabled={carregandoMais}
                style={{ width: '200px', backgroundColor: '#333', border: '1px solid #555' }}
              >
                {carregandoMais ? "Carregando..." : "Carregar Mais Pedidos"}
              </button>
            )}

            {pedidos.length > limiteItens && busca === '' && (
              <button 
                onClick={verMenosPedidos} 
                className="botao botao-vermelho"
                style={{ width: '200px', backgroundColor: 'transparent', border: '1px solid #ff4444', color: '#ff4444' }}
              >
                Ver Menos
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MenuPedidos;