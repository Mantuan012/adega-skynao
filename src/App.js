import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import MenuPedidos from "./pages/MenuPedidos";
import UserInfo from "./components/UserInfo";
import Dashboard from "./pages/Dashboard";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import Footer from "./components/Footer"; 
import Banner from "./components/Banner"; 
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { FaUserCircle } from "react-icons/fa";
import Toast from "./components/Toast";

// Lista de produtos com "estoque"
const produtos = [
  { id: 1, nome: "Whisky Red Label", preco: 120.0, imagem: "/images/RedLabel.png", volume: 2, estoque: 10 },
  { id: 2, nome: "Vodka Absolut", preco: 90.0, imagem: "/images/VodkaAbsolut.png", volume: 2, estoque: 15 },
  { id: 15, nome: "Cachaça 51", preco: 30.0, imagem: "/images/Cachaça51.jpg", volume: 2, estoque: 20 },
  { id: 3, nome: "Heineken 600ml", preco: 12.0, imagem: "/images/Heineken600ml.png", volume: 1, estoque: 50 },
  { id: 4, nome: "Coca-Cola 2L", preco: 8.0, imagem: "/images/CocaCola2L.png", volume: 1, estoque: 100 },
  { id: 5, nome: "Fanta Laranja 1,5L", preco: 7.0, imagem: "/images/FantaLaranja1,5L.jpg", volume: 1, estoque: 30 },
  { id: 6, nome: "Sprite 2L", preco: 7.0, imagem: "/images/Sprite2L.jpg", volume: 1, estoque: 30 },
  { id: 8, nome: "Monster 500ml", preco: 12.0, imagem: "/images/Monster500ml.jpg", volume: 1, estoque: 40 },
  { id: 16, nome: "Monster Ultra 500ml", preco: 12.0, imagem: "/images/MonsterUltra.jpg", volume: 1, estoque: 5 },
  { id: 7, nome: "Red Bull 250ml", preco: 15.0, imagem: "/images/RedBull250ml.jpg", volume: 0.5, estoque: 50 },
  { id: 9, nome: "TNT 350ml", preco: 10.0, imagem: "/images/TNT350ml.png", volume: 0.5, estoque: 50 },
  { id: 10, nome: "Skol 350ml", preco: 5.0, imagem: "/images/Skol350ml.jpg", volume: 0.5, estoque: 100 },
  { id: 11, nome: "Budweiser 350ml", preco: 7.0, imagem: "/images/Budweiser350ml.jpg", volume: 0.5, estoque: 100 },
  { id: 12, nome: "Corona 330ml", preco: 10.0, imagem: "/images/Corona330ml.jpg", volume: 0.5, estoque: 30 },
  { id: 13, nome: "Stella Artois 330ml", preco: 9.0, imagem: "/images/StellaArtois330ml.jpg", volume: 0.5, estoque: 30 },
  { id: 14, nome: "Heineken 330ml", preco: 9.0, imagem: "/images/Heineken330ml.jpg", volume: 0.5, estoque: 50 }
];

