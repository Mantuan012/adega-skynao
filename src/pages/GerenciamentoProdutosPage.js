import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc, deleteField } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { FaSpinner, FaBan, FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

export default function GerenciamentoProdutosPage() {
  const usuario = auth.currentUser;

  const [isDono, setIsDono] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'sucesso'|'erro', texto: '' }

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) return setIsDono(false);

      const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
      if (userDoc.exists() && userDoc.data().tipo === "admin") {
        setIsDono(true);
        await carregarProdutos();
      } else {
        setIsDono(false);
      }
    };
    carregarDados();
  }, [usuario]);

  const carregarProdutos = async () => {
    const snapshot = await getDocs(collection(db, "produtos"));
    // IMPORTANTE: docId é separado para evitar que campos 'id' dentro do documento sobrescrevam o ID real do Firestore
    setProdutos(snapshot.docs.map(d => ({ docId: d.id, ...d.data() })));
    setLoadingProdutos(false);
  };

  const salvarProduto = async (produto) => {
    setSalvando(true);
    setMensagem(null);
    try {
      // Validação
      const nome = produto.nome?.toString().trim() || '';
      const categoria = produto.categoria?.toString() || '';
      if (!nome || !categoria) {
        throw new Error("Nome e categoria são obrigatórios");
      }

      // Campos opcionais: só incluídos se preenchidos
      const fardoValido = produto.fardo && typeof produto.fardo === 'object';
      const promocaoValida = produto.promocao && typeof produto.promocao === 'object';

      if (editingProduct) {
        // Garante que o ID é sempre a string real do Firestore
        const docId = String(editingProduct.docId || editingProduct.id || '');
        console.log('[DEBUG] editingProduct:', editingProduct);
        console.log('[DEBUG] docId usado no updateDoc:', docId, '| tipo:', typeof docId);
        if (!docId) throw new Error('ID do documento inválido — não foi possível identificar o produto.');

        // UPDATE: usa deleteField() para apagar campos opcionais que foram desmarcados
        const dadosUpdate = {
          nome,
          preco: Number(produto.preco) || 0,
          categoria,
          volume: Number(produto.volume) || 0,
          estoque: Math.floor(Number(produto.estoque)) || 0,
          imagem: produto.imagem?.toString() || '',
          descricao: produto.descricao?.toString() || '',
          fardo: fardoValido
            ? { quantidade: Math.floor(Number(produto.fardo.quantidade)) || 1, preco: Number(produto.fardo.preco) || 0 }
            : deleteField(),
          promocao: promocaoValida
            ? { precoPromocional: Number(produto.promocao.precoPromocional) || 0, descricao: produto.promocao.descricao?.toString() || '' }
            : deleteField(),
        };
        await updateDoc(doc(db, "produtos", docId), dadosUpdate);
      } else {
        // INSERT: addDoc NÃO aceita deleteField() — omite campos opcionais sem valor
        const dadosInsert = {
          nome,
          preco: Number(produto.preco) || 0,
          categoria,
          volume: Number(produto.volume) || 0,
          estoque: Math.floor(Number(produto.estoque)) || 0,
          imagem: produto.imagem?.toString() || '',
          descricao: produto.descricao?.toString() || '',
          ...(fardoValido && { fardo: { quantidade: Math.floor(Number(produto.fardo.quantidade)) || 1, preco: Number(produto.fardo.preco) || 0 } }),
          ...(promocaoValida && { promocao: { precoPromocional: Number(produto.promocao.precoPromocional) || 0, descricao: produto.promocao.descricao?.toString() || '' } }),
        };
        await addDoc(collection(db, "produtos"), dadosInsert);
      }

      await carregarProdutos();
      setEditingProduct(null);
      setShowAddForm(false);
      setMensagem({ tipo: 'sucesso', texto: '✅ Produto salvo com sucesso!' });
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar produto: ' + error.message });
    } finally {
      setSalvando(false);
    }
  };

  const excluirProduto = async (produtoDocId) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      await deleteDoc(doc(db, "produtos", String(produtoDocId)));
      await carregarProdutos();
    }
  };

  const iniciarEdicao = (produto) => {
    setEditingProduct(produto);
    setShowAddForm(false);
  };

  const cancelarEdicao = () => {
    setEditingProduct(null);
    setShowAddForm(false);
  };

  if (isDono === null) return <div className="cartao"><h2><FaSpinner /> Carregando...</h2></div>;
  if (isDono === false) return <div className="cartao"><h2 style={{ color: '#ff4444' }}><FaBan /> Acesso Negado</h2></div>;

  return (
    <div className="cartao">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Gerenciamento de Produtos</h2>
        <button onClick={() => { setShowAddForm(true); setMensagem(null); }} className="botao" disabled={!!editingProduct}>
          <FaPlus /> Adicionar Produto
        </button>
      </div>

      {mensagem && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          backgroundColor: mensagem.tipo === 'sucesso' ? '#0d2b1a' : '#2b0d0d',
          border: `1px solid ${mensagem.tipo === 'sucesso' ? '#00ff66' : '#ff4444'}`,
          color: mensagem.tipo === 'sucesso' ? '#00ff66' : '#ff6666',
          fontWeight: 'bold'
        }}>
          {mensagem.texto}
        </div>
      )}

      {(showAddForm || editingProduct) && (
        <ProductForm
          produto={editingProduct}
          onSave={salvarProduto}
          onCancel={cancelarEdicao}
          salvando={salvando}
        />
      )}

      {loadingProdutos ? (
        <div><FaSpinner /> Carregando produtos...</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {produtos.map((produto) => (
            <div key={produto.docId} style={{ border: '1px solid #333', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#00ff66' }}>{produto.nome}</h3>
                  <p style={{ margin: '0', color: '#ccc' }}>
                    Preço: R$ {Number(produto.preco || 0).toFixed(2)} | Estoque: {produto.estoque} | Categoria: {produto.categoria}
                  </p>
                </div>
                <div>
                  <button onClick={() => iniciarEdicao(produto)} className="botao" style={{ marginRight: '10px' }}>
                    <FaEdit /> Editar
                  </button>
                  <button onClick={() => excluirProduto(produto.docId)} className="botao botao-vermelho">
                    <FaTrash /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({ produto, onSave, onCancel, salvando }) {
  const [formData, setFormData] = useState({
    nome: '',
    preco: 0,
    categoria: '',
    volume: 0,
    estoque: 0,
    imagem: '',
    descricao: '',
    fardo: null,
    promocao: null
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || '',
        preco: produto.preco || 0,
        categoria: produto.categoria || '',
        volume: produto.volume || 0,
        estoque: produto.estoque || 0,
        imagem: produto.imagem || '',
        descricao: produto.descricao || '',
        fardo: produto.fardo || null,
        promocao: produto.promocao || null
      });
    } else {
      setFormData({
        nome: '',
        preco: 0,
        categoria: '',
        volume: 0,
        estoque: 0,
        imagem: '',
        descricao: '',
        fardo: null,
        promocao: null
      });
    }
  }, [produto]);

  const handleSave = () => {
    console.log('[DEBUG] handleSave chamado! formData:', formData);
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'preco' || name === 'volume' || name === 'estoque' ? (parseFloat(value) || 0) : (value || '')
    }));
  };

  const handleFardoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      fardo: {
        ...prev.fardo,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  // Usando div em vez de form para eliminar qualquer interferência de validação HTML5 nativa
  return (
    <div style={{ border: '1px solid #00ff66', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>{produto ? 'Editar Produto' : 'Novo Produto'}</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label>Nome:</label>
          <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
        </div>
        
        <div>
          <label>Preço:</label>
          <input type="number" name="preco" value={formData.preco || 0} onChange={handleChange} step="0.01" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
        </div>
        
        <div>
          <label>Categoria:</label>
          <select name="categoria" value={formData.categoria || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }}>
            <option value="">Selecione...</option>
            <option value="Cervejas">Cervejas</option>
            <option value="Destilados">Destilados</option>
            <option value="Energéticos">Energéticos</option>
            <option value="Refrigerantes">Refrigerantes</option>
            <option value="Ice">Ice</option>
            <option value="Petiscos">Petiscos</option>
            <option value="Tabacaria">Tabacaria</option>
            <option value="Sem Álcool">Sem Álcool</option>
          </select>
        </div>
        
        <div>
          <label>Volume (L):</label>
          <input type="number" name="volume" value={formData.volume || 0} onChange={handleChange} step="0.1" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
        </div>
        
        <div>
          <label>Estoque:</label>
          <input type="number" name="estoque" value={formData.estoque || 0} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
        </div>
        
        <div>
          <label>Imagem (URL):</label>
          <input type="text" name="imagem" value={formData.imagem || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
        </div>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <label>Descrição:</label>
        <textarea name="descricao" value={formData.descricao || ''} onChange={handleChange} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={!!formData.fardo}
            onChange={(e) => setFormData(prev => ({ ...prev, fardo: e.target.checked ? { quantidade: 1, preco: 0 } : null }))}
          />
          {' '}Possui preço de fardo
        </label>
        
        {formData.fardo && (
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <div>
              <label>Quantidade no fardo:</label>
              <input type="number" name="quantidade" value={formData.fardo.quantidade || 1} onChange={handleFardoChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
            </div>
            <div>
              <label>Preço do fardo:</label>
              <input type="number" name="preco" value={formData.fardo.preco || 0} onChange={handleFardoChange} step="0.01" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={!!formData.promocao}
            onChange={(e) => setFormData(prev => ({ ...prev, promocao: e.target.checked ? { precoPromocional: 0, descricao: '' } : null }))}
          />
          {' '}Em promoção
        </label>
        
        {formData.promocao && (
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <div>
              <label>Preço promocional:</label>
              <input type="number" name="precoPromocional" value={formData.promocao.precoPromocional || 0} onChange={(e) => setFormData(prev => ({ ...prev, promocao: { ...prev.promocao, precoPromocional: parseFloat(e.target.value) || 0 } }))} step="0.01" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
            </div>
            <div>
              <label>Descrição da promoção:</label>
              <input type="text" name="descricao" value={formData.promocao.descricao || ''} onChange={(e) => setFormData(prev => ({ ...prev, promocao: { ...prev.promocao, descricao: e.target.value || '' } }))} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#111', color: '#fff' }} />
            </div>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className="botao"
          disabled={salvando}
          style={{ opacity: salvando ? 0.7 : 1 }}
          onClick={handleSave}
        >
          <FaSave /> {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={onCancel} className="botao botao-vermelho" disabled={salvando}>
          <FaTimes /> Cancelar
        </button>
      </div>
    </div>
  );
}