import React from "react";
import { FaGift } from 'react-icons/fa'; 

const combos = [
  {
    id: 'combo1',
    nome: "Combo Esquenta Absolut",
    descricao: "1 Vodka Absolut 1L + 2 Sucos Frupic",
    imagem: "/images/VodkaAbsolut.png", 
    preco: 95.00, 
    itens: [
      { id: 81, qtd: 1 },  
      { id: 30, qtd: 2 }   
    ]
  },
  {
    id: 'combo2',
    nome: "Combo Red Label Turbinado",
    descricao: "1 Whisky Red Label + 4 Red Bull 250ml",
    imagem: "/images/RedLabel.png", 
    preco: 145.00, 
    itens: [
      { id: 80, qtd: 1 },  
      { id: 57, qtd: 4 }   
    ]
  },
  {
    id: 'combo3',
    nome: "Combo Corote Squad",
    descricao: "4 Ice Corotes (Limão, Pink Lemonade, Tropicália e Mango Jungle)",
    imagem: "/images/IceCoroteTropicalia.png", 
    preco: 18.00, 
    itens: [
      { id: 66, qtd: 1 }, 
      { id: 67, qtd: 1 }, 
      { id: 69, qtd: 1 }, 
      { id: 70, qtd: 1 }  
    ]
  }
];

function CombosPage({ onVoltar, adicionarComboAoCarrinho }) {
  return (
    <div className="">
      <div className="cartao">
        <h2 
          className="titulo-principal"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            marginBottom: '30px'
          }}
        >
          <FaGift /> Combos e Promoções
        </h2>
        
        <button onClick={onVoltar} className="botao" style={{ marginBottom: '20px' }}>
          &larr; Voltar ao Catálogo
        </button>

        <div className="produtos">
          {combos.map((combo) => (
            <div key={combo.id} className="cartao cartao-produto" style={{borderColor: '#FFD700'}}>
              
              <div style={{
                backgroundColor: '#FFD700', 
                color: '#000', 
                fontWeight: 'bold', 
                padding: '5px 10px', 
                borderRadius: '4px',
                display: 'inline-block',
                marginBottom: '10px'
              }}>
                OFERTA ESPECIAL
              </div>

              <img src={combo.imagem} alt={combo.nome} className="imagem-produto" />
              
              <h2 style={{color: '#FFD700'}}>{combo.nome}</h2>
              <p style={{color: '#ccc', minHeight: '40px'}}>{combo.descricao}</p>
              
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', margin: '10px 0' }}>
                R$ {combo.preco.toFixed(2)}
              </p>

              <button 
                className="botao"
                style={{width: '100%', backgroundImage: 'linear-gradient(to right, #b8860b, #ffd700)'}}
                onClick={() => adicionarComboAoCarrinho(combo)}
              >
                EU QUERO! 
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default CombosPage;