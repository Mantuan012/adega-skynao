import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { useCart } from '../contexts/CartContext';
import { FaTrash, FaPlus, FaMinus, FaMoneyBillWave, FaArrowLeft, FaCheck } from 'react-icons/fa';
import './CartPage.css';

function gerarIdPedido() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function CartPage({ usuario, dadosUsuario, showToast }) {
  const [formaPagamento, setFormaPagamento] = useState('');
  const [isProcessando, setIsProcessando] = useState(false);
  const [tipoEndereco, setTipoEndereco] = useState('padrao');
  
  const [enderecoAlternativo, setEnderecoAlternativo] = useState({ 
    nome: '',
    ruaENumero: '', 
    bairro: '', 
    complemento: '', 
    referencia: '', 
    cidade: 'Pontal' 
  });
  
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
      
      enderecoFinal = { 
        nome: dadosUsuario.nome, 
        telefone: dadosUsuario.telefone, 
        rua: dadosUsuario.rua, 
        numero: dadosUsuario.numero, 
        bairro: dadosUsuario.bairro || 'Não informado',
        complemento: dadosUsuario.complemento || '',
        referencia: dadosUsuario.referencia || '',
        cidade: 'Pontal'
      };
    } else {
      if (!enderecoAlternativo.nome || !enderecoAlternativo.ruaENumero || !enderecoAlternativo.bairro) {
        showToast("Preencha o nome, endereço completo e bairro para a entrega.", 'error'); return;
      }
      
      enderecoFinal = { 
        nome: enderecoAlternativo.nome,
        telefone: dadosUsuario?.telefone || '',
        rua: enderecoAlternativo.ruaENumero,
        numero: '', 
        bairro: enderecoAlternativo.bairro,
        complemento: enderecoAlternativo.complemento,
        referencia: enderecoAlternativo.referencia,
        cidade: 'Pontal'
      };
    }

    setIsProcessando(true);
    const idPedido = gerarIdPedido();

    try {
      await runTransaction(db, async (transaction) => {
        // 1. OBRIGATÓRIO DO FIREBASE: Todas as leituras (get) precisam vir antes das gravações (set/update)
        const controleCodigosRef = doc(db, "configuracoes", "controleCodigos");
        const controleSnap = await transaction.get(controleCodigosRef);

        let totalProdutosSeguro = 0;
        let volumeTotalSeguro = 0;
        const refsSet = new Set();
        
        carrinho.forEach(item => {
          if (item.tipo === 'combo') { item.itens.forEach(i => refsSet.add(String(i.id))); } 
          else { refsSet.add(String(item.id)); }
        });

        const refsArray = Array.from(refsSet);
        const produtosRefs = refsArray.map(id => doc(db, "produtos", id));
        const produtosSnapshots = {};

        for (let i = 0; i < produtosRefs.length; i++) {
          const snap = await transaction.get(produtosRefs[i]);
          if (snap.exists()) { produtosSnapshots[refsArray[i]] = snap.data(); }
        }

        // 2. LÓGICA DO CÓDIGO ÚNICO DIÁRIO E BLINDADO
        const agora = new Date();
        const dataTurnoObj = new Date(agora);
        // Se for antes das 5h da manhã, ainda conta como o expediente do dia anterior
        if (agora.getHours() < 5) dataTurnoObj.setDate(dataTurnoObj.getDate() - 1);
        const dataTurnoStr = `${dataTurnoObj.getFullYear()}-${dataTurnoObj.getMonth() + 1}-${dataTurnoObj.getDate()}`;

        let codigosUsados = [];
        if (controleSnap.exists()) {
          const dadosControle = controleSnap.data();
          // Se estamos no mesmo turno, puxa a lista. Se virou o turno, a lista nasce zerada.
          if (dadosControle.dataTurno === dataTurnoStr) {
            codigosUsados = dadosControle.codigosUsados || [];
          }
        }

        let codigoSeguranca = "";
        do {
          // Sorteia de 0000 a 9999 garantindo os zeros à esquerda (ex: 0042)
          codigoSeguranca = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        } while (codigosUsados.includes(codigoSeguranca)); // Fica em loop até achar um inédito

        codigosUsados.push(codigoSeguranca);

        // 3. LÓGICA DE ESTOQUE E CUSTOS
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

        // 4. GRAVAÇÕES DE DADOS (Set / Update)
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

        // Salva a nova lista de códigos usados do turno
        transaction.set(controleCodigosRef, {
          dataTurno: dataTurnoStr,
          codigosUsados: codigosUsados
        }, { merge: true });
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
      <div className="cartao mensagem-vazio">
        <div className="mascote-vazio-container">
          <img src="/mascote.jpeg" alt="Carrinho Vazio" className="mascote-img" />
          <h2 style={{ color: '#00ff66', margin: '10px 0' }}>Seu Carrinho está Vazio</h2>
          <p style={{ color: '#ccc' }}>Adicione algumas bebidas para começar a festa!</p>
          <button onClick={() => navigate('/catalogo')} className="botao" style={{ marginTop: '20px' }}>
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cartao">
      <h2 className="titulo-principal">Seu Carrinho</h2>
      
      <ul className="lista-carrinho">
        {carrinho.map((item) => (
          <li key={item.id} className="item-carrinho">
            
            <div className="info-produto-carrinho">
              <h4 className="nome-produto-carrinho">{item.nome}</h4>
              <button onClick={() => excluirDoCarrinho(item.id)} className="btn-remover-item" title="Remover item">
                <FaTrash size={16} />
              </button>
            </div>

            <div className="controles-e-preco">
              <div className="controles-quantidade">
                <button onClick={() => removerDoCarrinho(item.id)} className="botao-quantidade">
                  <FaMinus size={12}/>
                </button>
                <span className="quantidade-numero">{item.quantidade}</span>
                <button onClick={() => adicionarAoCarrinho(item)} disabled={item.quantidade >= item.estoque} className="botao-quantidade">
                  <FaPlus size={12}/>
                </button>
              </div>

              <div className="preco-carrinho">
                R$ {calcularTotalItem(item).toFixed(2)}
              </div>
            </div>

          </li>
        ))}
      </ul>

      <div className="resumo-pedido-box">
        <h3 className="titulo-checkout">Resumo do Pedido</h3>
        <div className="resumo-linha">
          <span>Subtotal dos Produtos:</span> <strong>R$ {totalProdutos.toFixed(2)}</strong>
        </div>
        <div className="resumo-linha">
          <span>Custo de Entrega:</span> <strong>R$ {freteFinal.toFixed(2)}</strong>
        </div>
        <div className="resumo-total">
          Total a Pagar: <span>R$ {totalComFrete.toFixed(2)}</span>
        </div>
      </div>

      <div className="secao-checkout">
        <h3 className="titulo-checkout">Endereço de Entrega</h3>
        
        <div className="radio-group">
          <label className="radio-label">
            <input type="radio" name="endereco" value="padrao" checked={tipoEndereco === 'padrao'} onChange={() => setTipoEndereco('padrao')} />
            Entregar no meu endereço cadastrado
          </label>
          
          {tipoEndereco === 'padrao' && hasAddress && (
            <div className="endereco-padrao-info">
              {dadosUsuario.rua}, {dadosUsuario.numero}
            </div>
          )}
          {tipoEndereco === 'padrao' && !hasAddress && (
            <div className="endereco-padrao-erro">
              Você ainda não preencheu seu endereço no perfil.
            </div>
          )}

          <label className="radio-label">
            <input type="radio" name="endereco" value="outro" checked={tipoEndereco === 'outro'} onChange={() => setTipoEndereco('outro')} />
            Entregar em outro endereço
          </label>
        </div>

        {tipoEndereco === 'outro' && (
          <div className="form-endereco-alternativo">
            <input value="Cidade: Pontal - SP" disabled className="input-checkout" />
            <input placeholder="Nome de quem vai receber" value={enderecoAlternativo.nome} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, nome: e.target.value})} className="input-checkout" />
            <input placeholder="Endereço (Rua e Número)" value={enderecoAlternativo.ruaENumero} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, ruaENumero: e.target.value})} className="input-checkout" />
            <input placeholder="Bairro" value={enderecoAlternativo.bairro} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, bairro: e.target.value})} className="input-checkout" />
            <input placeholder="Complemento / Apartamento (Opcional)" value={enderecoAlternativo.complemento} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, complemento: e.target.value})} className="input-checkout" />
            <input placeholder="Ponto de Referência (Opcional)" value={enderecoAlternativo.referencia} onChange={e => setEnderecoAlternativo({...enderecoAlternativo, referencia: e.target.value})} className="input-checkout" />
          </div>
        )}
      </div>

      <div className="secao-checkout">
        <h3 className="titulo-checkout">Forma de Pagamento</h3>
        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="input-checkout">
          <option value="" disabled hidden>Selecione uma opção...</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão de Crédito/Débito</option>
          <option value="Pix">Pix</option>
        </select>
      </div>

      {formaPagamento !== '' && (
        <div className="aviso-pagamento">
          <FaMoneyBillWave size={24} color="#00ff66" />
          <p>O pagamento será efetuado na entrega.</p>
        </div>
      )}

      <div className="botoes-checkout">
        <button onClick={() => navigate('/catalogo')} className="botao btn-continuar-comprando" disabled={isProcessando}>
          <FaArrowLeft /> Continuar Comprando
        </button>
        <button onClick={realizarCheckout} className="botao" disabled={isProcessando}>
          {isProcessando ? "Processando..." : <><FaCheck /> Finalizar Pedido</>}
        </button>
      </div>
    </div>
  );
}

export default CartPage;