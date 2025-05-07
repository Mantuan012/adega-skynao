import React, { useState, useEffect } from "react";
import Login from './Login';
import PainelAdega from "./PainelAdega";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

const produtos = [
  { id: 1, nome: "Whisky Red Label", preco: 120.0 },
  { id: 2, nome: "Vodka Absolut", preco: 90.0 },
  { id: 3, nome: "Cerveja Heineken 600ml", preco: 12.0 },
  { id: 4, nome: "Gin Tanqueray", preco: 150.0 }
];

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [mostrarPainel, setMostrarPainel] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
  }, []);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho([...carrinho, produto]);
  };

  const removerDoCarrinho = (index) => {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    setCarrinho(novoCarrinho);
  };

  const finalizarPedido = async () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    try {
      await addDoc(collection(db, "pedidos"), {
        usuario: usuario.email,
        itens: carrinho,
        status: "Pendente",
        data: new Date().toISOString()
      });
      setCarrinho([]);
      setPedidoFinalizado(true);
      alert("Pedido realizado com sucesso!");
    } catch (error) {
      alert("Erro ao salvar pedido: " + error.message);
    }
  };

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="container">
      <div className="painel">
      <div className="header-logo">
      <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
      <div>
        <h1>Adega Skynão 🍾</h1>
        <p className="slogan">Rapidez e qualidade na sua festa!</p>
      </div>
    </div>
  

        <div style={{ display: 'flex', justifyContent: 'end', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setMostrarPainel(!mostrarPainel)} className="botao botao-azul">
            {mostrarPainel ? "Voltar ao Catálogo" : "Painel da Adega"}
          </button>
          <button onClick={() => signOut(auth)} className="botao botao-vermelho">
            Sair
          </button>
        </div>

        {mostrarPainel ? (
          <PainelAdega />
        ) : pedidoFinalizado ? (
          <div className="cartao">
            <h2 className="titulo-principal">🎉 Pedido Finalizado com Sucesso!</h2>
            <p>Obrigado por comprar na Adega Skynão! 🍻</p>
          </div>
        ) : (
          <>
            <div className="produtos">
              {produtos.map((produto) => (
                <div key={produto.id} className="cartao cartao-produto">
                  <h2>{produto.nome}</h2>
                  <p>R$ {produto.preco.toFixed(2)}</p>
                  <button onClick={() => adicionarAoCarrinho(produto)} className="botao botao-azul">
                    Adicionar ao Carrinho
                  </button>
                </div>
              ))}
            </div>

            <div className="cartao">
              <h2 className="titulo-principal">🛒 Carrinho</h2>
              {carrinho.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
              ) : (
                <>
                  <ul className="lista-carrinho">
                    {carrinho.map((item, index) => (
                      <li key={index}>
                        {item.nome} - R$ {item.preco.toFixed(2)}
                        <button onClick={() => removerDoCarrinho(index)} className="botao botao-vermelho">
                          ❌
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={finalizarPedido} className="botao botao-verde">
                    ✅ Finalizar Pedido
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;