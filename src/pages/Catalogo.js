import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Banner from '../components/Banner';
import { FaEdit, FaPlus, FaTrash, FaFilter, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa'; 
import { doc, updateDoc, addDoc, deleteDoc, collection, deleteField, getDocs } from "firebase/firestore";
import { db } from '../firebase/firebaseConfig';
import './Catalogo.css'; 
import FormularioProduto from '../components/FormularioProduto';

function Catalogo({ isDono, showToast }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriasAtivas, setCategoriasAtivas] = useState([]);
  const [mostrarTodosFiltros, setMostrarTodosFiltros] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [salvando, setSalvando] = useState(false);
  
  const [modalConfirmacao, setModalConfirmacao] = useState({ visivel: false, titulo: '', mensagem: '', acao: null });
  
  const [categoriasBD, setCategoriasBD] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');

  const navigate = useNavigate();
  const { adicionarAoCarrinho, produtos, loadingProdutos } = useCart(); 

  const buscarCategorias = async () => {
    try {
      const snap = await getDocs(collection(db, "categorias"));
      const lista = snap.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }));
      setCategoriasBD(lista);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    buscarCategorias();
  }, []);

  const handleAddCategoria = async () => {
    if (!novaCategoria.trim()) return;
    try {
      await addDoc(collection(db, "categorias"), { nome: novaCategoria.trim() });
      setNovaCategoria('');
      buscarCategorias();
      if(showToast) showToast('Categoria criada com sucesso!', 'success');
    } catch (error) {
      if(showToast) showToast('Erro ao criar categoria: ' + error.message, 'error');
    }
  };

  const handleExcluirCategoria = (id, nome) => {
    setModalConfirmacao({
      visivel: true,
      titulo: 'Apagar Categoria',
      mensagem: `Deseja realmente excluir o filtro "${nome}" de forma definitiva?`,
      acao: async () => {
        try {
          await deleteDoc(doc(db, "categorias", id));
          buscarCategorias();
          setCategoriasAtivas(prev => prev.filter(c => c !== nome));
          if(showToast) showToast('Categoria apagada.', 'success');
        } catch (error) {
          if(showToast) showToast('Erro ao apagar: ' + error.message, 'error');
        }
      }
    });
  };

  const toggleCategoria = (nomeCat) => {
    setCategoriasAtivas(prevAtivas => {
      if (prevAtivas.includes(nomeCat)) {
        return prevAtivas.filter(cat => cat !== nomeCat);
      } else {
        return [...prevAtivas, nomeCat];
      }
    });
  };

  const produtosFiltrados = produtos.filter((produto) => {
    const prodCatSuja = (produto.categoria || '').toLowerCase().trim();
    const atendeCategoria = categoriasAtivas.length === 0 || categoriasAtivas.some(catAtiva => {
      const catAtivaSuja = catAtiva.toLowerCase().trim();
      return prodCatSuja.includes(catAtivaSuja) || catAtivaSuja.includes(prodCatSuja);
    });
    const atendeBusca = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    return atendeCategoria && atendeBusca;
  });

  const iniciarEdicao = (produto, e) => {
    e.stopPropagation();
    setEditingProduct(produto);
    setShowModal(true);
  };

  const iniciarNovoProduto = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const excluirProduto = (produtoId) => {
    setModalConfirmacao({
      visivel: true,
      titulo: 'Excluir Bebida',
      mensagem: "Atenção! Você tem certeza que deseja retirar este produto do catálogo da Adega?",
      acao: async () => {
        try {
          await deleteDoc(doc(db, "produtos", String(produtoId)));
          setShowModal(false);
          if(showToast) showToast('Produto excluído com sucesso!', 'success');
        } catch (error) {
          if(showToast) showToast('Erro ao excluir: ' + error.message, 'error');
        }
      }
    });
  };

  const salvarProduto = async (produtoEditado) => {
    setSalvando(true);
    try {
      const nome = produtoEditado.nome?.trim() || '';
      const categoria = produtoEditado.categoria || '';
      if (!nome || !categoria) throw new Error("Nome e categoria são obrigatórios");

      if (editingProduct) {
        const docId = String(editingProduct.id);
        await updateDoc(doc(db, "produtos", docId), {
          ...produtoEditado,
          preco: Number(produtoEditado.preco),
          volume: Number(produtoEditado.volume),
          estoque: Math.floor(Number(produtoEditado.estoque)),
          fardo: produtoEditado.fardo ? { ...produtoEditado.fardo, quantidade: Number(produtoEditado.fardo.quantidade), preco: Number(produtoEditado.fardo.preco) } : deleteField(),
          promocao: produtoEditado.promocao ? { ...produtoEditado.promocao, precoPromocional: Number(produtoEditado.promocao.precoPromocional) } : deleteField(),
        });
        if(showToast) showToast('Produto atualizado!', 'success');
      } else {
        await addDoc(collection(db, "produtos"), {
          ...produtoEditado,
          preco: Number(produtoEditado.preco),
          volume: Number(produtoEditado.volume),
          estoque: Math.floor(Number(produtoEditado.estoque)),
        });
        if(showToast) showToast('Novo produto cadastrado!', 'success');
      }
      setShowModal(false);
    } catch (error) {
      if(showToast) showToast('Erro ao guardar: ' + error.message, 'error');
    } finally {
      setSalvando(false);
    }
  };

  if (loadingProdutos) return <div className="catalogo-container"><h2 style={{color: '#00ff66', textAlign: 'center'}}>Carregando catálogo...</h2></div>;

  const categoriasVisiveis = mostrarTodosFiltros ? categoriasBD : categoriasBD.slice(0, 5);

  return (
    <div className="catalogo-container">
      <Banner onBannerClick={() => navigate('/combos')} isDono={isDono} />
      
      <div className="cabecalho-acoes">
        <h2 className="catalogo-titulo">Catálogo de Produtos</h2>
        
        <input 
          type="text" 
          placeholder="Pesquisar por nome..." 
          value={termoBusca} 
          onChange={(e) => setTermoBusca(e.target.value)} 
          className="busca-input" 
        />

        {isDono && (
           <button onClick={iniciarNovoProduto} className="botao" style={{ padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
             <FaPlus /> Adicionar Produto
           </button>
        )}
      </div>

      <div className="catalogo-layout">
        
        <aside className="sidebar-filtros">
          <div className="sidebar-header">
            <h3><FaFilter size={14}/> Filtros</h3>
            {categoriasAtivas.length > 0 && <span className="badge-filtros">{categoriasAtivas.length}</span>}
          </div>

          <div className="filtros-lista">
            {categoriasVisiveis.map((cat) => (
              <div key={cat.id} className="filtro-item-container">
                <label className="filtro-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={categoriasAtivas.includes(cat.nome)} 
                    onChange={() => toggleCategoria(cat.nome)} 
                  />
                  <span className="checkmark"></span>
                  <span className="texto-categoria">{cat.nome}</span>
                </label>

                {isDono && (
                  <FaTrash 
                    color="#ff4444" 
                    style={{ cursor: 'pointer', padding: '5px' }} 
                    onClick={() => handleExcluirCategoria(cat.id, cat.nome)} 
                    title="Apagar Categoria"
                  />
                )}
              </div>
            ))}
          </div>

          {categoriasBD.length > 5 && (
            <button className="btn-ver-mais" onClick={() => setMostrarTodosFiltros(!mostrarTodosFiltros)}>
              {mostrarTodosFiltros ? <><FaChevronUp size={12}/> Ver Menos</> : <><FaChevronDown size={12}/> Ver Mais</>}
            </button>
          )}

          {isDono && (
            <div className="admin-categoria-box">
              <h4><FaPlus size={14}/> Gerenciar Categorias</h4>
              <div className="admin-input-row">
                <input
                  type="text"
                  className="input-cat-admin"
                  placeholder="Nova (Ex: Vinhos)"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                />
                <button className="btn-add-cat" onClick={handleAddCategoria}>
                  Criar Categoria
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className="conteudo-produtos">
          <div className="produtos-grid">
            {produtosFiltrados.length === 0 ? (
              <div className="mensagem-vazio" style={{ gridColumn: '1 / -1' }}>
                <div className="mascote-vazio-container">
                  <img src="/mascote.jpeg" alt="Mascote Adega Skynão" className="mascote-img" />
                  <span>Opa! Nenhuma bebida encontrada com esses filtros.</span>
                </div>
              </div>
            ) : (
              produtosFiltrados.map((produto) => (
                <div key={produto.id} className="produto-card">
                  {isDono && (
                    <button className="btn-editar-admin" onClick={(e) => iniciarEdicao(produto, e)}>
                      <FaEdit />
                    </button>
                  )}

                  <div className="produto-info-clicavel" onClick={() => navigate(`/produto/${produto.id}`)}>
                    <img src={produto.imagem || '/placeholder-imagem.png'} alt={produto.nome} className="produto-imagem" />
                    <h3 className="produto-nome">{produto.nome}</h3>
                    <p className="produto-preco">
                      {produto.promocao ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1rem' }}>R$ {produto.preco.toFixed(2)}</span>
                          <span style={{ color: '#ff4444', fontWeight: 'bold' }}> R$ {produto.promocao.precoPromocional.toFixed(2)}</span>
                        </>
                      ) : (
                        `R$ ${produto.preco.toFixed(2)}`
                      )}
                    </p>
                  </div>
                  
                  <button className="btn-adicionar" disabled={produto.estoque === 0} onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(produto); }}>
                    {produto.estoque === 0 ? 'Esgotado' : 'Adicionar'}
                  </button>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      
      {/* MODAL DE PRODUTO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo">
             <FormularioProduto 
                produto={editingProduct} 
                onSave={salvarProduto} 
                onCancel={() => setShowModal(false)} 
                onDelete={() => excluirProduto(editingProduct.id)} 
                salvando={salvando}
                categoriasDisponiveis={categoriasBD} 
             />
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PREMIUM */}
      {modalConfirmacao.visivel && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <FaExclamationTriangle size={40} color="#ff4444" style={{ marginBottom: '15px' }} />
            <h3 style={{ color: '#ff4444', marginTop: 0 }}>{modalConfirmacao.titulo}</h3>
            <p style={{ color: '#ccc', fontSize: '1.05rem', marginBottom: '30px', lineHeight: '1.5' }}>
              {modalConfirmacao.mensagem}
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                className="botao" 
                style={{ background: '#444', flex: 1 }} 
                onClick={() => setModalConfirmacao({ visivel: false, acao: null })}
              >
                Cancelar
              </button>
              <button 
                className="botao" 
                style={{ background: '#ff4444', color: '#fff', flex: 1, border: 'none' }} 
                onClick={() => { 
                  modalConfirmacao.acao(); 
                  setModalConfirmacao({ visivel: false, acao: null }); 
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Catalogo;