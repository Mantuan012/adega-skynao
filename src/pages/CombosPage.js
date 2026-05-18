import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { FaArrowLeft, FaTags, FaPlus, FaEdit, FaExclamationTriangle, FaPercentage, FaBoxOpen, FaSave, FaTimes } from 'react-icons/fa'; 
import { doc, updateDoc, addDoc, deleteDoc, collection, deleteField, getDocs } from "firebase/firestore";
import { db } from '../firebase/firebaseConfig';
import FormularioProduto from '../components/FormularioProduto';
import './Catalogo.css'; 

function CombosPage({ isDono, showToast }) {
  const navigate = useNavigate();
  const { produtos, loadingProdutos, adicionarAoCarrinho } = useCart();

  // ESTADOS DO MODAL E FORMULÁRIO DE COMBOS
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [categoriasBD, setCategoriasBD] = useState([]);
  const [modalConfirmacao, setModalConfirmacao] = useState({ visivel: false, titulo: '', mensagem: '', acao: null });

  // ESTADOS DO NOVO GERENCIADOR DE PROMOÇÕES
  const [menuAdminAberto, setMenuAdminAberto] = useState(false);
  const [modalPromocaoAberto, setModalPromocaoAberto] = useState(false);
  const [promoForm, setPromoForm] = useState({ produtoId: '', precoPromocional: '', descricao: 'Oferta Especial' });

  useEffect(() => {
    const buscarCategorias = async () => {
      const snap = await getDocs(collection(db, "categorias"));
      setCategoriasBD(snap.docs.map(doc => ({ id: doc.id, nome: doc.data().nome })));
    };
    buscarCategorias();
  }, []);

  const ofertasEspeciais = produtos.filter(produto => {
    const isComboCategoria = produto.categoria && produto.categoria.toLowerCase().includes('combo');
    const isPromocao = !!produto.promocao;
    return isComboCategoria || isPromocao;
  });

  // Produtos que NÃO estão em promoção para o select do Admin
  const produtosElegiveisParaPromo = produtos.filter(p => !p.promocao && (!p.categoria || !p.categoria.toLowerCase().includes('combo')));

  // ======= LÓGICA DE PROMOÇÃO RÁPIDA =======
  const handleSalvarPromocao = async () => {
    if (!promoForm.produtoId || !promoForm.precoPromocional) {
      if(showToast) showToast('Selecione o produto e o preço!', 'error');
      return;
    }
    setSalvando(true);
    try {
      await updateDoc(doc(db, "produtos", promoForm.produtoId), {
        promocao: {
          precoPromocional: Number(promoForm.precoPromocional),
          descricao: promoForm.descricao
        }
      });
      setModalPromocaoAberto(false);
      setPromoForm({ produtoId: '', precoPromocional: '', descricao: 'Oferta Especial' });
      if(showToast) showToast('Promoção ativada com sucesso!', 'success');
    } catch (error) {
      if(showToast) showToast('Erro ao ativar: ' + error.message, 'error');
    } finally {
      setSalvando(false);
    }
  };

  // ======= LÓGICA GERAL DE COMBOS =======
  const excluirOfertaSegura = (oferta) => {
    const isApenasPromocao = oferta.promocao && (!oferta.categoria || !oferta.categoria.toLowerCase().includes('combo'));
    
    setModalConfirmacao({
      visivel: true,
      titulo: 'Remover Oferta',
      mensagem: isApenasPromocao 
        ? `Tem certeza que deseja encerrar a promoção do(a) "${oferta.nome}"? O produto voltará ao preço normal no catálogo.`
        : `Atenção! Isso irá deletar o combo "${oferta.nome}" permanentemente. Deseja continuar?`,
      acao: async () => {
        try {
          if (isApenasPromocao) {
            await updateDoc(doc(db, "produtos", String(oferta.id)), { promocao: deleteField() });
          } else {
            await deleteDoc(doc(db, "produtos", String(oferta.id)));
          }
          setShowModal(false);
          if(showToast) showToast('Oferta removida!', 'success');
        } catch (error) {
          if(showToast) showToast('Erro ao remover: ' + error.message, 'error');
        }
      }
    });
  };

  const salvarProdutoCombo = async (produtoEditado) => {
    setSalvando(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, "produtos", String(editingProduct.id)), {
          ...produtoEditado,
          preco: Number(produtoEditado.preco),
          volume: Number(produtoEditado.volume),
          estoque: Math.floor(Number(produtoEditado.estoque)),
          fardo: produtoEditado.fardo ? { ...produtoEditado.fardo, quantidade: Number(produtoEditado.fardo.quantidade), preco: Number(produtoEditado.fardo.preco) } : deleteField(),
        });
      } else {
        await addDoc(collection(db, "produtos"), {
          ...produtoEditado,
          preco: Number(produtoEditado.preco),
          volume: Number(produtoEditado.volume),
          estoque: Math.floor(Number(produtoEditado.estoque)),
        });
      }
      setShowModal(false);
      if(showToast) showToast('Combo guardado!', 'success');
    } catch (error) {
      if(showToast) showToast('Erro ao guardar: ' + error.message, 'error');
    } finally {
      setSalvando(false);
    }
  };

  if (loadingProdutos) return <div style={{ color: '#FFD700', textAlign: 'center', marginTop: '10%' }}><h2>Carregando ofertas especiais...</h2></div>;

  return (
    <div className="catalogo-container" style={{ paddingTop: '20px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/catalogo')} className="botao" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#333' }}>
            <FaArrowLeft /> Voltar ao Catálogo
          </button>
          <h2 className="catalogo-titulo" style={{ color: '#FFD700', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaTags /> Combos & Ofertas
          </h2>
        </div>

        {isDono && (
          <button onClick={() => setMenuAdminAberto(true)} className="botao" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #b8860b 100%)', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaPlus /> Nova Oferta
          </button>
        )}
      </div>

      <div className="produtos-grid">
        {ofertasEspeciais.length === 0 ? (
          <div className="mensagem-vazio" style={{ gridColumn: '1 / -1', border: '1px dashed #FFD700', color: '#FFD700', background: 'rgba(255, 215, 0, 0.05)' }}>
            Nenhuma oferta ativa no momento.
          </div>
        ) : (
          ofertasEspeciais.map((oferta) => (
            <div key={oferta.id} className="produto-card" style={{ borderColor: '#FFD700', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.1)' }}>
              
              {isDono && (
                <button className="btn-editar-admin" style={{ background: '#FFD700', color: '#000' }} onClick={(e) => { e.stopPropagation(); setEditingProduct(oferta); setShowModal(true); }}>
                  <FaEdit />
                </button>
              )}

              <div style={{ backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px', fontSize: '0.85rem', alignSelf: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {oferta.promocao?.descricao || 'Combo Especial'}
              </div>

              <div className="produto-info-clicavel" onClick={() => navigate(`/produto/${oferta.id}`)}>
                <img src={oferta.imagem || '/placeholder-imagem.png'} alt={oferta.nome} className="produto-imagem" />
                <h3 style={{ color: '#FFD700', fontSize: '1.2rem', marginBottom: '10px' }}>{oferta.nome}</h3>
                <p className="produto-preco" style={{ color: '#fff' }}>
                  {oferta.promocao ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1rem' }}>De R$ {oferta.preco.toFixed(2)}</span>
                      <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.6rem' }}> Por R$ {oferta.promocao.precoPromocional.toFixed(2)}</span>
                    </div>
                  ) : ( `R$ ${oferta.preco.toFixed(2)}` )}
                </p>
              </div>

              <button className="btn-adicionar" disabled={oferta.estoque === 0} onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(oferta); }} style={{ background: 'linear-gradient(to right, #b8860b, #FFD700)', color: '#000', marginTop: '15px' }}>
                {oferta.estoque === 0 ? 'Esgotado' : 'Aproveitar Oferta'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: ESCOLHA DO ADMIN */}
      {menuAdminAberto && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo" style={{ maxWidth: '400px', borderColor: '#FFD700', textAlign: 'center' }}>
            <h3 style={{ color: '#FFD700', marginTop: 0, marginBottom: '20px' }}>O que você deseja criar?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button className="botao" style={{ background: '#1a1a1a', border: '1px solid #FFD700', color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }} 
                onClick={() => { setMenuAdminAberto(false); setModalPromocaoAberto(true); }}>
                <FaPercentage size={20} /> Aplicar Desconto em Produto Existente
              </button>
              <button className="botao" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #b8860b 100%)', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px' }} 
                onClick={() => { setMenuAdminAberto(false); setEditingProduct(null); setShowModal(true); }}>
                <FaBoxOpen size={20} /> Criar Novo Combo do Zero
              </button>
              <button className="btn-form btn-form-cancelar" onClick={() => setMenuAdminAberto(false)} style={{ marginTop: '10px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APLICAR PROMOÇÃO RÁPIDA */}
      {modalPromocaoAberto && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo" style={{ borderColor: '#FFD700', maxWidth: '500px' }}>
            <h3 style={{ color: '#FFD700', marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '15px' }}>Ativar Promoção</h3>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label">Selecione o Produto do Catálogo:</label>
              <select className="form-input" value={promoForm.produtoId} onChange={(e) => setPromoForm({...promoForm, produtoId: e.target.value})}>
                <option value="">Selecione uma bebida...</option>
                {produtosElegiveisParaPromo.map(p => <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco.toFixed(2)}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div className="form-group">
                <label className="form-label">Novo Preço (R$):</label>
                <input type="number" min="0" step="0.01" className="form-input" value={promoForm.precoPromocional} onChange={(e) => setPromoForm({...promoForm, precoPromocional: e.target.value})} placeholder="Ex: 8.50" />
              </div>
              <div className="form-group">
                <label className="form-label">Etiqueta (Opcional):</label>
                <input type="text" className="form-input" value={promoForm.descricao} onChange={(e) => setPromoForm({...promoForm, descricao: e.target.value})} />
              </div>
            </div>

            <div className="botoes-form-produto" style={{ marginTop: 0, paddingTop: '15px', borderTop: '1px solid #333' }}>
              <button className="btn-form btn-form-salvar" style={{ background: '#FFD700', color: '#000' }} onClick={handleSalvarPromocao} disabled={salvando}>
                <FaSave /> {salvando ? 'Ativando...' : 'Ativar Oferta'}
              </button>
              <button className="btn-form btn-form-cancelar" onClick={() => setModalPromocaoAberto(false)} disabled={salvando}>
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FORMULÁRIO DE COMBO PADRÃO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo" style={{ borderColor: '#FFD700' }}>
             <FormularioProduto 
                produto={editingProduct} 
                onSave={salvarProdutoCombo} 
                onCancel={() => setShowModal(false)} 
                onDelete={() => excluirOfertaSegura(editingProduct)} 
                salvando={salvando}
                categoriasDisponiveis={categoriasBD} 
             />
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO INTELIGENTE */}
      {modalConfirmacao.visivel && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px', borderColor: '#ff4444' }}>
            <FaExclamationTriangle size={40} color="#ff4444" style={{ marginBottom: '15px' }} />
            <h3 style={{ color: '#ff4444', marginTop: 0 }}>{modalConfirmacao.titulo}</h3>
            <p style={{ color: '#ccc', fontSize: '1.05rem', marginBottom: '30px', lineHeight: '1.5' }}>{modalConfirmacao.mensagem}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn-form btn-form-cancelar" onClick={() => setModalConfirmacao({ visivel: false, acao: null })}>Cancelar</button>
              <button className="btn-form btn-form-excluir" onClick={() => { modalConfirmacao.acao(); setModalConfirmacao({ visivel: false, acao: null }); }}>Sim, Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CombosPage;