import React, { useEffect, useState } from "react";
import { db, } from "./firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function MenuPedidos({ isDono, usuario }) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "pedidos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        idDoc: doc.id,
        idPedido: doc.data().idPedido,
        status: doc.data().status || "Em Preparo",
        itens: doc.data().itens,
        usuario: doc.data().usuario,
        userId: doc.data().userId,
        formaPagamento: doc.data().formaPagamento || "Não informado",
      }));

      // Filtra os pedidos se não for dono
      if (!isDono && usuario) {
        data = data.filter(pedido => pedido.userId === usuario.uid);
      }

      setPedidos(data);
    });

    return () => unsubscribe();
  }, [isDono, usuario]);

  async function alterarStatus(idDoc, novoStatus) {
    try {
      await updateDoc(doc(db, "pedidos", idDoc), { status: novoStatus });
    } catch (error) {
      console.error("Erro ao alterar status: ", error);
    }
  }

  async function excluirPedido(idDoc) {
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      await deleteDoc(doc(db, "pedidos", idDoc));
    } catch (error) {
      console.error("Erro ao excluir pedido: ", error);
    }
  }

  // Função para agrupar os itens
  function agruparItens(itens) {
    const agrupado = {};

    itens.forEach(item => {
      if (agrupado[item.nome]) {
        agrupado[item.nome].quantidade += 1;
      } else {
        agrupado[item.nome] = { ...item, quantidade: 1 };
      }
    });

    return Object.values(agrupado);
  }

  return (
    <div>
      <h2>Menu de Pedidos</h2>
      {pedidos.length === 0 && <p>Nenhum pedido encontrado.</p>}

      {pedidos.map(({ idDoc, idPedido, status, itens, usuario: usuarioPedido, formaPagamento }) => (
        <div key={idDoc} className="cartao">
          <p><b>ID:</b> {idPedido}</p>
          <p><b>Status:</b> {status}</p>
          <p><b>Usuário:</b> {usuarioPedido}</p>
          <p><b>Forma de Pagamento:</b> {formaPagamento}</p>
          <p><b>Itens:</b></p>
          <ul>
            {agruparItens(itens).map((item, idx) => (
              <li key={idx}>
                {item.quantidade}x {item.nome}
              </li>
            ))}
          </ul>

          {isDono && (
            <>
              <button
                className="botao"
                disabled={status === "Em Preparo"}
                onClick={() => alterarStatus(idDoc, "Em Preparo")}
              >
                Em Preparo
              </button>
              <button
                className="botao"
                disabled={status === "Saiu para Entrega"}
                onClick={() => alterarStatus(idDoc, "Saiu para Entrega")}
              >
                Saiu para Entrega
              </button>
              <button
                className="botao"
                disabled={status === "Entregue"}
                onClick={() => alterarStatus(idDoc, "Entregue")}
              >
                Entregue
              </button>
              <button
                className="botao botao-vermelho"
                onClick={() => excluirPedido(idDoc)}
              >
                Excluir Pedido
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}