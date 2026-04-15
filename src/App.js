import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import MenuPedidos from "./pages/MenuPedidos";
import UserInfo from "./components/UserInfo";
import Dashboard from "./pages/Dashboard";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CombosPage from "./pages/CombosPage";
import PerfilEntregador from "./pages/PerfilEntregador.js";
import Footer from "./components/Footer";
import Banner from "./components/Banner"; 
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { FaUserCircle, FaSearch, FaClock } from "react-icons/fa"; 
import Toast from "./components/Toast";
import { produtos } from './data/Produtos.js'; 

function gerarIdPedido() {
  return Math.floor(1000 + Math.random() * 9000);
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false); 
  const [mostrarConta, setMostrarConta] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [mostrarCarrinho, setMostrarCarrinho] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [mostrarCombos, setMostrarCombos] = useState(false);
  const [mostrarPerfilEntregador, setMostrarPerfilEntregador] = useState(false);

  const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [toast, setToast] = useState(null); 
  
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  const fecharToast = () => {
    setToast(null);
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      if (user) {
        fetchUserData(user.uid); 
      } else {
        setDadosUsuario(null); 
      }
    });
    return () => unsubscribe(); 
  }, []); 

  // AGORA O SISTEMA VERIFICA O CARGO NO BANCO DE DADOS
  const isDono = dadosUsuario?.tipo === "admin";
  const isEntregador = dadosUsuario?.tipo === "entregador";

  const resetarNavegacao = () => {
    setMostrarPainel(false);
    setMostrarCatalogo(false);
    setMostrarConta(false);
    setMostrarDashboard(false);
    setMostrarCarrinho(false);
    setProdutoSelecionado(null); 
    setMostrarCombos(false); 
    setMostrarPerfilEntregador(false);
    setPedidoFinalizado(false);
  };

  // ROTEAMENTO AUTOMÁTICO DE HOME POR PERFIL (DINÂMICO)
  useEffect(() => {
    if (usuario && dadosUsuario !== undefined) {
      resetarNavegacao();
      if (dadosUsuario?.tipo === "entregador") {
        setMostrarPerfilEntregador(true); 
      } else if (dadosUsuario?.tipo === "admin") {
        setMostrarPainel(true); 
      } else {
        setMostrarCatalogo(true); 
      }
    }
  }, [usuario, dadosUsuario]);

  const mostrarMenuPedidos = () => { resetarNavegacao(); setMostrarPainel(true); };
  const voltarAoCatalogo = () => { resetarNavegacao(); setMostrarCatalogo(true); };
  const mostrarPaginaCarrinho = () => { resetarNavegacao(); setMostrarCarrinho(true); };
  const mostrarDetalhesProduto = (produto) => { resetarNavegacao(); setProdutoSelecionado(produto); };
  const mostrarPaginaCombos = () => { resetarNavegacao(); setMostrarCombos(true); };

  const adicionarAoCarrinho = (produto) => {
    const itemNoCarrinho = carrinho.find((item) => item.id === produto.id);
    const quantidadeAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    
    const estoqueDisponivel = produto.tipo === 'combo' ? produto.estoque : produto.estoque;

    if (quantidadeAtual >= estoqueDisponivel) {
      showToast(`❌ Limite de estoque atingido para ${produto.nome}!`, 'error'); 
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
    
    if (mostrarCatalogo || mostrarCombos || produtoSelecionado) {
        showToast(`🛒 ${produto.nome} adicionado ao carrinho!`); 
    }
  };

  const adicionarComboAoCarrinho = (combo) => {
    let menorEstoquePossivel = Infinity;
    let volumeTotalCombo = 0;

    combo.itens.forEach((itemCombo) => {
      const produtoReal = produtos.find((p) => p.id === itemCombo.id);
      if (produtoReal) {
        const maxUnidades = Math.floor(produtoReal.estoque / itemCombo.qtd);
        if (maxUnidades < menorEstoquePossivel) {
          menorEstoquePossivel = maxUnidades;
        }
        volumeTotalCombo += (produtoReal.volume * itemCombo.qtd);
      }
    });

    if (menorEstoquePossivel === 0) {
        showToast("❌ Um dos itens do combo está esgotado!", "error");
        return;
    }

    setCarrinho((prevCarrinho) => {
      const itemNoCarrinho = prevCarrinho.find((i) => i.id === combo.id);
      const qtdAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

      if (qtdAtual + 1 > menorEstoquePossivel) {
        showToast("❌ Estoque insuficiente para adicionar mais desse combo!", "error");
        return prevCarrinho;
      }

      showToast(`🔥 ${combo.nome} adicionado com sucesso!`);

      if (itemNoCarrinho) {
        return prevCarrinho.map((item) =>
          item.id === combo.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prevCarrinho, { 
            id: combo.id,
            nome: combo.nome,
            preco: combo.preco, 
            imagem: combo.imagem,
            quantidade: 1,
            volume: volumeTotalCombo,
            estoque: menorEstoquePossivel, 
            tipo: 'combo',
            itens: combo.itens 
        }];
      }
    });
  };

  const removerDoCarrinho = (produtoId) => {
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

  const calcularTotalItem = (item) => {
    if (item.tipo === 'combo') {
      return item.preco * item.quantidade;
    }
    if (item.fardo && item.quantidade >= item.fardo.quantidade) {
      const numFardos = Math.floor(item.quantidade / item.fardo.quantidade);
      const resto = item.quantidade % item.fardo.quantidade;
      return (numFardos * item.fardo.preco) + (resto * item.preco);
    }
    return item.preco * item.quantidade;
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + calcularTotalItem(item), 0);
  const totalItensBadge = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const CAPACIDADE_ENTREGADOR = 12; 
  const CUSTO_VIAGEM = 3.00;       
  const volumeTotal = carrinho.reduce((acc, item) => acc + (item.volume * item.quantidade), 0);
  const viagensNecessarias = Math.ceil(volumeTotal / CAPACIDADE_ENTREGADOR);
  const freteFinal = viagensNecessarias * CUSTO_VIAGEM;
  const totalComFrete = totalCarrinho + freteFinal;
  const hasAddress = dadosUsuario && dadosUsuario.nome && dadosUsuario.rua && dadosUsuario.numero && dadosUsuario.bairro && dadosUsuario.telefone;

  const finalizarPedido = async () => {
    if (!carrinho.length) {
      showToast("Seu carrinho está vazio!", 'error');
      return;
    }
    if (!formaPagamento) {
      showToast("Por favor, informe a forma de pagamento.", 'error');
      return;
    }
    if (!hasAddress) { 
      showToast("Complete suas informações antes de fazer pedidos.", 'error');
      setMostrarConta(true);
      return;
    }

    const idPedido = gerarIdPedido();
    const codigoSeguranca = Math.floor(1000 + Math.random() * 9000).toString();
    
    try {
      await addDoc(collection(db, "pedidos"), {
        idPedido,
        usuario: usuario.email,
        userId: usuario.uid,
        enderecoEntrega: {
          nome: dadosUsuario.nome,
          rua: dadosUsuario.rua,
          numero: dadosUsuario.numero,
          bairro: dadosUsuario.bairro,
          referencia: dadosUsuario.referencia || "",
          telefone: dadosUsuario.telefone
        },
        itens: carrinho, 
        formaPagamento,
        status: "Em Preparo",
        data: new Date().toISOString(),
        total: totalComFrete,
        codigoSeguranca: codigoSeguranca
      });

      setCarrinho([]);
      setFormaPagamento("");
      setPedidoFinalizado(true);
      showToast(`Pedido #${idPedido} criado com sucesso!`); 

    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar pedido: " + err.message, 'error'); 
    }
  };

  const fecharMensagem = () => setPedidoFinalizado(false);

  const categorias = ["Todos", "Cervejas", "Destilados", "Energéticos", "Refrigerantes", "Ice", "Petiscos", "Tabacaria", "Sem Álcool"];
  
  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = categoriaSelecionada === "Todos" || produto.categoria === categoriaSelecionada;
    const matchBusca = produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  if (!usuario) return <Login showToast={showToast} />;

  return (
    <div className="container">
      <div className="painel">
        <div className="header-logo">
          <img src="/LogoAdega.png" alt="Logo Adega Skynão" />
          <div>
            <h1>Adega Skynão</h1>
            <p className="slogan">Rapidez e qualidade na sua festa!</p>
          </div>
        </div>
        <div className="top-bar">
          <div className="top-bar-buttons">
            {!isEntregador && (
              <>
                {isDono && (
                  <button onClick={() => { resetarNavegacao(); setMostrarDashboard(true); }} className="botao">
                    Dashboard
                  </button>
                )}
                <button onClick={mostrarMenuPedidos} className="botao">
                  Menu de Pedidos
                </button>
                <button onClick={voltarAoCatalogo} className="botao">
                  Catálogo
                </button>
                <button onClick={mostrarPaginaCarrinho} className="botao">
                  Carrinho
                  {totalItensBadge > 0 && (
                    <span className="badge-carrinho">{totalItensBadge}</span> 
                  )}
                </button>
              </>
            )}
          </div>
          <div className="top-bar-actions">
            <button onClick={() => signOut(auth)} className="botao botao-vermelho">Sair</button>
            {/* O ícone agora aparece para todos */}
            <div onClick={() => {resetarNavegacao(); setMostrarConta(true);}} className="icon-perfil">
              <FaUserCircle />
            </div>
          </div>
        </div>

        {/* O bloqueio do !isEntregador foi removido daqui */}
        {mostrarConta && (
          <UserInfo 
            usuario={usuario} 
            fechar={() => { 
              setMostrarConta(false); 
              fetchUserData(usuario.uid); 
              // Direciona para a tela correta ao fechar
              if (isEntregador) {
                setMostrarPerfilEntregador(true);
              } else if (isDono) {
                setMostrarPainel(true);
              } else {
                setMostrarCatalogo(true);
              }
            }}
            showToast={showToast}
          />
        )}

        {mostrarCombos && !isEntregador ? (
          <CombosPage 
            onVoltar={voltarAoCatalogo} 
            adicionarComboAoCarrinho={adicionarComboAoCarrinho}
          />
        ) : produtoSelecionado && !isEntregador ? (
          <ProductDetailPage
            produto={produtoSelecionado}
            onVoltar={voltarAoCatalogo} 
            onAdicionarAoCarrinho={adicionarAoCarrinho}
          />
        ) : mostrarDashboard && isDono ? (
          <Dashboard fechar={() => {resetarNavegacao(); setMostrarPainel(true);}} />
        ) : mostrarPerfilEntregador ? (
          <PerfilEntregador showToast={showToast} dadosUsuario={dadosUsuario} />
        ) : mostrarPainel && !isEntregador ? (
          <MenuPedidos isDono={isDono} usuario={usuario} />
        ) : mostrarCarrinho && !isEntregador ? (
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
            abrirPaginaConta={() => {resetarNavegacao(); setMostrarConta(true);}}
            calcularTotalItem={calcularTotalItem} 
          />
        ) : mostrarCatalogo && !isEntregador ? (
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
                    width: '100%',
                    padding: '10px 10px 10px 35px',
                    borderRadius: '20px',
                    border: '1px solid #00ff66',
                    backgroundColor: '#222',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
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
                      border: '1px solid #00ff66',
                      padding: '8px 15px',
                      borderRadius: '15px',
                      fontSize: '0.9rem'
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
                ))
              ) : (
                <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
                  {categoriaSelecionada === "Tabacaria" ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '15px' 
                    }}>
                      <FaClock style={{ fontSize: '3rem', color: '#00ff66' }} />
                      <div>
                        <h3 style={{ color: '#00ff66', fontSize: '1.5rem', margin: '0 0 10px 0' }}>Em breve novidades!</h3>
                        <p style={{ color: '#ccc', fontSize: '1rem', margin: 0 }}>Estamos preparando uma seleção especial para esta seção.</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '1.2rem', color: '#888' }}>
                      Nenhum produto encontrado. 😢
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}

        {pedidoFinalizado && !isEntregador && (
          <div className="cartao">
            <h2 className="titulo-principal">🎉 Pedido Criado!</h2>
            <p>Confira no Menu de Pedidos.</p>
            <button onClick={fecharMensagem} className="botao botao-vermelho">
              Fechar
            </button>
          </div>
        )}

        {toast && <Toast toast={toast} onClose={fecharToast} />}
      </div>

      <Footer />
    </div>
  );
}

export default App;