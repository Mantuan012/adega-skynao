import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useCart } from '../contexts/CartContext';
import { FaArrowLeft, FaCartPlus } from 'react-icons/fa';
import './ProductDetailPage.css'; // Importando o novo CSS!

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
    return <div className="produto-loading">Carregando detalhes do produto...</div>;
  }

  if (!produto) {
    return (
      <div className="cartao produto-nao-encontrado">
        <h2>Produto não encontrado</h2>
        <p>Esta bebida pode ter sido removida do nosso catálogo.</p>
        <button onClick={() => navigate('/catalogo')} className="botao botao-vermelho">
          <FaArrowLeft /> Voltar ao Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="cartao produto-detalhe-container">
      
      {/* Botão Voltar no Canto */}
      <button onClick={() => navigate('/catalogo')} className="botao btn-voltar-detalhe">
        <FaArrowLeft /> Voltar
      </button>

      <div className="produto-detalhe-conteudo">
        
        {/* Lado Esquerdo: Imagem da Bebida */}
        <div className="produto-imagem-wrapper">
          {produto.imagem ? (
            <img src={produto.imagem} alt={produto.nome} />
          ) : (
            <div className="produto-sem-imagem">Sem imagem</div>
          )}
        </div>

        {/* Lado Direito: Informações e Compra */}
        <div className="produto-info-wrapper">
          <h1 className="produto-titulo-detalhe">{produto.nome}</h1>
          
          <p className="produto-descricao-detalhe">
            {produto.descricao || "Bebida geladinha pronta para sua festa! O item perfeito para o seu carrinho."}
          </p>

          <div className="produto-preco-box">
            <h2 className="produto-preco-valor">R$ {produto.preco?.toFixed(2)}</h2>
            <p className={`produto-estoque-status ${produto.estoque > 0 ? 'estoque-disponivel' : 'estoque-esgotado'}`}>
              {produto.estoque > 0 ? `✅ ${produto.estoque} unidades em estoque` : "❌ Esgotado!"}
            </p>
          </div>

          <button 
            onClick={() => adicionarAoCarrinho(produto)} 
            disabled={produto.estoque <= 0}
            className="botao btn-adicionar-carrinho"
          >
            <FaCartPlus /> {produto.estoque > 0 ? "Adicionar ao Carrinho" : "Sem Estoque"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductDetailPage;