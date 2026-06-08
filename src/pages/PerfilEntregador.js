import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaShieldAlt, FaRoute, FaBoxOpen, FaMotorcycle, FaCheck, FaInfoCircle, FaUndo, FaListOl, FaTruckLoading, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import './PerfilEntregador.css';

const PerfilEntregador = ({ showToast, dadosUsuario }) => {
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState([]);
  const [minhaBag, setMinhaBag] = useState([]);
  const [codigosValidacao, setCodigosValidacao] = useState({});
  const [itensExpandidos, setItensExpandidos] = useState({}); 
  const [carregando, setCarregando] = useState(true);
  
  const [modal, setModal] = useState({ isOpen: false, titulo: '', mensagem: '', acaoConfirmar: null });

  const entregadorId = auth.currentUser?.uid;

  useEffect(() => {
    if (!entregadorId) return;

    const qDisp = query(collection(db, "pedidos"), where("status", "==", "Pronto"));
    const unsubDisp = onSnapshot(qDisp, (snap) => {
      const lista = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setPedidosDisponiveis(lista.sort((a, b) => new Date(a.data) - new Date(b.data)));
      setCarregando(false);
    });

    const qBag = query(collection(db, "pedidos"), 
      where("status", "==", "Saiu para Entrega"),
      where("entregadorId", "==", entregadorId)
    );
    const unsubBag = onSnapshot(qBag, (snap) => {
      const lista = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setMinhaBag(lista.sort((a, b) => new Date(a.data) - new Date(b.data)));
    });

    return () => { unsubDisp(); unsubBag(); };
  }, [entregadorId]);

  const calcularTotalItens = (itens) => {
    if (!itens) return 0;
    return itens.reduce((total, item) => total + (Number(item.quantidade) || Number(item.qtd) || 1), 0);
  };

  const obterBairro = (pedido) => {
    return pedido.enderecoEntrega?.bairro || pedido.bairro || 'Bairro não informado';
  };

  const toggleItens = (pedidoId) => {
    setItensExpandidos(prev => ({ ...prev, [pedidoId]: !prev[pedidoId] }));
  };

  const abrirModal = (titulo, mensagem, acao) => {
    setModal({ isOpen: true, titulo, mensagem, acaoConfirmar: acao });
  };

  const fecharModal = () => {
    setModal({ isOpen: false, titulo: '', mensagem: '', acaoConfirmar: null });
  };

  const pegarPedido = (pedido) => {
    abrirModal(
      'Assumir Rota', 
      `Você vai recolher o Pedido #${pedido.idPedido || pedido.docId.slice(0,6)} e iniciar a entrega. Confirma?`, 
      async () => {
        try {
          await updateDoc(doc(db, "pedidos", pedido.docId), { 
            status: "Saiu para Entrega",
            entregadorId,
            nomeEntregador: dadosUsuario?.nome || "Entregador"
          });
          showToast('Pedido recolhido com sucesso!', 'success');
          fecharModal();
        } catch (e) { showToast('Erro ao atualizar status.', 'error'); fecharModal(); }
      }
    );
  };

  const devolverPedido = (pedido) => {
    abrirModal(
      'Devolver Pedido', 
      `Tem certeza que deseja devolver o Pedido #${pedido.idPedido || pedido.docId.slice(0,6)} para a bancada da adega?`, 
      async () => {
        try {
          await updateDoc(doc(db, "pedidos", pedido.docId), { 
            status: "Pronto", entregadorId: null, nomeEntregador: null
          });
          showToast('Pedido devolvido para a adega.', 'success');
          fecharModal();
        } catch (e) { showToast('Erro ao devolver pedido.', 'error'); fecharModal(); }
      }
    );
  };

  const finalizarEntrega = async (pedido) => {
    const digitado = codigosValidacao[pedido.docId] || '';
    const correto = pedido.codigoSeguranca ? String(pedido.codigoSeguranca).trim() : "1234";
    
    if (digitado === correto) {
      try {
        await updateDoc(doc(db, "pedidos", pedido.docId), { status: "Entregue" });
        showToast('Entrega confirmada!', 'success');
        setCodigosValidacao(prev => { const n = {...prev}; delete n[pedido.docId]; return n; });
      } catch (e) { showToast('Erro de conexão.', 'error'); }
    } else { showToast('Código de segurança incorreto.', 'error'); }
  };

  const abrirGPS = (pedido) => {
    const destino = encodeURIComponent(`${pedido.enderecoEntrega?.rua}, ${pedido.enderecoEntrega?.numero}, Pontal - SP`);
    window.open(`http://googleusercontent.com/maps.google.com/?q=${destino}&travelmode=driving`, '_blank');
  };

  if (carregando) return <div className="entregador-wrapper" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}><p style={{color: '#1b5e20', fontSize: '1.2rem'}}>Sincronizando rotas...</p></div>;

  return (
    <div className="entregador-wrapper">
      
      {modal.isOpen && (
        <div className="modal-overlay-custom">
          <div className="modal-conteudo-custom">
            <h3>{modal.titulo}</h3>
            <p>{modal.mensagem}</p>
            <div className="modal-botoes">
              <button onClick={fecharModal} className="btn-modal-cancelar">Cancelar</button>
              <button onClick={modal.acaoConfirmar} className="btn-modal-confirmar">Sim, Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <header className="perfil-card-profissional centralizado">
        <div className="perfil-info-profissional">
            <h2 className="entregador-nome">{dadosUsuario?.nome || 'Entregador'}</h2>
            <div className="stats-rapidos-profissional">
                <div className="stat-item"><FaMotorcycle /> <span>{minhaBag.length} na Mochila</span></div>
                <div className="stat-item"><FaBoxOpen /> <span>{pedidosDisponiveis.length} Disponíveis</span></div>
            </div>
        </div>
      </header>

      <div className="secao-profissional">
          <h3 className="titulo-secao secao-bag">
            <FaTruckLoading /> A Minha Mochila de Entregas ({minhaBag.length})
          </h3>
          
          {minhaBag.length === 0 ? (
            <div className="empty-state-profissional"><FaInfoCircle /> Sua mochila está vazia no momento. Recolha novos pedidos abaixo.</div>
          ) : (
            <div className="grid-bag-profissional">
                {minhaBag.map(pedido => (
                  <div key={pedido.docId} className="card-entrega-profissional card-em-rota">
                    <div className="header-entrega-profissional">
                      <span className="info-id-pedido"><FaListOl /> ID Pedido: #{pedido.idPedido || pedido.docId.slice(0,6)}</span>
                      
                      <div className="botoes-card-profissional">
                        <button onClick={() => devolverPedido(pedido)} className="btn-acao-card btn-desfazer">
                          <FaUndo /> Devolver
                        </button>
                        <button onClick={() => abrirGPS(pedido)} className="btn-acao-card btn-rota">
                          <FaRoute /> Rota GPS
                        </button>
                      </div>
                    </div>
                    
                    <div className="info-endereco-profissional">
                      <FaMapMarkerAlt className="icon-mapa-vermelho" />
                      <div style={{width: '100%'}}>
                          <p className="texto-endereco">
                             Rua: {pedido.enderecoEntrega?.rua}, {pedido.enderecoEntrega?.numero}
                          </p>
                          <p className="texto-unidades">Bairro: {obterBairro(pedido)}</p>
                          
                          <button onClick={() => toggleItens(pedido.docId)} className="btn-ver-mais-itens">
                            {itensExpandidos[pedido.docId] ? <FaChevronUp /> : <FaChevronDown />}
                            {itensExpandidos[pedido.docId] ? 'Ocultar Itens' : `Ver Resumo (${calcularTotalItens(pedido.itens)} unidades)`}
                          </button>

                          {itensExpandidos[pedido.docId] && (
                            <ul className="lista-itens-oculta">
                              {pedido.itens?.map((item, index) => (
                                <li key={index}><b>{item.quantidade || item.qtd}x</b> {item.nome}</li>
                              ))}
                            </ul>
                          )}
                      </div>
                    </div>

                    <div className="box-otp-profissional">
                      <div className="input-group-validacao">
                        <FaShieldAlt className="icon-seguranca" />
                        <input 
                          type="text" 
                          className="input-otp-moderno" 
                          maxLength="4" 
                          placeholder="CODE"
                          value={codigosValidacao[pedido.docId] || ''}
                          onChange={(e) => setCodigosValidacao({...codigosValidacao, [pedido.docId]: e.target.value.replace(/\D/g, '')})}
                        />
                      </div>
                      <button onClick={() => finalizarEntrega(pedido)} className="btn-confirmar-moderno">
                        <FaCheck /> Confirmar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
      </div>

      <div className="secao-profissional">
          <h3 className="titulo-secao secao-vitrine">
            <FaBoxOpen /> Disponíveis para Recolha ({pedidosDisponiveis.length})
          </h3>
          
          {pedidosDisponiveis.length === 0 ? (
            <div className="empty-state-profissional">A equipe da adega está preparando novos pedidos. Aguarde...</div>
          ) : (
            <div className="grid-vitrine-profissional">
                {pedidosDisponiveis.map(pedido => (
                  <div key={pedido.docId} className="card-entrega-profissional card-disponivel">
                    <div className="header-vitrine-profissional">
                        <div>
                            <p className="texto-id-vitrine">ID #{pedido.idPedido || pedido.docId.slice(0,6)}</p>
                            <p className="texto-bairro-vitrine">Bairro: {obterBairro(pedido)}</p>
                            <p className="texto-endereco-vitrine">{pedido.enderecoEntrega?.rua}, {pedido.enderecoEntrega?.numero}</p>
                            <p className="texto-unidades-vitrine">{calcularTotalItens(pedido.itens)} unidade(s) no total</p>
                        </div>
                        <button onClick={() => pegarPedido(pedido)} className="btn-confirmar-moderno btn-verde" style={{width: 'auto', padding: '12px 25px', height: 'auto'}}>
                           Recolher
                        </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
      </div>

    </div>
  );
};

export default PerfilEntregador;