import React from "react";

// (Removemos o const styles = {...} e vamos usar o estilo.css)

function ProductDetailPage({ produto, onVoltar, onAdicionarAoCarrinho }) {
  
  if (!produto) {
    return (
      <div className="cartao">
        <button onClick={onVoltar} className="botao botao-vermelho" style={{ marginBottom: '20px' }}>
          &larr; Voltar
        </button>
        <h2 className="titulo-principal">Produto não encontrado</h2>
      </div>
    );
  }

  // Verifica se há estoque
  const semEstoque = produto.estoque <= 0;

  return (
    <div>
      {/* Botão para voltar ao catálogo (usando classes CSS) */}
      <button onClick={onVoltar} className="botao" style={{ marginBottom: '20px' }}>
        &larr; Voltar ao Catálogo
      </button>

      {/* Usando a classe .cartao para manter a consistência */}
      <div className="cartao" style={{ display: 'flex', gap: '30px' }}>
        
        {/* Imagem do Produto (usando classe CSS) */}
        <img 
          src={produto.imagem} 
          alt={produto.nome} 
          // Reaplicando o estilo de imagem, mas poderia ser uma classe nova
          style={{ 
            width: '40%', 
            maxWidth: '400px', 
            height: 'auto', 
            objectFit: 'cover', 
            borderRadius: '8px', 
            border: '1px solid #00ff66' 
          }} 
        />

        {/* Informações do Produto */}
        <div style={{ flex: 1 }}>
          {/* Usando a classe .titulo-principal */}
          <h2 className="titulo-principal" style={{ textAlign: 'left', fontSize: '2.5rem' }}>
            {produto.nome}
          </h2>

          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: '10px 0' }}>
            R$ {produto.preco.toFixed(2)}
          </p>
          
          <p style={{ fontSize: '1.1rem', color: '#a0ffa0', margin: '10px 0 20px 0' }}>
            {semEstoque 
              ? "Produto esgotado" 
              : `Disponível: ${produto.estoque} unidades`
            }
          </p>

          <p style={{ fontSize: '1rem', color: '#e0e0e0', lineHeight: 1.6, margin: '20px 0' }}>
            {/* Descrição Padrão */}
            Descrição detalhada do produto. Ideal para informar sobre o sabor, 
            origem, teor alcoólico e sugestões de harmonização.
          </p>
          
          {/* Botão (usando classes CSS) */}
          <button
            onClick={() => onAdicionarAoCarrinho(produto)}
            className="botao"
            disabled={semEstoque} 
          >
            {semEstoque ? "Esgotado" : "Adicionar ao Carrinho"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;