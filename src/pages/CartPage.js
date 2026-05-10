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
  
  const [tipoEndereco, setTipoEndereco] = useState('padrao');
  const [enderecoAlternativo, setEnderecoAlternativo] = useState({ rua: '', numero: '', referencia: '' });
  
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

    let enderecoFinal = {};
    if (tipoEndereco === 'padrao') {
      if (!hasAddress) { 
        showToast("Complete suas informações de endereço no perfil antes de pedir.", 'error');
        navigate('/perfil');
        return;
      }
      enderecoFinal = { 
        nome: dadosUsuario.nome,
        telefone: dadosUsuario.telefone,
        rua: dadosUsuario.rua,
        numero: dadosUsuario.numero,
        referencia: dadosUsuario.referencia || ''
      };
    } else {
      if (!enderecoAlternativo.rua || !enderecoAlternativo.numero) {
        showToast("Preencha a rua e o número para a entrega.", 'error');
        return;
      }
      enderecoFinal = { 
        ...enderecoAlternativo, 
        nome: dadosUsuario?.nome || 'Cliente',
        telefone: dadosUsuario?.telefone || ''
      };
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
          enderecoEntrega: enderecoFinal,
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
      <div className="cartao-vazio">
        <h2 className="titulo-principal">Carrinho Vazio</h2>
        <p>Adicione algumas bebidas para começar a festa!</p>
        <button onClick={() => navigate('/catalogo')} className="btn-acao-grande">
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="cartao-carrinho">
      <h2 className="cart-titulo-principal">Seu Carrinho</h2>
      
      <ul className="lista-carrinho">
        {carrinho.map((item) => (
          <li key={item.id} className="cart-item-row">
            <div className="item-nome-container">
              <span className="item-nome">{item.nome}</span>
            </div>

            <div className="controles-quantidade">
              <button className="botao-quantidade" onClick={() => removerDoCarrinho(item.id)}><FaMinus size={10}/></button>
              <span className="quantidade-texto">{item.quantidade}</span>
              <button className="botao-quantidade" onClick={() => adicionarAoCarrinho(item)} disabled={item.quantidade >= item.estoque}>
                <FaPlus size={10}/>
              </button>
            </div>

            <div className="item-total-valor">
              R$ {calcularTotalItem(item).toFixed(2)}
            </div>

            <button className="btn-excluir-item" onClick={() => excluirDoCarrinho(item.id)}>
              <FaTrash size={18} />
            </button>
          </li>
        ))}
      </ul>

      <div className="resumo-container">
        <h3 className="resumo-titulo">Resumo do Pedido</h3>
        <p className="resumo-linha">Subtotal dos Produtos: <strong className="resumo-valor">R$ {totalProdutos.toFixed(2)}</strong></p>
        <p className="resumo-linha">Custo de Entrega ({viagensNecessarias} viagem/ns): <strong className="resumo-valor">R$ {freteFinal.toFixed(2)}</strong></p>
        <h2 className="resumo-total-final">
          Total a Pagar: <span className="resumo-total-destaque">R$ {totalComFrete.toFixed(2)}</span>
        </h2>
      </div>

      <div className="secao-container">
        <h3 className="secao-titulo">Endereço de Entrega</h3>
        
        <div className="radio-group">
          <label className="radio-label">
            <input 
              type="radio" 
              name="endereco" 
              value="padrao" 
              checked={tipoEndereco === 'padrao'} 
              onChange={() => setTipoEndereco('padrao')} 
            />
            Entregar no meu endereço cadastrado
          </label>
          
          {tipoEndereco === 'padrao' && hasAddress && (
            <div className="endereco-salvo-texto">
              {dadosUsuario.rua}, {dadosUsuario.numero}
            </div>
          )}
          {tipoEndereco === 'padrao' && !hasAddress && (
            <div className="endereco-erro-texto">
              Você ainda não preencheu seu endereço no perfil.
            </div>
          )}

          <label className="radio-label">
            <input 
              type="radio" 
              name="endereco" 
              value="outro" 
              checked={tipoEndereco === 'outro'} 
              onChange={() => setTipoEndereco('outro')} 
            />
            Entregar em outro endereço
          </label>
        </div>

        {tipoEndereco === 'outro' && (
          <div className="formulario-endereco">
            <input 
              placeholder="Rua" 
              className="input-estilizado"
              value={enderecoAlternativo.rua} 
              onChange={e => setEnderecoAlternativo({...enderecoAlternativo, rua: e.target.value})} 
            />
            <input 
              placeholder="Número" 
              className="input-estilizado"
              value={enderecoAlternativo.numero} 
              onChange={e => setEnderecoAlternativo({...enderecoAlternativo, numero: e.target.value})} 
            />
            <input 
              placeholder="Ponto de Referência (Opcional)" 
              className="input-estilizado"
              value={enderecoAlternativo.referencia} 
              onChange={e => setEnderecoAlternativo({...enderecoAlternativo, referencia: e.target.value})} 
            />
          </div>
        )}
      </div>

      <div className="secao-container">
        <h3 className="secao-titulo">Forma de Pagamento</h3>
        <select 
          value={formaPagamento} 
          onChange={(e) => setFormaPagamento(e.target.value)}
          className="select-pagamento"
        >
          <option value="" disabled hidden>Selecione uma opção...</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão de Crédito/Débito</option>
          <option value="Pix">Pix</option>
        </select>
      </div>

      {formaPagamento !== '' && (
        <div className="aviso-pagamento">
          <FaMoneyBillWave size={24} color="#00ff66" />
          <p className="aviso-texto">
            O pagamento será efetuado no momento da entrega, diretamente com o entregador.
          </p>
        </div>
      )}

      <div className="botoes-acao-container">
        <button onClick={() => navigate('/catalogo')} className="btn-acao-grande" disabled={isProcessando}>
          Continuar Comprando
        </button>
        <button onClick={realizarCheckout} className="btn-acao-grande" disabled={isProcessando}>
          {isProcessando ? "Processando..." : "Finalizar Pedido"}
        </button>
      </div>
    </div>
  );
}

export default CartPage;