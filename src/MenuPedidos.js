import React, { useEffect, useState, useRef } from "react";
import { db } from "./firebaseConfig";
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import Toast from "./Toast";

export default function MenuPedidos({ isDono, usuario }) {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [toastMessage, setToastMessage] = useState("");
  const pedidosAnteriores = useRef([]);

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

      // Filtra para usuário comum ver só seus pedidos
      if (!isDono && usuario) {
        data = data.filter(pedido => pedido.userId === usuario.uid);
      }

      // 🚨 Detectar novos pedidos (apenas para dono)
      if (isDono) {
        const idsAnteriores = pedidosAnteriores.current.map(p => p.idDoc);
        const novosPedidos = data.filter(p => !idsAnteriores.includes(p.idDoc));

        if (pedidosAnteriores.current.length > 0 && novosPedidos.length > 0) {
          showToast(`🚨 ${novosPedidos.length} novo(s) pedido(s) recebido(s)!`);
        }

        pedidosAnteriores.current = data;
      }

      setPedidos(data);
    });

    return () => unsubscribe();
  }, [isDono, usuario]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 5000); // Notificação dura 5 segundos
  }

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

  const pedidosFiltrados = pedidos.filter(pedido =>
    filtroStatus === "Todos" || pedido.status === filtroStatus
  );

  return (
    <div>
      <h2>Menu de Pedidos</h2>

      {/* Filtro */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="filtroStatus" style={{ fontWeight: "bold", marginRight: "10px" }}>
          Filtrar por Status:
        </label>
        <select
          id="filtroStatus"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #00ff66",
            backgroundColor: "#222",
            color: "#e0e0e0",
            fontWeight: "600",
          }}
        >
          <option value="Todos">Todos</option>
          <option value="Em Preparo">Em Preparo</option>
          <option value="Saiu para Entrega">Saiu para Entrega</option>
          <option value="Entregue">Entregue</option>
        </select>
      </div>

      {pedidosFiltrados.length === 0 && <p>Nenhum pedido encontrado.</p>}

      {pedidosFiltrados.map(({ idDoc, idPedido, status, itens, usuario: usuarioPedido, formaPagamento }) => (
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

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}