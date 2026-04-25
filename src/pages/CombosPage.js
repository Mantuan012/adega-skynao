import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { FaGift, FaArrowLeft } from 'react-icons/fa'; 

// Lista de combos (pode manter aqui ou mover para um arquivo de data)
const combos = [
  {
    id: 'combo1',
    nome: "Combo Esquenta Absolut",
    descricao: "1 Vodka Absolut 1L + 2 Sucos Frupic",
    imagem: "/images/VodkaAbsolut.png", 
    preco: 95.00, 
    itens: [{ id: 81, qtd: 1 }, { id: 30, qtd: 2 }]
  },
  {
    id: 'combo2',
    nome: "Combo Red Label Turbinado",
    descricao: "1 Whisky Red Label + 4 Red Bull 250ml",
    imagem: "/images/RedLabel.png", 
    preco: 145.00, 
    itens: [{ id: 80, qtd: 1 }, { id: 57, qtd: 4 }]
  },
  {
    id: 'combo3',
    nome: "Combo Corote Squad",
    descricao: "4 Ice Corotes (Limão, Pink Lemonade, Tropicália e Mango Jungle)",
    imagem: "/images/IceCoroteTropicalia.png", 
    preco: 18.00, 
    itens: [{ id: 66, qtd: 1 }, { id: 67, qtd: 1 }, { id: 68, qtd: 1 }, { id: 69, qtd: 1 }]
  }
];

function CombosPage() {
  const navigate = useNavigate(); // Hook para navegar
  const { adicionarComboAoCarrinho } = useCart(); // Hook para o carrinho

  return (
    <div className="cartao">
      <h2 className="titulo-principal" style={{ color: '#FFD700' }}>
        <FaGift /> Combos Exclusivos
      </h2>

      {/* BOTÃO CONSERTADO: Agora ele navega sozinho para o catálogo */}
      <button 
        onClick={() => navigate('/catalogo')} 
        className="botao" 
        style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#444' }}
      >
        <FaArrowLeft /> Voltar ao Catálogo
      </button>

      <div className="produtos-grid">
        {combos.map((combo) => (
          <div key={combo.id} className="produto-card" style={{ borderColor: '#FFD700', borderStyle: 'double' }}>
            <div style={{
              backgroundColor: '#FFD700', 
              color: '#000', 
              fontWeight: 'bold', 
              padding: '5px 10px', 
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '10px',
              fontSize: '0.8rem'
            }}>
              OFERTA ESPECIAL
            </div>

            <img src={combo.imagem} alt={combo.nome} className="produto-imagem" />
            
            <h3 style={{ color: '#FFD700' }}>{combo.nome}</h3>
            <p style={{ color: '#ccc', fontSize: '0.9rem', minHeight: '40px' }}>{combo.descricao}</p>
            
            <p className="produto-preco" style={{ color: '#fff' }}>
              R$ {combo.preco.toFixed(2)}
            </p>

            <button 
              className="btn-adicionar"
              style={{ background: 'linear-gradient(to right, #b8860b, #ffd700)', color: '#000' }}
              onClick={() => adicionarComboAoCarrinho(combo)}
            >
              Adicionar Combo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CombosPage;