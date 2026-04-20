import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import MenuPedidos from "./pages/MenuPedidos";
import UserInfo from "./components/UserInfo";
import Dashboard from "./pages/Dashboard";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CombosPage from "./pages/CombosPage";
import PerfilEntregador from "./pages/PerfilEntregador.js";
import Catalogo from "./pages/Catalogo"; 
import Footer from "./components/Footer";
import NavBar from "./components/NavBar"; 
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
// IMPORTANTE: Adicionamos o runTransaction aqui para o controle de concorrência
import { collection, getDoc, doc, runTransaction } from "firebase/firestore";
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

  const [formaPagamento, setFormaPagamento] = useState("");
  const [toast, setToast] = useState(null); 

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
  };

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
      showToast(`Limite de estoque atingido para ${produto.nome}!`, 'error'); 
      return; 
    }
    
    setCarrinho((carrinhoAtual) => {
      const itemExistente = carrinhoAtual.find((item) => item.id === produto.id);
      if (itemExistente) {
        return carrinhoAtual.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      } else {
        return [...carrinhoAtual, { ...produto, quantidade: 1 }];
      }
    });
    
    if (mostrarCatalogo || mostrarCombos || produtoSelecionado) {
        showToast(`${produto.nome} adicionado ao carrinho!`); 
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
        showToast("Um dos itens do combo está esgotado!", "error");
        return;
    }

    setCarrinho((prevCarrinho) => {
      const itemNoCarrinho = prevCarrinho.find((i) => i.id === combo.id);
      const qtdAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

      if (qtdAtual + 1 > menorEstoquePossivel) {
        showToast("Estoque insuficiente para adicionar mais desse combo!", "error");
        return prevCarrinho;
      }

      showToast(`${combo.nome} adicionado com sucesso!`);

      if (itemNoCarrinho) {
        return prevCarrinho.map((item) =>
          item.id === combo.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      } else {
        return [...prevCarrinho, { 
            id: combo.id, nome: combo.nome, preco: combo.preco, imagem: combo.imagem,
            quantidade: 1, volume: volumeTotalCombo, estoque: menorEstoquePossivel, 
            tipo: 'combo', itens: combo.itens 
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
        item.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item
      );
    });
  };

  const calcularTotalItem = (item) => {
    if (item.tipo === 'combo') return item.preco * item.quantidade;
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

  // --- NOVA FUNÇÃO DE CHECKOUT COM TRANSAÇÃO ATÔMICA ---
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
      // Iniciando a Transação Segura do Firestore
      await runTransaction(db, async (transaction) => {
        // 1. Mapear as referências dos produtos no Firestore
        const produtosRefs = carrinho.map(item => doc(db, "produtos", String(item.id)));
        const produtosSnapshots = [];

        // 2. Leitura obrigatória antes de qualquer escrita
        for (let ref of produtosRefs) {
          const snap = await transaction.get(ref);
          produtosSnapshots.push(snap);
        }

        // 3. Validação de Estoque (Fallback Inteligente: apenas checa se o produto existir no BD)
        carrinho.forEach((itemNoCarrinho, index) => {
          const snap = produtosSnapshots[index];
          if (snap.exists()) {
            const dadosBanco = snap.data();
            if (dadosBanco.estoque < itemNoCarrinho.quantidade) {
              throw new Error(`Estoque insuficiente para: ${itemNoCarrinho.nome}. Restam apenas ${dadosBanco.estoque} unidades.`);
            }
          }
        });

        // 4. Escrita 1: Atualizar os estoques no banco (se existirem)
        carrinho.forEach((itemNoCarrinho, index) => {
          const snap = produtosSnapshots[index];
          if (snap.exists()) {
            const dadosBanco = snap.data();
            const novoEstoque = dadosBanco.estoque - itemNoCarrinho.quantidade;
            transaction.update(produtosRefs[index], { estoque: novoEstoque });
          }
        });

        // 5. Escrita 2: Registrar o pedido de forma segura
        const novoPedidoRef = doc(collection(db, "pedidos")); 
        
        transaction.set(novoPedidoRef, {
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
      });

      // Se a transação passou direto por tudo sem dar erro:
      setCarrinho([]);
      setFormaPagamento("");
      showToast(`Pedido #${idPedido} criado com segurança!`); 

      mostrarMenuPedidos();

    } catch (err) {
      console.error(err);
      showToast(err.message || "Erro de concorrência ao salvar pedido.", 'error'); 
    }
  };

  if (!usuario) {
    return (
      <>
        <Login showToast={showToast} />
        {toast && <Toast toast={toast} onClose={fecharToast} />}
      </>
    );
  }

  return (
    <div className="container">
      <div className="painel">
        
        <NavBar 
          isDono={isDono}
          isEntregador={isEntregador}
          totalItensBadge={totalItensBadge}
          onProfileClick={() => { resetarNavegacao(); setMostrarConta(true); }}
          onNavigate={{
            dashboard: () => { resetarNavegacao(); setMostrarDashboard(true); },
            pedidos: mostrarMenuPedidos,
            catalogo: voltarAoCatalogo,
            carrinho: mostrarPaginaCarrinho
          }}
        />

        {mostrarConta && (
          <UserInfo 
            usuario={usuario} 
            fechar={() => { 
              setMostrarConta(false); 
              fetchUserData(usuario.uid); 
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
          <Catalogo 
            mostrarPaginaCombos={mostrarPaginaCombos}
            mostrarDetalhesProduto={mostrarDetalhesProduto}
            adicionarAoCarrinho={adicionarAoCarrinho}
          />
        ) : null}

        {toast && <Toast toast={toast} onClose={fecharToast} />}
      </div>

      <Footer />
    </div>
  );
}

export default App;