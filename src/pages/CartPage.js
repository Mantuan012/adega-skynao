import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { FaTrash, FaPlus, FaMinus, FaMoneyBillWave } from 'react-icons/fa';
import './CartPage.css';

function gerarIdPedido() {
  return Math.floor(1000 + Math.random() * 9000);
}

function CartPage({ usuario, dadosUsuario, showToast }) {
  const [formaPagamento, setFormaPagamento] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  
  const navigate = useNavigate();
  const { carrinho, removerDoCarrinho, adicionarAoCarrinho, excluirDoCarrinho, calcularTotalItem, limparCarrinho } = useCart();

  const CAPACIDADE_ENTREGADOR = 12;
  const CUSTO_VIAGEM = 3.00;
  
  const volumeTotal = carrinho.reduce((acc, item) => acc + (item.volume * item.quantidade), 0);
  const viagensNecessarias = Math.ceil(volumeTotal / CAPACIDADE_ENTREGADOR);
  const freteFinal = viagensNecessarias * CUSTO_VIAGEM;
  
  const totalProdutos = carrinho.reduce((acc, item) => acc + calcularTotalItem(item), 0);
  const totalComFrete = totalProdutos + freteFinal;

  const hasAddress = dadosUsuario?.nome && dadosUsuario?.rua && dadosUsuario?.numero && dadosUsuario?.telefone;

  const realizarCheckout = async () => {
    if (!carrinho.length) { 
      showToast("Seu carrinho está vazio!", 'error'); 
      return; 
    }
    if (!formaPagamento) { 
      showToast("Por favor, informe a forma de pagamento.", 'error'); 
      return; 
    }
    if (!hasAddress) { 
      showToast("Complete suas informações de endereço no perfil antes de pedir.", 'error');
      navigate('/perfil');
      return;
    }

    setIsProcessando(true);
    const idPedido = gerarIdPedido();
    const codigoSeguranca = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      await runTransaction(db, async (transaction) => {
        let totalProdutosSeguro = 0;
        let volumeTotalSeguro = 0;

        const refsSet = new Set();
        carrinho.forEach(item => {
          if (item.tipo === 'combo') {
            item.itens.forEach(i => refsSet.add(String(i.id)));
          } else {
            refsSet.add(String(item.id));
          }
        });

        const refsArray = Array.from(refsSet);
        const produtosRefs = refsArray.map(id => doc(db, "produtos", id));
        const produtosSnapshots = {};

        for (let i = 0; i < produtosRefs.length; i++) {
          const snap = await transaction.get(produtosRefs[i]);
          if (snap.exists()) {
            produtosSnapshots[refsArray[i]] = snap.data();
          }
        }

        const consumoEstoque = {};

        carrinho.forEach(item => {
          if (item.tipo === 'combo') {
            totalProdutosSeguro += (item.preco * item.quantidade);
            item.itens.forEach(i => {
              const idProd = String(i.id);
              if (!consumoEstoque[idProd]) consumoEstoque[idProd] = 0;
              consumoEstoque[idProd] += (i.qtd * item.quantidade);
              if (produtosSnapshots[idProd]) {
                volumeTotalSeguro += (produtosSnapshots[idProd].volume * i.qtd * item.quantidade);
              }
            });
          } else {
            const idProd = String(item.id);
            if (!consumoEstoque[idProd]) consumoEstoque[idProd] = 0;
            consumoEstoque[idProd] += item.quantidade;

            const dadosReais = produtosSnapshots[idProd];
            if (!dadosReais) throw new Error(`Produto adulterado: ${item.nome}`);

            volumeTotalSeguro += (dadosReais.volume * item.quantidade);

            if (dadosReais.fardo && item.quantidade >= dadosReais.fardo.quantidade) {
              const numFardos = Math.floor(item.quantidade / dadosReais.fardo.quantidade);
              const resto = item.quantidade % dadosReais.fardo.quantidade;
              totalProdutosSeguro += (numFardos * dadosReais.fardo.preco) + (resto * dadosReais.preco);
            } else {
              totalProdutosSeguro += (dadosReais.preco * item.quantidade);
            }
          }
        });

        for (const [id, qtdNecessaria] of Object.entries(consumoEstoque)) {
          const dados = produtosSnapshots[id];
          if (!dados) throw new Error(`Erro: Produto sumiu do banco.`);
          if (dados.estoque < qtdNecessaria) {
            throw new Error(`Estoque insuficiente para: ${dados.nome}. Restam ${dados.estoque}.`);
          }
        }

        for (const [id, qtdNecessaria] of Object.entries(consumoEstoque)) {
          const ref = doc(db, "produtos", id);
          const novoEstoque = produtosSnapshots[id].estoque - qtdNecessaria;
          transaction.update(ref, { estoque: novoEstoque });
        }

        const viagensSeguras = Math.ceil(volumeTotalSeguro / CAPACIDADE_ENTREGADOR);
        const freteSeguro = viagensSeguras * CUSTO_VIAGEM;
        const totalComFreteSeguro = totalProdutosSeguro + freteSeguro;

        const novoPedidoRef = doc(collection(db, "pedidos")); 
        transaction.set(novoPedidoRef, {
          idPedido,
          usuario: usuario.email,
          userId: usuario.uid,
          enderecoEntrega: { ...dadosUsuario },
          itens: carrinho,
          formaPagamento,
          status: "Em Preparo",
          data: new Date().toISOString(),
          total: totalComFreteSeguro,
          codigoSeguranca: codigoSeguranca
        });
      });

      limparCarrinho();
      setFormaPagamento("");
      showToast(`Pedido #${idPedido} criado com sucesso!`); 
      navigate('/pedidos'); 

    } catch (err) {
      console.error(err);
      showToast(err.message || "Erro ao processar pedido.", 'error'); 
    } finally {
      setIsProcessando(false);
    }
  };

  if (carrinho.length === 0) {
    return (
      <div className="cartao" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="titulo-principal">Carrinho Vazio</h2>
        <p>Adicione algumas bebidas para começar a festa!</p>
        <button onClick={() => navigate('/catalogo')} className="botao" style={{ marginTop: '20px' }}>
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="cartao">
      <h2 className="titulo-principal" style={{ color: '#00ff66', textAlign: 'center', marginBottom: '30px' }}>Seu Carrinho</h2>
      
      <ul className="lista-carrinho" style={{ listStyle: 'none', padding: 0 }}>
        {carrinho.map((item) => (
          <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', padding: '15px 0' }}>
            <div style={{ flex: 2 }}>
              <span style={{ color: '#fff', fontSize: '1rem' }}>{item.nome}</span>
            </div>

            <div className="controles-quantidade" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
              <button className="botao-quantidade" onClick={() => removerDoCarrinho(item.id)} style={{ background: '#222', color: '#00ff66', border: '1px solid #00ff66', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}><FaMinus size={10}/></button>
              <span className="quantidade" style={{ color: '#fff', fontWeight: 'bold' }}>{item.quantidade}</span>
              <button className="botao-quantidade" onClick={() => adicionarAoCarrinho(item)} disabled={item.quantidade >= item.estoque} style={{ background: '#222', color: '#00ff66', border: '1px solid #00ff66', borderRadius: '50%', width: '30px', height: '30px', cursor: item.quantidade >= item.estoque ? 'not-allowed' : 'pointer' }}><FaPlus size={10}/></button>
            </div>

            <div style={{ flex: 1, textAlign: 'right', color: '#00ff66', fontWeight: 'bold' }}>
              R$ {calcularTotalItem(item).toFixed(2)}
            </div>

            <button className="botao botao-vermelho" onClick={() => excluirDoCarrinho(item.id)} style={{ padding: '8px', marginLeft: '15px', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer' }}>
              <FaTrash size={18} />
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', borderLeft: '4px solid #00ff66' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#00ff66' }}>Resumo do Pedido</h3>
        <p style={{ color: '#ccc', marginBottom: '8px' }}>Subtotal dos Produtos: <strong style={{ color: '#fff' }}>R$ {totalProdutos.toFixed(2)}</strong></p>
        <p style={{ color: '#ccc' }}>Custo de Entrega ({viagensNecessarias} viagem/ns): <strong style={{ color: '#fff' }}>R$ {freteFinal.toFixed(2)}</strong></p>
        <h2 style={{ color: '#fff', borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
          Total a Pagar: <span style={{ color: '#00ff66' }}>R$ {totalComFrete.toFixed(2)}</span>
        </h2>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#00ff66', marginBottom: '15px', fontSize: '1.1rem' }}>Forma de Pagamento</h3>
        <select 
          value={formaPagamento} 
          onChange={(e) => setFormaPagamento(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}
        >
          <option value="" disabled hidden>Selecione uma opção...</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão de Crédito/Débito</option>
          <option value="Pix">Pix</option>
        </select>
      </div>

      {/* AVISO GERAL PARA PAGAMENTOS NA ENTREGA */}
      {formaPagamento !== '' && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#1a1a1a', border: '1px solid #00ff66', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaMoneyBillWave size={24} color="#00ff66" />
          <p style={{ color: '#00ff66', margin: 0, fontSize: '0.95rem' }}>
            O pagamento será efetuado no momento da entrega, diretamente com o entregador.
          </p>
        </div>
      )}

      {/* BOTÕES TOTALMENTE IGUALADOS */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/catalogo')} className="botao" style={{ flex: 1, padding: '15px', fontSize: '1.1rem', backgroundColor: '#00a64d', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '8px' }} disabled={isProcessando}>
          Continuar Comprando
        </button>
        <button onClick={realizarCheckout} className="botao" style={{ flex: 1, padding: '15px', fontSize: '1.1rem', backgroundColor: '#00a64d', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '8px' }} disabled={isProcessando}>
          {isProcessando ? "Processando..." : "Finalizar Pedido"}
        </button>
      </div>
    </div>
  );
}

export default CartPage;