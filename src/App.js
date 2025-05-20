import React, { useState, useEffect } from "react";
import Login from "./Login";
import MenuPedidos from "./MenuPedidos";
import UserInfo from "./UserInfo";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { FaUserCircle } from "react-icons/fa";
import Toast from "./Toast";

const produtos = [
  { id: 1, nome: "Whisky Red Label", preco: 120.0 },
  { id: 2, nome: "Vodka Absolut", preco: 90.0 },
  { id: 3, nome: "Cerveja Heineken 600ml", preco: 12.0 },
  { id: 4, nome: "Gin Tanqueray", preco: 150.0 },
];

function gerarIdPedido() {
  return Math.floor(1000 + Math.random() * 9000);
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(true);
  const [mostrarConta, setMostrarConta] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) showToast("Login realizado com sucesso!");
    });
  }, []);

  const isDono = usuario?.email === "gobboe4@gmail.com";

  const showToast = (msg) => setToastMessage(msg);
  const fecharToast = () => setToastMessage("");

  const mostrarMenuPedidos = () => {
    setMostrarPainel(true);
    setMostrarCatalogo(false);
  };
  const voltarAoCatalogo = () => {
    setMostrarPainel(false);
    setMostrarCatalogo(true);
  };

  const adicionarAoCarrinho = (produto) =>
    setCarrinho((c) => [...c, produto]);
  const removerDoCarrinho = (idx) =>
    setCarrinho((c) => c.filter((_, i) => i !== idx));

  const finalizarPedido = async () => {
    if (!carrinho.length) {
      showToast("Seu carrinho está vazio!");
      return;
    }
    if (!formaPagamento) {
      showToast("Por favor, informe a forma de pagamento.");
      return;
    }
    const idPedido = gerarIdPedido();
    try {
      await addDoc(collection(db, "pedidos"), {
        idPedido,
        usuario: usuario.email,
        userId: usuario.uid,
        itens: carrinho,
        formaPagamento,
        status: "Em Preparo",
        data: new Date().toISOString(),
      });
      setCarrinho([]);
      setFormaPagamento("");
      setPedidoFinalizado(true);
      showToast(`Pedido #${idPedido} criado com sucesso!`);
    } catch (err) {
      showToast("Erro ao salvar pedido: " + err.message);
    }
  };
  const fecharMensagem = () => setPedidoFinalizado(false);

  if (!usuario) return <Login />;

  return (
    <div className="container">
      <div className="painel">
        {/* Cabeçalho */}
        <div className="header-logo">
          <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
          <div>
            <h1>Adega Skynão 🍾</h1>
            <p className="slogan">Rapidez e qualidade na sua festa!</p>
          </div>
        </div>

        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-buttons">
            <button onClick={mostrarMenuPedidos} className="botao">
              Menu de Pedidos
            </button>
            <button onClick={voltarAoCatalogo} className="botao">
              Catálogo
            </button>
          </div>
          <div className="top-bar-actions">
            <button
              onClick={() => signOut(auth)}
              className="botao botao-vermelho"
            >
              Sair
            </button>
            <div
              onClick={() => setMostrarConta((f) => !f)}
              className="icon-perfil"
            >
              <FaUserCircle />
            </div>
          </div>
        </div>

        {mostrarConta && (
          <UserInfo usuario={usuario} fechar={() => setMostrarConta(false)} />
        )}

        {mostrarPainel ? (
          <MenuPedidos isDono={isDono} />
        ) : mostrarCatalogo ? (
          <>
            <h2>Catálogo de Produtos</h2>
            <div className="produtos">
              {produtos.map((p) => (
                <div key={p.id} className="cartao cartao-produto">
                  <h2>{p.nome}</h2>
                  <p>R$ {p.preco.toFixed(2)}</p>
                  <button
                    onClick={() => adicionarAoCarrinho(p)}
                    className="botao"
                  >
                    Adicionar ao Carrinho
                  </button>
                </div>
              ))}
            </div>
            {carrinho.length > 0 && (
              <div className="cartao">
                <h2 className="titulo-principal">🛒 Carrinho</h2>
                <ul className="lista-carrinho">
                  {carrinho.map((item, i) => (
                    <li key={i}>
                      {item.nome} - R$ {item.preco.toFixed(2)}
                      <button
                        onClick={() => removerDoCarrinho(i)}
                        className="botao botao-vermelho"
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>

                <label htmlFor="formaPagamento" style={{ fontWeight: "bold" }}>
                  Forma de Pagamento:
                </label>
                <select
                  id="formaPagamento"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "8px",
                    borderRadius: "6px",
                    border: "1px solid #00ff66",
                    backgroundColor: "#222",
                    color: "#e0e0e0",
                    fontWeight: "600",
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                </select>

                <button
                  onClick={finalizarPedido}
                  className="botao"
                  style={{ marginTop: "12px" }}
                >
                  ✅ Finalizar Pedido
                </button>
              </div>
            )}
          </>
        ) : null}

        {pedidoFinalizado && (
          <div className="cartao">
            <h2 className="titulo-principal">🎉 Pedido Criado!</h2>
            <p>Confira no Menu de Pedidos.</p>
            <button onClick={fecharMensagem} className="botao botao-vermelho">
              Fechar
            </button>
          </div>
        )}

        {toastMessage && <Toast message={toastMessage} onClose={fecharToast} />}
      </div>
    </div>
  );
}

export default App;