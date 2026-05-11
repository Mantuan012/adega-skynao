import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Banner from '../components/Banner';
import { FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from 'react-icons/fa'; 
import { doc, updateDoc, addDoc, deleteDoc, collection, deleteField } from "firebase/firestore";
import { db } from '../firebase/firebaseConfig';
import './Catalogo.css'; 

function Catalogo({ isDono }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  
  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [salvando, setSalvando] = useState(false);
  
  const navigate = useNavigate();
  const { adicionarAoCarrinho, produtos, loadingProdutos } = useCart(); 

  const categorias = ['Todos', 'Cervejas', 'Destilados', 'Energéticos', 'Refrigerantes', 'Ice', 'Petiscos', 'Tabacaria', 'Sem Álcool'];

  const produtosFiltrados = produtos.filter((produto) => {
    const atendeCategoria = categoriaAtiva === 'Todos' || produto.categoria === categoriaAtiva;
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

  const excluirProduto = async (produtoId) => {
    if (window.confirm("Atenção! Tem certeza que deseja excluir este produto do catálogo?")) {
      await deleteDoc(doc(db, "produtos", String(produtoId)));
      setShowModal(false);
    }
  };

  const salvarProduto = async (produtoEditado) => {
    setSalvando(true);
    try {
      const nome = produtoEditado.nome?.toString().trim() || '';
      const categoria = produtoEditado.categoria?.toString() || '';
      if (!nome || !categoria) throw new Error("Nome e categoria são obrigatórios");

      const fardoValido = produtoEditado.fardo && typeof produtoEditado.fardo === 'object';
      const promocaoValida = produtoEditado.promocao && typeof produtoEditado.promocao === 'object';

      if (editingProduct) {
        const docId = String(editingProduct.id || '');
        const dadosUpdate = {
          nome, preco: Number(produtoEditado.preco) || 0, categoria, volume: Number(produtoEditado.volume) || 0,
          estoque: Math.floor(Number(produtoEditado.estoque)) || 0, imagem: produtoEditado.imagem?.toString() || '',
          descricao: produtoEditado.descricao?.toString() || '',
          fardo: fardoValido ? { quantidade: Math.floor(Number(produtoEditado.fardo.quantidade)) || 1, preco: Number(produtoEditado.fardo.preco) || 0 } : deleteField(),
          promocao: promocaoValida ? { precoPromocional: Number(produtoEditado.promocao.precoPromocional) || 0, descricao: produtoEditado.promocao.descricao?.toString() || '' } : deleteField(),
        };
        await updateDoc(doc(db, "produtos", docId), dadosUpdate);
      } else {
        const dadosInsert = {
          nome, preco: Number(produtoEditado.preco) || 0, categoria, volume: Number(produtoEditado.volume) || 0,
          estoque: Math.floor(Number(produtoEditado.estoque)) || 0, imagem: produtoEditado.imagem?.toString() || '',
          descricao: produtoEditado.descricao?.toString() || '',
          ...(fardoValido && { fardo: { quantidade: Math.floor(Number(produtoEditado.fardo.quantidade)) || 1, preco: Number(produtoEditado.fardo.preco) || 0 } }),
          ...(promocaoValida && { promocao: { precoPromocional: Number(produtoEditado.promocao.precoPromocional) || 0, descricao: produtoEditado.promocao.descricao?.toString() || '' } }),
        };
        await addDoc(collection(db, "produtos"), dadosInsert);
      }
      setShowModal(false);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loadingProdutos) return <div className="catalogo-container"><h2 style={{color: '#00ff66', textAlign: 'center'}}>Carregando catálogo...</h2></div>;

  return (
    <div className="catalogo-container">
      <Banner onBannerClick={() => navigate('/combos')} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h2 className="catalogo-titulo" style={{ margin: 0 }}>Catálogo de Produtos</h2>
        {isDono && (
           <button onClick={iniciarNovoProduto} className="botao" style={{ marginBottom: '20px', padding: '10px 20px' }}>
             <FaPlus /> Adicionar Produto
           </button>
        )}
      </div>

      <div className="busca-container">
        <input type="text" placeholder="O que você procura hoje?" value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="busca-input" />
      </div>

      <div className="categorias-container">
        {categorias.map((cat) => (
          <button key={cat} className={`categoria-btn ${categoriaAtiva === cat ? 'ativo' : ''}`} onClick={() => setCategoriaAtiva(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <div className="produtos-grid">
        {produtosFiltrados.map((produto) => (
          <div key={produto.id} className="produto-card">
            
            {/* CANETA LARANJA RESTAURADA */}
            {isDono && (
              <button className="btn-editar-admin" onClick={(e) => iniciarEdicao(produto, e)}>
                <FaEdit />
              </button>
            )}

            <div className="produto-info-clicavel" onClick={() => navigate(`/produto/${produto.id}`)}>
              <img src={produto.imagem} alt={produto.nome} className="produto-imagem" />
              <h3 className="produto-nome">{produto.nome}</h3>
              <p className="produto-preco">
                {produto.promocao ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#888' }}>R$ {produto.preco.toFixed(2)}</span>
                    <span style={{ color: '#ff4444', fontWeight: 'bold' }}> R$ {produto.promocao.precoPromocional.toFixed(2)}</span>
                  </>
                ) : (
                  `R$ ${produto.preco.toFixed(2)}`
                )}
              </p>
              {produto.estoque <= 5 && produto.estoque > 0 && <p className="produto-alerta-estoque">Restam apenas {produto.estoque}!</p>}
            </div>
            
            <button className="btn-adicionar" disabled={produto.estoque === 0} onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(produto); }}>
              {produto.estoque === 0 ? 'Esgotado' : 'Adicionar'}
            </button>
          </div>
        ))}
      </div>
      
      {produtosFiltrados.length === 0 && <p className="mensagem-vazio">Nenhum produto encontrado.</p>}

      {/* MODAL PROFISSIONAL DE EDIÇÃO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-produto-conteudo">
             <ProductForm 
                produto={editingProduct} 
                onSave={salvarProduto} 
                onCancel={() => setShowModal(false)} 
                onDelete={() => excluirProduto(editingProduct.id)} 
                salvando={salvando} 
             />
          </div>
        </div>
      )}
    </div>
  );
}

// FORMULÁRIO ESTRUTURADO E ESTILIZADO
function ProductForm({ produto, onSave, onCancel, onDelete, salvando }) {
  const [formData, setFormData] = useState({
    nome: produto?.nome || '', preco: produto?.preco || 0, categoria: produto?.categoria || '',
    volume: produto?.volume || 0, estoque: produto?.estoque || 0, imagem: produto?.imagem || '',
    descricao: produto?.descricao || '', fardo: produto?.fardo || null, promocao: produto?.promocao || null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'preco' || name === 'volume' || name === 'estoque' ? (parseFloat(value) || 0) : (value || '') }));
  };

  const handleFardoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, fardo: { ...prev.fardo, [name]: parseFloat(value) || 0 } }));
  };

  const handlePromocaoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, promocao: { ...prev.promocao, [name]: name === 'precoPromocional' ? (parseFloat(value) || 0) : value } }));
  };

  return (
    <div>
      <h3 className="modal-produto-titulo">{produto ? 'Editar Produto' : 'Novo Produto'}</h3>
      
      <div className="form-grid-produtos">
        <div className="form-group">
          <label className="form-label">Nome da Bebida:</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-input" placeholder="Ex: Cerveja Brahma 350ml" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Preço Unitário (R$):</label>
          <input type="number" name="preco" value={formData.preco} onChange={handleChange} step="0.01" className="form-input" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Categoria:</label>
          <select name="categoria" value={formData.categoria} onChange={handleChange} className="form-input">
            <option value="">Selecione...</option>
            {['Cervejas', 'Destilados', 'Energéticos', 'Refrigerantes', 'Ice', 'Petiscos', 'Tabacaria', 'Sem Álcool'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Estoque Atual:</label>
          <input type="number" name="estoque" value={formData.estoque} onChange={handleChange} className="form-input" />
        </div>

        <div className="form-group">
          <label className="form-label">Volume (L ou ML):</label>
          <input type="number" name="volume" value={formData.volume} onChange={handleChange} step="0.1" className="form-input" placeholder="Ex: 0.35 para 350ml" />
        </div>
        
        <div className="form-group form-group-full">
          <label className="form-label">Link da Imagem (URL):</label>
          <input type="text" name="imagem" value={formData.imagem} onChange={handleChange} className="form-input" placeholder="Cole o link da foto aqui..." />
        </div>

        <div className="form-group form-group-full">
          <label className="form-label">Descrição (Opcional):</label>
          <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows="2" className="form-input" placeholder="Detalhes do produto..."></textarea>
        </div>
      </div>

      {/* SESSÃO DE FARDO E PROMOÇÃO */}
      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ff66', marginBottom: '15px' }}>
        <label className="form-checkbox-label">
          <input type="checkbox" checked={!!formData.fardo} onChange={(e) => setFormData(prev => ({ ...prev, fardo: e.target.checked ? { quantidade: 12, preco: 0 } : null }))} />
          Vender em Fardo / Caixa
        </label>
        
        {formData.fardo && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label className="form-label">Unidades no Fardo:</label>
              <input type="number" name="quantidade" value={formData.fardo.quantidade} onChange={handleFardoChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Preço do Fardo (R$):</label>
              <input type="number" name="preco" value={formData.fardo.preco} onChange={handleFardoChange} step="0.01" className="form-input" />
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ffaa00' }}>
        <label className="form-checkbox-label" style={{ color: '#ffaa00' }}>
          <input type="checkbox" checked={!!formData.promocao} onChange={(e) => setFormData(prev => ({ ...prev, promocao: e.target.checked ? { precoPromocional: 0, descricao: '' } : null }))} />
          Ativar Promoção
        </label>
        
        {formData.promocao && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label className="form-label">Preço com Desconto (R$):</label>
              <input type="number" name="precoPromocional" value={formData.promocao.precoPromocional} onChange={handlePromocaoChange} step="0.01" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Etiqueta (Ex: Black Friday):</label>
              <input type="text" name="descricao" value={formData.promocao.descricao} onChange={handlePromocaoChange} className="form-input" />
            </div>
          </div>
        )}
      </div>
      
      <div className="botoes-form-produto">
        <button type="button" className="botao" disabled={salvando} onClick={() => onSave(formData)} style={{ flex: 2, padding: '15px', fontSize: '1.1rem' }}>
          <FaSave /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={onCancel} className="botao botao-vermelho" disabled={salvando} style={{ flex: 1 }}>
          <FaTimes /> Cancelar
        </button>
        {produto && (
           <button type="button" onClick={onDelete} className="botao" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #ff4444', color: '#ff4444' }} disabled={salvando}>
             <FaTrash /> Excluir
           </button>
        )}
      </div>
    </div>
  );
}

export default Catalogo;