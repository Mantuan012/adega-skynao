import React, { useState } from "react";
import Banner from "../components/Banner";
import { FaSearch, FaClock } from "react-icons/fa";
import { produtos } from "../data/Produtos";

export default function Catalogo({ mostrarPaginaCombos, mostrarDetalhesProduto, adicionarAoCarrinho }) {
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");

  const categorias = ["Todos", "Cervejas", "Destilados", "Energéticos", "Refrigerantes", "Ice", "Petiscos", "Tabacaria", "Sem Álcool"];

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = categoriaSelecionada === "Todos" || produto.categoria === categoriaSelecionada;
    const matchBusca = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  return (
    <>
      <Banner onBannerClick={mostrarPaginaCombos} />
      <h2 className="titulo-principal">Catálogo de Produtos</h2>

      <div style={{ marginBottom: '20px', padding: '0 10px' }}>
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <FaSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#00ff66' }} />
          <input 
            type="text" 
            placeholder="O que você procura hoje?" 
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{
              width: '100%', padding: '10px 10px 10px 35px', borderRadius: '20px',
              border: '1px solid #00ff66', backgroundColor: '#222', color: '#fff',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaSelecionada(cat)}
              className="botao"
              style={{
                whiteSpace: 'nowrap',
                backgroundColor: categoriaSelecionada === cat ? '#00ff66' : '#222',
                color: categoriaSelecionada === cat ? '#000' : '#fff',
                border: '1px solid #00ff66', padding: '8px 15px',
                borderRadius: '15px', fontSize: '0.9rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="produtos">
        {produtosFiltrados.length > 0 ? (
          produtosFiltrados.map((p) => (
            <div key={p.id} className="cartao cartao-produto" onClick={() => mostrarDetalhesProduto(p)}>
              <img src={p.imagem} alt={p.nome} className="imagem-produto" />
              <h2>{p.nome}</h2>
              <p>R$ {p.preco.toFixed(2)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation(); 
                  adicionarAoCarrinho(p);
                }}
                className="botao"
                disabled={p.estoque === 0}
              >
                {p.estoque === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
              </button>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
            {categoriaSelecionada === "Tabacaria" ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                <FaClock style={{ fontSize: '3rem', color: '#00ff66' }} />
                <div>
                  <h3 style={{ color: '#00ff66', fontSize: '1.5rem', margin: '0 0 10px 0' }}>Em breve novidades!</h3>
                  <p style={{ color: '#ccc', fontSize: '1rem', margin: 0 }}>Estamos preparando uma seleção especial para esta seção.</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '1.2rem', color: '#888' }}>Nenhum produto encontrado. 😢</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}