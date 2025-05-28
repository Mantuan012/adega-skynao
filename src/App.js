import React, { useState, useEffect } from "react";
import Login from "./Login";
import MenuPedidos from "./MenuPedidos";
import UserInfo from "./UserInfo";
import Dashboard from "./Dashboard";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { FaUserCircle } from "react-icons/fa";
import Toast from "./Toast";

const produtos = [
  { id: 1, nome: "Whisky Red Label", preco: 120.0, imagem: "/images/RedLabel.png" },
  { id: 2, nome: "Vodka Absolut", preco: 90.0, imagem: "/images/VodkaAbsolut.png" },
  { id: 3, nome: "Heineken 600ml", preco: 12.0, imagem: "/images/Heineken600ml.png" },
  { id: 4, nome: "Coca-Cola 2L", preco: 8.0, imagem: "/images/CocaCola2L.png" },
  { id: 5, nome: "Fanta Laranja 1,5L", preco: 7.0, imagem: "/images/FantaLaranja1,5L.jpg" },
  { id: 6, nome: "Sprite 2L", preco: 7.0, imagem: "/images/Sprite2L.jpg" },
  { id: 7, nome: "Red Bull 250ml", preco: 15.0, imagem: "/images/RedBull250ml.jpg" },
  { id: 8, nome: "Monster 500ml", preco: 12.0, imagem: "/images/Monster500ml.jpg" },
  { id: 9, nome: "TNT 350ml", preco: 10.0, imagem: "/images/TNT350ml.png" },
  { id: 10, nome: "Skol 350ml", preco: 5.0, imagem: "/images/Skol350ml.jpg" },
  { id: 11, nome: "Budweiser 350ml", preco: 7.0, imagem: "/images/Budweiser350ml.jpg" },
  { id: 12, nome: "Corona 330ml", preco: 10.0, imagem: "/images/Corona330ml.jpg" },
  { id: 13, nome: "Stella Artois 330ml", preco: 9.0, imagem: "/images/StellaArtois330ml.jpg" },
  { id: 14, nome: "Heineken 330ml", preco: 9.0, imagem: "/images/Heineken330ml.jpg" },
  { id: 15, nome: "Cachaça 51", preco: 30.0, imagem: "/images/Cachaça51.jpg" },
  { id: 16, nome: "Monster Ultra 500ml", preco: 12.0, imagem: "/images/MonsterUltra.jpg" }
];

function gerarIdPedido() {
  return Math.floor(1000 + Math.random() * 9000);
}

function App() {
  const FRETE_FIXO = 3.00;

  const [usuario, setUsuario] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(true);
  const [mostrarConta, setMostrarConta] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) showToast("Login realizado com sucesso!");
    });
  }, []);

  const isDono = usuario?.email === "pesquisaciencia012@gmail.com";

  const showToast = (msg) => setToastMessage(msg);
  const fecharToast = () => setToastMessage("");

  const mostrarMenuPedidos = () => {
    setMostrarPainel(true);
    setMostrarCatalogo(false);
    setMostrarDashboard(false);
  };
  const voltarAoCatalogo = () => {
    setMostrarPainel(false);
    setMostrarCatalogo(true);
    setMostrarDashboard(false);
  };

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((c) => [...c, produto]);
    showToast(`🛒 ${produto.nome} adicionado ao carrinho!`);
  };

  const removerDoCarrinho = (idx) =>
    setCarrinho((c) => c.filter((_, i) => i !== idx));

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.preco, 0);
  const totalComFrete = totalCarrinho + FRETE_FIXO;

  const finalizarPedido = async () => {
    if (!carrinho.length) {
      showToast("Seu carrinho está vazio!");
      return;
    }
    if (!formaPagamento) {
      showToast("Por favor, informe a forma de pagamento.");
      return;
    }

    const userRef = doc(db, "usuarios", usuario.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      showToast("Complete suas informações antes de fazer pedidos.");
      setMostrarConta(true);
      return;
    }

    const dadosUsuario = userSnap.data();
    if (!dadosUsuario.nome || !dadosUsuario.endereco || !dadosUsuario.telefone) {
      showToast("Complete suas informações antes de fazer pedidos.");
      setMostrarConta(true);
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
        total: totalComFrete,
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
        <div className="header-logo">
          <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
          <div>
            <h1>Adega Skynão 🍾</h1>
            <p className="slogan">Rapidez e qualidade na sua festa!</p>
          </div>
        </div>

        <div className="top-bar">
          <div className="top-bar-buttons">
            {isDono && (
              <button
                onClick={() => {
                  setMostrarDashboard(true);
                  setMostrarPainel(false);
                  setMostrarCatalogo(false);
                }}
                className="botao"
              >
                Dashboard
              </button>
            )}
            <button onClick={mostrarMenuPedidos} className="botao">
              Menu de Pedidos
            </button>
            <button onClick={voltarAoCatalogo} className="botao">
              Catálogo
              {carrinho.length > 0 && (
                <span className="badge-carrinho">{carrinho.length}</span>
              )}
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

        {mostrarDashboard ? (
          <Dashboard fechar={() => setMostrarDashboard(false)} />
        ) : mostrarPainel ? (
          <MenuPedidos isDono={isDono} usuario={usuario} />
        ) : mostrarCatalogo ? (
          <>
            <h2>Catálogo de Produtos</h2>
            <div className="produtos">
              {produtos.map((p) => (
                <div key={p.id} className="cartao cartao-produto">
                  <img src={p.imagem} alt={p.nome} className="imagem-produto" />
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

                <p style={{ fontWeight: "bold", marginTop: "10px", color: "#00ff66" }}>
                  🧾 Subtotal: R$ {totalCarrinho.toFixed(2)}
                </p>
                <p style={{ fontWeight: "bold", color: "#00ff66" }}>
                  🚚 Frete: R$ {FRETE_FIXO.toFixed(2)}
                </p>
                <p style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#00ff66" }}>
                  💰 Total: R$ {totalComFrete.toFixed(2)}
                </p>

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