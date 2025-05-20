import React, { useEffect, useState } from "react";
import { db, auth } from "./firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function MenuPedidos({ isDono }) {
  const [pedidos, setPedidos] = useState([]);
  const usuario = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "pedidos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        idDoc: doc.id,
        idPedido: doc.data().idPedido,
        status: doc.data().status || "Em Preparo",
        itens: doc.data().itens,
        usuario: doc.data().usuario,
        formaPagamento: doc.data().formaPagamento || "Não informado",
      }));
      setPedidos(data);
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <div>
      <h2>Menu de Pedidos</h2>
      {pedidos.map(({ idDoc, idPedido, status, itens, usuario: usuarioPedido, formaPagamento }) => (
        <div key={idDoc} className="cartao">
          <p><b>ID:</b> {idPedido}</p>
          <p><b>Status:</b> {status}</p>
          <p><b>Itens:</b> {itens.map(item => item.nome).join(", ")}</p>
          <p><b>Forma de Pagamento:</b> {formaPagamento}</p>

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