import React from "react";

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

  const semEstoque = produto.estoque <= 0;

  return (
    <div>
      <button onClick={onVoltar} className="botao" style={{ marginBottom: '20px' }}>
        &larr; Voltar ao Catálogo
      </button>

      <div className="cartao" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        <img 
          src={produto.imagem} 
          alt={produto.nome} 
          style={{ 
            width: '100%', 
            maxWidth: '400px', 
            height: 'auto', 
            objectFit: 'cover', 
            borderRadius: '8px', 
            border: '1px solid #00ff66' 
          }} 
        />

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 className="titulo-principal" style={{ textAlign: 'left', fontSize: '2.5rem' }}>
            {produto.nome}
          </h2>

          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: '10px 0' }}>
            R$ {produto.preco.toFixed(2)}
          </p>

          {/* --- AVISO DE FARDO (Se houver) --- */}
          {produto.fardo && (
            <div style={{
              backgroundColor: '#FFD700',
              color: '#000',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 'bold',
              marginBottom: '15px',
              display: 'inline-block'
            }}>
              🔥 LEVE O FARDO ({produto.fardo.quantidade} UN) POR R$ {produto.fardo.preco.toFixed(2)}!
            </div>
          )}
          {/* ---------------------- */}
          
          <p style={{ fontSize: '1.1rem', color: '#a0ffa0', margin: '10px 0 20px 0' }}>
            {semEstoque 
              ? "Produto esgotado" 
              : `Disponível: ${produto.estoque} unidades`
            }
          </p>

          {/* --- DESCRIÇÃO DINÂMICA --- */}
          <p style={{ fontSize: '1rem', color: '#e0e0e0', lineHeight: 1.6, margin: '20px 0' }}>
            {produto.descricao || "Descrição não disponível para este produto."}
          </p>
          {/* ------------------------- */}
          
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