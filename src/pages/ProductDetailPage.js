import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useCart } from '../contexts/CartContext';
import { FaArrowLeft, FaCartPlus } from 'react-icons/fa';

function ProductDetailPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { adicionarAoCarrinho } = useCart();
  
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarProduto = async () => {
      try {
        const docRef = doc(db, "produtos", String(id));
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduto({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProduto(null); 
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarProduto();
  }, [id]);

  if (loading) {
    return <div style={{ color: '#00ff66', textAlign: 'center', marginTop: '10%' }}>Carregando detalhes do produto...</div>;
  }

  if (!produto) {
    return (
      <div className="cartao" style={{ textAlign: 'center', padding: '40px', marginTop: '20px' }}>
        <h2 style={{ color: '#ff4444' }}>Produto não encontrado</h2>
        <p style={{ color: '#aaa' }}>Esta bebida pode ter sido removida do nosso catálogo.</p>
        <button onClick={() => navigate('/catalogo')} className="botao botao-vermelho" style={{ marginTop: '20px' }}>
          <FaArrowLeft /> Voltar ao Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="cartao" style={{ marginTop: '20px', padding: '30px', position: 'relative' }}>
      
      {/* Botão Voltar no Canto */}
      <button 
        onClick={() => navigate('/catalogo')} 
        className="botao" 
        style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', padding: '10px 15px' }}
      >
        <FaArrowLeft /> Voltar
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}>
        
        {/* Lado Esquerdo: Imagem da Bebida */}
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', backgroundColor: '#fff', borderRadius: '12px', padding: '20px' }}>
          {produto.imagem ? (
            <img 
              src={produto.imagem} 
              alt={produto.nome} 
              style={{ width: '100%', maxWidth: '250px', height: 'auto', objectFit: 'contain' }} 
            />
          ) : (
            <div style={{ width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              Sem imagem
            </div>
          )}
        </div>

        {/* Lado Direito: Informações e Compra */}
        <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h1 style={{ color: '#00ff66', margin: '0', fontSize: '2.5rem' }}>{produto.nome}</h1>
          
          <p style={{ color: '#ccc', fontSize: '1.1rem', lineHeight: '1.6' }}>
            {produto.descricao || "Bebida geladinha pronta para sua festa! O item perfeito para o seu carrinho."}
          </p>

          <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00ff66', marginTop: '10px' }}>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', margin: '0 0 10px 0' }}>R$ {produto.preco?.toFixed(2)}</h2>
            <p style={{ margin: 0, color: produto.estoque > 0 ? '#00cc44' : '#ff4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {produto.estoque > 0 ? `✅ ${produto.estoque} unidades em estoque` : "❌ Esgotado!"}
            </p>
          </div>

          <button 
            onClick={() => adicionarAoCarrinho(produto)} 
            disabled={produto.estoque <= 0}
            className="botao" 
            style={{ 
              marginTop: '15px', 
              padding: '18px', 
              fontSize: '1.3rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '10px',
              backgroundColor: produto.estoque > 0 ? '#00a64d' : '#444',
              cursor: produto.estoque > 0 ? 'pointer' : 'not-allowed',
              opacity: produto.estoque > 0 ? 1 : 0.7
            }}
          >
            <FaCartPlus /> {produto.estoque > 0 ? "Adicionar ao Carrinho" : "Sem Estoque"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductDetailPage;