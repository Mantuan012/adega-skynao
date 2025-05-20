import React, { useState, useEffect } from "react";
import Login from "./Login";
import MenuPedidos from "./MenuPedidos";
import UserInfo from "./UserInfo";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { FaUserCircle } from "react-icons/fa";
import Toast from "./Toast";

// Catálogo de produtos
const produtos = [
  { id: 1, nome: "Whisky Red Label", preco: 120.0 },
  { id: 2, nome: "Vodka Absolut", preco: 90.0 },
  { id: 3, nome: "Cerveja Heineken 600ml", preco: 12.0 },
  { id: 4, nome: "Gin Tanqueray", preco: 150.0 },
];

// Gera um ID de pedido aleatório com 4 dígitos
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

  // Monitora autenticação
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) showToast("Login realizado com sucesso!");
    });
  }, []);

  // Só o admin (dono) vê botões de status
  const isDono = usuario?.email === "gobboe4@gmail.com";

  // Toast de notificação
  const showToast = (msg) => setToastMessage(msg);
  const fecharToast = () => setToastMessage("");

  // Navegação
  const mostrarMenuPedidos = () => {
    setMostrarPainel(true);
    setMostrarCatalogo(false);
  };
  const voltarAoCatalogo = () => {
    setMostrarPainel(false);
    setMostrarCatalogo(true);
  };

  // Carrinho
  const adicionarAoCarrinho = (produto) =>
    setCarrinho((c) => [...c, produto]);
  const removerDoCarrinho = (idx) =>
    setCarrinho((c) => c.filter((_, i) => i !== idx));

  // Finaliza pedido e grava no Firestore
  const finalizarPedido = async () => {
    if (!carrinho.length) {
      showToast("Seu carrinho está vazio!");
      return;
    }
    const idPedido = gerarIdPedido();
    try {
      await addDoc(collection(db, "pedidos"), {
        idPedido,                       // 4 dígitos
        usuario: usuario.email,
        userId: usuario.uid,            // UID para permissões
        itens: carrinho,
        status: "Em Preparo",           // status inicial
        data: new Date().toISOString(),
      });
      setCarrinho([]);
      setPedidoFinalizado(true);
      showToast(`Pedido #${idPedido} criado com sucesso!`);
    } catch (err) {
      showToast("Erro ao salvar pedido: " + err.message);
    }
  };
  const fecharMensagem = () => setPedidoFinalizado(false);

  // Se não logado, mostra login
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

        {/* Painel de Conta */}
        {mostrarConta && (
          <UserInfo usuario={usuario} fechar={() => setMostrarConta(false)} />
        )}

        {/* Conteúdo Principal */}
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
                <button onClick={finalizarPedido} className="botao">
                  ✅ Finalizar Pedido
                </button>
              </div>
            )}
          </>
        ) : null}

        {/* Mensagem pós‐pedido */}
        {pedidoFinalizado && (
          <div className="cartao">
            <h2 className="titulo-principal">🎉 Pedido Criado!</h2>
            <p>Confira no Menu de Pedidos.</p>
            <button onClick={fecharMensagem} className="botao botao-vermelho">
              Fechar
            </button>
          </div>
        )}

        {/* Toast de notificação */}
        {toastMessage && <Toast message={toastMessage} onClose={fecharToast} />}
      </div>
    </div>
  );
}

export default App;