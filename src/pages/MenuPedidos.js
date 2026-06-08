import React, { useState, useEffect } from 'react';
import './MenuPedidos.css'; 
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, limit, startAfter, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import dayjs from 'dayjs'; 
import { FaHistory, FaBolt, FaRoute, FaUndo } from 'react-icons/fa'; 

const MenuPedidos = ({ isDono, usuario }) => {
  const [pedidos, setPedidos] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(false);
  
  const [filtroStatus, setFiltroStatus] = useState('Pendentes');
  const [modoHistoricoAdmin, setModoHistoricoAdmin] = useState(false);
  
  const [resetTrigger, setResetTrigger] = useState(0);
  const [busca, setBusca] = useState('');

  const [modal, setModal] = useState({ isOpen: false, titulo: '', mensagem: '', tipo: 'sucesso', acaoConfirmar: null });

  const limiteItens = 10; 

  const obterInicioTurno = () => {
    const agora = dayjs();
    if (agora.hour() < 5) {
      return agora.subtract(1, 'day').hour(5).minute(0).second(0).toISOString();
    }
    return agora.hour(5).minute(0).second(0).toISOString();
  };

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
  }, [usuario, isDono, modoHistoricoAdmin, limiteItens, resetTrigger]); 

  const abrirModal = (titulo, mensagem, tipo, acao) => {
    setModal({ isOpen: true, titulo, mensagem, tipo, acaoConfirmar: acao });
  };

  const fecharModal = () => {
    setModal({ isOpen: false, titulo: '', mensagem: '', tipo: 'sucesso', acaoConfirmar: null });
  };

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

  const verMenosPedidos = () => {
    setResetTrigger(prev => prev + 1); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const atualizarStatus = async (pedidoId, novoStatus) => {
    try {
      await updateDoc(doc(db, "pedidos", pedidoId), { status: novoStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleDespachar = (pedido) => {
    abrirModal('Despachar Pedido', `Confirma que o pedido #${pedido.idPedido || pedido.id} está separado e pronto para retirada do entregador?`, 'sucesso', () => {
      atualizarStatus(pedido.id, 'Pronto');
      fecharModal();
    });
  };

  const handleDesfazer = (pedido) => {
    abrirModal('Desfazer Despacho', `O pedido #${pedido.idPedido || pedido.id} voltará para "Em Preparo". Deseja continuar?`, 'sucesso', () => {
      atualizarStatus(pedido.id, 'Em Preparo');
      fecharModal();
    });
  };

  const handleDesfazerDespacho = (pedido) => {
    abrirModal(
      'Desfazer Saída',
      `O pedido #${pedido.idPedido || pedido.id} será removido da rota do entregador ${pedido.nomeEntregador || ''} e voltará para a bancada como "Pronto". Continuar?`,
      'sucesso',
      async () => {
        try {
          await updateDoc(doc(db, "pedidos", pedido.id), {
            status: 'Pronto',
            entregadorId: null,
            nomeEntregador: null,
          });
          fecharModal();
        } catch (error) {
          console.error("Erro ao desfazer despacho:", error);
          fecharModal();
        }
      }
    );
  };

  const handleBaixaManual = (pedido) => {
    abrirModal('Baixa Manual', `Atenção: Deseja forçar a baixa do pedido #${pedido.idPedido || pedido.id} como "Entregue" manualmente sem o código do cliente?`, 'perigo', () => {
      atualizarStatus(pedido.id, 'Entregue');
      fecharModal();
    });
  };

  const excluirPedido = (pedido) => {
    abrirModal('Excluir Pedido', `Ação irreversível! Deseja apagar o pedido #${pedido.idPedido || pedido.id} permanentemente e devolver os itens ao estoque?`, 'perigo', async () => {
      try {
        if (pedido.itens && pedido.itens.length > 0) {
          for (const item of pedido.itens) {
            if (item.tipo === 'combo') {
              for (const i of item.itens) {
                const prodRef = doc(db, "produtos", String(i.id));
                const snap = await getDoc(prodRef);
                if (snap.exists()) {
                  await updateDoc(prodRef, { estoque: snap.data().estoque + (i.qtd * item.quantidade) });
                }
              }
            } else {
              const prodRef = doc(db, "produtos", String(item.id));
              const snap = await getDoc(prodRef);
              if (snap.exists()) {
                await updateDoc(prodRef, { estoque: snap.data().estoque + item.quantidade });
              }
            }
          }
        }
        
        await deleteDoc(doc(db, "pedidos", pedido.id));
        fecharModal();
      } catch (error) {
        console.error("Erro ao excluir pedido e devolver estoque:", error);
        fecharModal();
      }
    });
  };

  const iniciarRota = (pedido) => {
    if (pedido.coordenadas?.latitude && pedido.coordenadas?.longitude) {
      const { latitude, longitude } = pedido.coordenadas;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=$${latitude},${longitude}&travelmode=driving`, '_blank');
    } else if (pedido.enderecoEntrega) {
      const { rua, numero } = pedido.enderecoEntrega;
      const destino = `${rua}, ${numero}, Pontal - SP`;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=$${encodeURIComponent(destino)}&travelmode=driving`, '_blank');
    } else {
      alert("Dados de endereço insuficientes para traçar rota.");
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    let passaStatus = false;
    if (filtroStatus === 'Todos') {
        passaStatus = true;
    } else if (filtroStatus === 'Pendentes') {
        passaStatus = p.status !== 'Entregue' && p.status !== 'Cancelado';
    } else {
        passaStatus = p.status === filtroStatus;
    }

    let passaBusca = true;
    if (busca.trim() !== '') {
      const termo = busca.toLowerCase();
      const idString = p.idPedido ? String(p.idPedido).toLowerCase() : String(p.id).toLowerCase();
      const nomeString = p.enderecoEntrega?.nome ? String(p.enderecoEntrega.nome).toLowerCase() : '';
      
      const matchId = idString.includes(termo);
      const matchNome = nomeString.includes(termo);
      
      passaBusca = matchId || matchNome;
    }

    return passaStatus && passaBusca;
  });

  return (
    <div className="menu-pedidos-wrapper">
      
      {modal.isOpen && (
        <div className="modal-overlay-custom">
          <div className={`modal-conteudo-custom ${modal.tipo === 'perigo' ? 'modal-conteudo-custom-danger' : ''}`}>
            <h3>{modal.titulo}</h3>
            <p>{modal.mensagem}</p>
            <div className="modal-botoes">
              <button onClick={fecharModal} className="btn-modal-cancelar">Cancelar</button>
              <button onClick={modal.acaoConfirmar} className={modal.tipo === 'perigo' ? 'btn-modal-danger' : 'btn-modal-confirmar'}>
                Sim, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="menu-pedidos-header">
        <h2 className={`titulo-principal ${isDono ? 'titulo-margin-admin' : 'titulo-margin-cliente'}`}>
          {!isDono ? "Meus Pedidos" : (modoHistoricoAdmin ? "Histórico Geral de Pedidos" : "Painel de Operação (Turno Atual)")}
        </h2>
        
        {isDono && (
          <button 
            onClick={() => { setModoHistoricoAdmin(!modoHistoricoAdmin); setBusca(''); setFiltroStatus('Pendentes'); setResetTrigger(prev => prev + 1); }} 
            className={`btn-toggle-historico ${modoHistoricoAdmin ? 'ativo' : 'inativo'}`}
          >
            {modoHistoricoAdmin ? <><FaBolt /> Voltar para Operação</> : <><FaHistory /> Ver Histórico Completo</>}
          </button>
        )}
      </div>

      <div className="filtro-container">
        <div className="filtro-wrapper">
          
          <input 
            type="text" 
            placeholder="Nome do cliente ou ID..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-busca"
          />

          <div className="status-wrapper">
            <label className="status-label">Status:</label>
            <select 
              value={filtroStatus} 
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="select-status"
            >
              <option value="Pendentes">Pendentes</option>
              <option value="Todos">Todos</option>
              <option value="Em Preparo">Em Preparo</option>
              <option value="Pronto">Pronto</option>
              <option value="Saiu para Entrega">Saiu para Entrega</option>
              <option value="Entregue">Entregue</option>
            </select>
          </div>
        </div>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="cartao msg-vazio">
          <p style={{ margin: 0 }}>
            {busca !== '' ? "Nenhum pedido encontrado com esse termo." : (isDono ? "Nenhum pedido encontrado para este filtro." : "Você ainda não tem pedidos.")}
          </p>
        </div>
      ) : (
        <>
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="cartao card-pedido-item">
              <p className="texto-id">
                <b className="destaque-verde">ID:</b> #{pedido.idPedido || pedido.id}
              </p>
              <p>
                <b>Status:</b>{' '}
                <span className={pedido.status === 'Entregue' ? 'status-entregue' : 'status-padrao'}>
                  {pedido.status}
                </span>
              </p>
              <p><b>Itens:</b> {pedido.itens?.map(item => `${item.quantidade || item.qtd}x ${item.nome}`).join(', ')}</p>
              <p><b>Data:</b> {dayjs(pedido.data).format("DD/MM/YYYY HH:mm")}</p>
              
              <div className="box-endereco">
                <p><b>Entrega para:</b> {pedido.enderecoEntrega?.nome || 'Nome não informado'}</p>
                <p><b>Bairro:</b> {pedido.enderecoEntrega?.bairro || 'Não informado'}</p>
                <p><b>Endereço:</b> {pedido.enderecoEntrega?.rua}, {pedido.enderecoEntrega?.numero} {pedido.enderecoEntrega?.complemento ? ` - ${pedido.enderecoEntrega.complemento}` : ''}</p>
              </div>

              <h3 className="total-pedido">
                Total: R$ {pedido.total?.toFixed(2)}
              </h3>

              {!isDono && pedido.codigoSeguranca && pedido.status !== 'Entregue' && (
                <div className="box-codigo">
                  <p className="codigo-titulo">🔐 Seu Código de Segurança</p>
                  <p className="codigo-valor">{pedido.codigoSeguranca}</p>
                  <p className="codigo-dica">Informe este código ao entregador para finalizar a entrega.</p>
                </div>
              )}

              {isDono && (
                <div className="botoes-acao-admin">
                  {pedido.status === 'Em Preparo' && (
                    <button onClick={() => handleDespachar(pedido)} className="btn-acao-admin btn-entregar">
                      Despachar
                    </button>
                  )}
                  
                  {pedido.status === 'Pronto' && (
                    <button onClick={() => handleDesfazer(pedido)} className="btn-acao-admin btn-laranja">
                      <FaUndo /> Desfazer Despacho
                    </button>
                  )}

                  {pedido.status === 'Saiu para Entrega' && (
                    <>
                      <button onClick={() => iniciarRota(pedido)} className="btn-acao-admin btn-rota">
                        <FaRoute size={16} /> Abrir Rota no GPS
                      </button>
                      <button onClick={() => handleDesfazerDespacho(pedido)} className="btn-acao-admin btn-desfazer-saida">
                        <FaUndo /> Desfazer Saída
                      </button>
                      <button onClick={() => handleBaixaManual(pedido)} className="btn-acao-admin btn-entregar">
                        Confirmar Entrega
                      </button>
                    </>
                  )}
                  <button onClick={() => excluirPedido(pedido)} className="btn-acao-admin btn-excluir">
                    Excluir
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="paginacao-container">
            {temMais && busca === '' && (
              <button 
                onClick={carregarMaisPedidos} 
                className="btn-carregar"
                disabled={carregandoMais}
              >
                {carregandoMais ? "Carregando..." : "Carregar Mais Pedidos"}
              </button>
            )}

            {pedidos.length > limiteItens && busca === '' && (
              <button 
                onClick={verMenosPedidos} 
                className="btn-ver-menos"
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