import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Banner from '../components/Banner';
import './Catalogo.css'; 

function Catalogo() {
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  
  const navigate = useNavigate();
  const { adicionarAoCarrinho, produtos, loadingProdutos } = useCart();

  const categorias = ['Todos', 'Cervejas', 'Destilados', 'Energéticos', 'Refrigerantes', 'Ice', 'Petiscos', 'Tabacaria', 'Sem Álcool'];

  const produtosFiltrados = produtos.filter((produto) => {
    const atendeCategoria = categoriaAtiva === 'Todos' || produto.categoria === categoriaAtiva;
    const atendeBusca = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    return atendeCategoria && atendeBusca;
  });

  if (loadingProdutos) {
    return <div className="catalogo-container"><h2>Carregando catálogo...</h2></div>;
  }

  return (
    <div className="catalogo-container">
      
      {/* BANNER RESTAURADO */}
      <Banner onBannerClick={() => navigate('/combos')} />

      <h2 className="catalogo-titulo">Catálogo de Produtos</h2>

      {/* BARRA DE BUSCA */}
      <div className="busca-container">
        <input
          type="text"
          placeholder="O que você procura hoje?"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="busca-input"
        />
      </div>

      {/* FILTROS DE CATEGORIA */}
      <div className="categorias-container">
        {categorias.map((cat) => (
          <button
            key={cat}
            className={`categoria-btn ${categoriaAtiva === cat ? 'ativo' : ''}`}
            onClick={() => setCategoriaAtiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="produtos-grid">
        {produtosFiltrados.map((produto) => (
          <div key={produto.id} className="produto-card">
            <div className="produto-info-clicavel" onClick={() => navigate(`/produto/${produto.id}`)}>
              <img src={produto.imagem} alt={produto.nome} className="produto-imagem" />
              <h3 className="produto-nome">{produto.nome}</h3>
              <p className="produto-preco">
                {produto.promocao ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: '#888' }}>R$ {produto.preco.toFixed(2)}</span>
                    <span style={{ color: '#ff4444', fontWeight: 'bold' }}> R$ {produto.promocao.precoPromocional.toFixed(2)}</span>
                    {produto.promocao.descricao && <span style={{ color: '#ffaa00', fontSize: '0.8em' }}> - {produto.promocao.descricao}</span>}
                  </>
                ) : (
                  `R$ ${produto.preco.toFixed(2)}`
                )}
              </p>
              {produto.estoque <= 5 && produto.estoque > 0 && (
                <p className="produto-alerta-estoque">Restam apenas {produto.estoque}!</p>
              )}
            </div>
            
            <button
              className="btn-adicionar"
              disabled={produto.estoque === 0}
              onClick={(e) => {
                e.stopPropagation(); 
                adicionarAoCarrinho(produto);
              }}
            >
              {produto.estoque === 0 ? 'Esgotado' : 'Adicionar'}
            </button>
          </div>
        ))}
      </div>
      
      {produtosFiltrados.length === 0 && (
        <p className="mensagem-vazio">Nenhum produto encontrado para "{termoBusca}".</p>
      )}
    </div>
  );
}

export default Catalogo;