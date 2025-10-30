import React from "react";

// --- MUDANÇA 1: Receber as novas props: hasAddress e abrirPaginaConta ---
function CartPage({
  carrinho,
  removerDoCarrinho,
  adicionarAoCarrinho,
  totalCarrinho,
  freteCalculado,
  totalComFrete,
  formaPagamento,
  setFormaPagamento,
  finalizarPedido,
  hasAddress,
  abrirPaginaConta,
}) {

  if (carrinho.length === 0) {
    return (
      <div className="cartao">
        <h2 className="titulo-principal">🛒 Carrinho</h2>
        <p>Seu carrinho está vazio.</p>
      </div>
    );
  }

  return (
    <div className="cartao">
      <h2 className="titulo-principal">🛒 Carrinho</h2>
      <ul className="lista-carrinho">
        {carrinho.map((item) => (
          <li key={item.id}>
            <span>
              {item.nome} (R$ {item.preco.toFixed(2)} cada)
            </span>
            <div className="controles-quantidade">
              <button
                onClick={() => removerDoCarrinho(item.id)}
                className="botao-quantidade"
              >
                -
              </button>
              <span className="quantidade">{item.quantidade}</span>
              <button
                onClick={() => adicionarAoCarrinho(item)}
                className="botao-quantidade"
              >
                +
              </button>
            </div>
            <span className="subtotal-item">
              R$ {(item.preco * item.quantidade).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {/* Totais (sem mudanças) */}
      <p style={{ fontWeight: "bold", marginTop: "10px", color: "#00ff66" }}>
        🧾 Subtotal: R$ {totalCarrinho.toFixed(2)}
      </p>
      <p style={{ fontWeight: "bold", color: "#00ff66" }}>
        🚚 Frete: R$ {freteCalculado.toFixed(2)}
      </p>
      <p style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#00ff66" }}>
        💰 Total: R$ {totalComFrete.toFixed(2)}
      </p>

      {/* --- MUDANÇA 2: Etapa de Endereço/Pagamento (RNF01.1 e RF06) --- */}
      {/* Verifica se o usuário tem endereço preenchido  */}
      {hasAddress ? (
        <>
          {/* 1. Se tem endereço, mostra o formulário de pagamento */}
          <label htmlFor="formaPagamento" style={{ fontWeight: "bold", marginTop: '20px' }}>
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
        </>
      ) : (
        <>
          {/* 2. Se NÃO tem endereço, mostra o aviso (Etapa 2: Endereço)  */}
          <div 
            style={{ 
              border: '1px solid var(--cor-vermelho-hover)', 
              borderRadius: 'var(--radius-padrao)', 
              padding: '15px', 
              marginTop: '20px',
              backgroundColor: 'rgba(204, 0, 0, 0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#ff6666' }}>⚠️ Endereço Incompleto</h3>
            <p style={{ margin: 0, color: '#e0e0e0' }}>
              Você precisa preencher seus dados (nome, endereço, telefone) no seu perfil 
              para poder finalizar o pedido.
            </p>
            <button 
              onClick={abrirPaginaConta} 
              className="botao" 
              style={{marginTop: '15px'}}
            >
              Ir para o Perfil
            </button>
          </div>
        </>
      )}
      {/* --- FIM DA MUDANÇA 2 --- */}

    </div>
  );
}

export default CartPage;