import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { FaTrash, FaPlus, FaMinus, FaMoneyBillWave } from 'react-icons/fa';

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
    if (!carrinho.length) { showToast("Seu carrinho está vazio!", 'error'); return; }
    if (!formaPagamento) { showToast("Por favor, informe a forma de pagamento.", 'error'); return; }

    let enderecoFinal = {};
    if (tipoEndereco === 'padrao') {
      if (!hasAddress) { 
        showToast("Complete suas informações de endereço no perfil antes de pedir.", 'error');
        navigate('/perfil'); return;
      }
      enderecoFinal = { nome: dadosUsuario.nome, telefone: dadosUsuario.telefone, rua: dadosUsuario.rua, numero: dadosUsuario.numero, referencia: dadosUsuario.referencia || '' };
    } else {
      if (!enderecoAlternativo.rua || !enderecoAlternativo.numero) {
        showToast("Preencha a rua e o número para a entrega.", 'error'); return;
      }
      enderecoFinal = { ...enderecoAlternativo, nome: dadosUsuario?.nome || 'Cliente', telefone: dadosUsuario?.telefone || '' };
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
          if (item.tipo === 'combo') { item.itens.forEach(i => refsSet.add(String(i.id))); } else { refsSet.add(String(item.id)); }
        });

        const refsArray = Array.from(refsSet);
        const produtosRefs = refsArray.map(id => doc(db, "produtos", id));
        const produtosSnapshots = {};

        for (let i = 0; i < produtosRefs.length; i++) {
          const snap = await transaction.get(produtosRefs[i]);
          if (snap.exists()) { produtosSnapshots[refsArray[i]] = snap.data(); }
        }

        const consumoEstoque = {};

        carrinho.forEach(item => {
          if (item.tipo === 'combo') {
            totalProdutosSeguro += (item.preco * item.quantidade);
            item.itens.forEach(i => {
              const idProd = String(i.id);
              if (!consumoEstoque[idProd]) consumoEstoque[idProd] = 0;
              consumoEstoque[idProd] += (i.qtd * item.quantidade);
              if (produtosSnapshots[idProd]) { volumeTotalSeguro += (produtosSnapshots[idProd].volume * i.qtd * item.quantidade); }
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
          if (dados.estoque < qtdNecessaria) { throw new Error(`Estoque insuficiente para: ${dados.nome}. Restam ${dados.estoque}.`); }
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
          idPedido, usuario: usuario.email, userId: usuario.uid, enderecoEntrega: enderecoFinal,
          itens: carrinho, formaPagamento, status: "Em Preparo", data: new Date().toISOString(),
          total: totalComFreteSeguro, codigoSeguranca: codigoSeguranca
        });
      });

      limparCarrinho();
      setFormaPagamento("");
      showToast(`Pedido #${idPedido} criado com sucesso!`); 
      navigate('/pedidos'); 

    } catch (err) {
      showToast(err.message || "Erro ao processar pedido.", 'error'); 
    } finally {
      setIsProcessando(false);
    }
  };

  if (carrinho.length === 0) {
    return (
      <div className="cartao" style={{ textAlign: 'center', padding: '50px 20px', marginTop: '40px' }}>
        <h2 style={{ color: '#00ff66', fontSize: '2rem', marginBottom: '20px' }}>Carrinho Vazio</h2>
        <p style={{ color: '#ccc', marginBottom: '30px' }}>Adicione algumas bebidas para começar a festa!</p>
        <button onClick={() => navigate('/catalogo')} className="botao">Voltar ao Catálogo</button>
      </div>
    );
  }

  return (
    <div className="cartao">
      <h2 style={{ color: '#00ff66', textAlign: 'center', marginBottom: '30px' }}>Seu Carrinho</h2>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {carrinho.map((item) => (
          <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', padding: '15px 0', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: '1 1 100%', minWidth: '150px' }}>
              <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{item.nome}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => removerDoCarrinho(item.id)} style={{ background: '#222', color: '#00ff66', border: '1px solid #00ff66', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}><FaMinus size={10}/></button>
              <span style={{ color: '#fff', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantidade}</span>
              <button onClick={() => adicionarAoCarrinho(item)} disabled={item.quantidade >= item.estoque} style={{ background: '#222', color: '#00ff66', border: '1px solid #00ff66', borderRadius: '50%', width: '30px', height: '30px', cursor: item.quantidade >= item.estoque ? 'not-allowed' : 'pointer' }}><FaPlus size={10}/></button>
            </div>

            <div style={{ color: '#00ff66', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>
              R$ {calcularTotalItem(item).toFixed(2)}
            </div>

            <button onClick={() => excluirDoCarrinho(item.id)} style={{ padding: '8px', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer' }}>
              <FaTrash size={18} />
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', borderLeft: '4px solid #00ff66' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#00ff66' }}>Resumo do Pedido</h3>
        <p style={{ color: '#ccc', marginBottom: '8px' }}>Subtotal dos Produtos: <strong style={{ color: '#fff' }}>R$ {totalProdutos.toFixed(2)}</strong></p>
        <p style={{ color: '#ccc' }}>Custo de Entrega: <strong style={{ color: '#fff' }}>R$ {freteFinal.toFixed(2)}</strong></p>
        <h2 style={{ color: '#fff', borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
          Total a Pagar: <span style={{ color: '#00ff66' }}>R$ {totalComFrete.toFixed(2)}</span>
        </h2>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#00ff66', marginBottom: '15px' }}>Endereço de Entrega</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="radio" name="endereco" value="padrao" checked={tipoEndereco === 'padrao'} onChange={() => setTipoEndereco('padrao')} />
            Entregar no meu endereço cadastrado
          </label>
          
          {tipoEndereco === 'padrao' && hasAddress && <div style={{ marginLeft: '25px', color: '#ccc' }}>{dadosUsuario.rua}, {dadosUsuario.numero}</div>}
          {tipoEndereco === 'padrao' && !hasAddress && <div style={{ marginLeft: '25px', color: '#ff4444' }}>Você ainda não preencheu seu endereço no perfil.</div>}

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="radio" name="endereco" value="outro" checked={tipoEndereco === 'outro'} onChange={() => setTipoEndereco('outro')} />
            Entregar em outro endereço
          </label>
        </div>

        {tipoEndereco === 'outro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            <input placeholder="Rua" value={enderecoAlternativo.rua} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, rua: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
            <input placeholder="Número" value={enderecoAlternativo.numero} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, numero: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
            <input placeholder="Ponto de Referência (Opcional)" value={enderecoAlternativo.referencia} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, referencia: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', background: '#111', color: '#fff' }} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#00ff66', marginBottom: '15px' }}>Forma de Pagamento</h3>
        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}>
          <option value="" disabled hidden>Selecione uma opção...</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão de Crédito/Débito</option>
          <option value="Pix">Pix</option>
        </select>
      </div>

      {formaPagamento !== '' && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#1a1a1a', border: '1px dashed #00ff66', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaMoneyBillWave size={24} color="#00ff66" />
          <p style={{ color: '#00ff66', margin: 0 }}>O pagamento será efetuado na entrega.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/catalogo')} className="botao" style={{ flex: 1, padding: '15px' }} disabled={isProcessando}>Continuar Comprando</button>
        <button onClick={realizarCheckout} className="botao" style={{ flex: 1, padding: '15px' }} disabled={isProcessando}>{isProcessando ? "Processando..." : "Finalizar Pedido"}</button>
      </div>
    </div>
  );
}

export default CartPage;