function gerarIdPedido() {
  return Math.floor(1000 + Math.random() * 9000);
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(true);
  const [mostrarConta, setMostrarConta] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const fetchUserData = async (uid) => {
    if (uid) {
      const userRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setDadosUsuario(userSnap.data()); 
      } else {
        setDadosUsuario(null); 
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        showToast("Login realizado com sucesso!");
        fetchUserData(user.uid); 
      } else {
        setDadosUsuario(null); 
      }
    });
    return () => unsubscribe(); 
  }, []); 

  const isDono = usuario?.email === "pesquisaciencia012@gmail.com";

  const showToast = (msg) => setToastMessage(msg);
  const fecharToast = () => setToastMessage("");

  // Funções de navegação
  const mostrarMenuPedidos = () => {
    setMostrarPainel(true);
    setMostrarCatalogo(false);
    setMostrarDashboard(false);
    setMostrarCarrinho(false);
    setProdutoSelecionado(null); 
  };
  const voltarAoCatalogo = () => {
    setMostrarPainel(false);
    setMostrarCatalogo(true);
    setMostrarDashboard(false);
    setMostrarCarrinho(false);
    setProdutoSelecionado(null); 
  };
  const mostrarPaginaCarrinho = () => {
    setMostrarPainel(false);
    setMostrarCatalogo(false);
    setMostrarDashboard(false);
    setMostrarCarrinho(true);
    setProdutoSelecionado(null); 
  };
  const mostrarDetalhesProduto = (produto) => {
    setProdutoSelecionado(produto);
    setMostrarPainel(false);
    setMostrarCatalogo(false);
    setMostrarDashboard(false);
    setMostrarCarrinho(false);
  };

  const adicionarAoCarrinho = (produto) => {
    // (Lógica de adicionar ao carrinho com validação de estoque - sem mudanças)
    const itemNoCarrinho = carrinho.find((item) => item.id === produto.id);
    const quantidadeAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    if (quantidadeAtual >= produto.estoque) {
      showToast(`❌ Limite de estoque atingido para ${produto.nome}!`);
      return; 
    }
    setCarrinho((carrinhoAtual) => {
      const itemExistente = carrinhoAtual.find((item) => item.id === produto.id);
      if (itemExistente) {
        return carrinhoAtual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...carrinhoAtual, { ...produto, quantidade: 1 }];
      }
    });
    showToast(`🛒 ${produto.nome} adicionado ao carrinho!`);
  };

  const removerDoCarrinho = (produtoId) => {
    // (Lógica de remover do carrinho - sem mudanças)
    setCarrinho((carrinhoAtual) => {
      const itemParaRemover = carrinhoAtual.find((item) => item.id === produtoId);
      if (itemParaRemover.quantidade === 1) {
        return carrinhoAtual.filter((item) => item.id !== produtoId);
      }
      return carrinhoAtual.map((item) =>
        item.id === produtoId
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      );
    });
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalItensBadge = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // Lógica do Frete Dinâmico (sem mudanças)
  const CAPACIDADE_ENTREGADOR = 12; 
  const CUSTO_VIAGEM = 3.00;       
  const volumeTotal = carrinho.reduce((acc, item) => acc + (item.volume * item.quantidade), 0);
  const viagensNecessarias = Math.ceil(volumeTotal / CAPACIDADE_ENTREGADOR);
  const freteFinal = viagensNecessarias * CUSTO_VIAGEM;
  const totalComFrete = totalCarrinho + freteFinal;

  const hasAddress = dadosUsuario && dadosUsuario.nome && dadosUsuario.endereco && dadosUsuario.telefone;

  const finalizarPedido = async () => {
    // (Lógica de finalizar pedido - sem mudanças)
    if (!carrinho.length) {
      showToast("Seu carrinho está vazio!");
      return;
    }
    if (!formaPagamento) {
      showToast("Por favor, informe a forma de pagamento.");
      return;
    }
    if (!hasAddress) {
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
        {/* Header e Top-Bar (sem mudanças) */}
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
                  setMostrarCarrinho(false);
                  setProdutoSelecionado(null);
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
            </button>
            
            {/* BOTÃO CARRINHO CORRIGIDO */}
            <button onClick={mostrarPaginaCarrinho} className="botao">
              Carrinho
              {totalItensBadge > 0 && (
                // Correção: usar totalItensBadge aqui
                <span className="badge-carrinho">{totalItensBadge}</span> 
              )}
            </button>
            {/* FIM DA CORREÇÃO */}

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

        {/* UserInfo (sem mudanças) */}
        {mostrarConta && (
          <UserInfo 
            usuario={usuario} 
            fechar={() => {
              setMostrarConta(false);
              fetchUserData(usuario.uid); 
            }} 
          />
        )}

        {/* Lógica de exibição principal */}
        {produtoSelecionado ? (
          <ProductDetailPage
            produto={produtoSelecionado}
            onVoltar={voltarAoCatalogo} 
            onAdicionarAoCarrinho={adicionarAoCarrinho}
          />
        ) : mostrarDashboard ? (
          <Dashboard fechar={() => setMostrarDashboard(false)} />
        ) : mostrarPainel ? (
          <MenuPedidos isDono={isDono} usuario={usuario} />
        ) : mostrarCarrinho ? (
          <CartPage
            carrinho={carrinho}
            removerDoCarrinho={removerDoCarrinho} 
            totalCarrinho={totalCarrinho}
            freteCalculado={freteFinal} 
            totalComFrete={totalComFrete}
            formaPagamento={formaPagamento}
            setFormaPagamento={setFormaPagamento}
            finalizarPedido={finalizarPedido}
            adicionarAoCarrinho={adicionarAoCarrinho} 
            hasAddress={hasAddress}
            abrirPaginaConta={() => setMostrarConta(true)}
          />
        ) : mostrarCatalogo ? (
          <>
            <Banner />
          
            <h2>Catálogo de Produtos</h2>
            <div className="produtos">
              {produtos.map((p) => (
                <div 
                  key={p.id} 
                  className="cartao cartao-produto" 
                  onClick={() => mostrarDetalhesProduto(p)} 
                >
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
              ))}
            </div>
          </>
        ) : null}

        {/* (Resto do código sem mudanças) */}
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

      <Footer />
    </div>
  );
}

export default App;