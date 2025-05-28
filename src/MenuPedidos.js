import React, { useEffect, useState } from "react";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

export default function MenuPedidos({ isDono }) {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const usuario = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "pedidos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map((doc) => ({
        idDoc: doc.id,
        idPedido: doc.data().idPedido,
        status: doc.data().status || "Em Preparo",
        itens: doc.data().itens,
        usuario: doc.data().usuario,
        userId: doc.data().userId,
        formaPagamento: doc.data().formaPagamento || "Não informado",
        data: doc.data().data || "",
        saidaTimestamp: doc.data().saidaTimestamp || null,
        total: doc.data().total || null,
      }));

      if (!isDono && usuario) {
        data = data.filter((pedido) => pedido.userId === usuario.uid);
      }

      // 🔥 Apagar pedidos com mais de 12 horas
      data.forEach(async (pedido) => {
        const dataPedido = new Date(pedido.data);
        const agora = new Date();
        const diferencaHoras = (agora - dataPedido) / (1000 * 60 * 60);

        if (diferencaHoras >= 12) {
          try {
            await deleteDoc(doc(db, "pedidos", pedido.idDoc));
            console.log(`🔥 Pedido ${pedido.idPedido} deletado por ter mais de 12 horas.`);
          } catch (error) {
            console.error("Erro ao deletar pedido antigo:", error);
          }
        }
      });

      // 🔥 Manter lógica de autoconfirmação de entrega após 2 horas no status "Saiu para Entrega"
      data.forEach(async (pedido) => {
        if (
          pedido.status === "Saiu para Entrega" &&
          pedido.saidaTimestamp &&
          Timestamp.now().seconds - pedido.saidaTimestamp.seconds >= 7200
        ) {
          await alterarStatus(pedido.idDoc, "Entregue");
        }
      });

      // 🔥 Filtrar e ordenar
      data.sort((a, b) => new Date(b.data) - new Date(a.data));
      setPedidos(data);
    });

    return () => unsubscribe();
  }, [isDono, usuario]);

  function proximoStatus(status) {
    if (status === "Em Preparo") return "Saiu para Entrega";
    if (status === "Saiu para Entrega") return "Entregue";
    return null;
  }

  function statusAnterior(status) {
    if (status === "Saiu para Entrega") return "Em Preparo";
    if (status === "Entregue") return "Saiu para Entrega";
    return null;
  }

  async function alterarStatus(idDoc, novoStatus) {
    try {
      const atualiza = { status: novoStatus };
      if (novoStatus === "Saiu para Entrega") {
        atualiza.saidaTimestamp = Timestamp.now();
      }
      if (novoStatus === "Em Preparo") {
        atualiza.saidaTimestamp = null;
      }
      await updateDoc(doc(db, "pedidos", idDoc), atualiza);
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

  const pedidosFiltrados =
    filtroStatus === "Todos"
      ? pedidos
      : pedidos.filter((p) => p.status === filtroStatus);

  return (
    <div>
      <h2 className="titulo-principal">📝 Menu de Pedidos</h2>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <b>Filtrar por Status:</b>{" "}
        </label>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #00ff66",
            backgroundColor: "#222",
            color: "#e0e0e0",
            marginLeft: "10px",
          }}
        >
          <option value="Todos">Todos</option>
          <option value="Em Preparo">Em Preparo</option>
          <option value="Saiu para Entrega">Saiu para Entrega</option>
          <option value="Entregue">Entregue</option>
        </select>
      </div>

      {pedidosFiltrados.map(
        ({
          idDoc,
          idPedido,
          status,
          itens,
          usuario: usuarioPedido,
          formaPagamento,
          total,
        }) => {
          const agrupamento = itens.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
          }, {});

          const totalPedido = total
            ? total
            : itens.reduce((acc, item) => acc + item.preco, 0) + 3;

          return (
            <div key={idDoc} className="cartao">
              <p>
                <b>ID:</b> {idPedido}
              </p>
              <p>
                <b>Status:</b> {status}
              </p>
              <p>
                <b>Itens:</b>{" "}
                {Object.entries(agrupamento)
                  .map(([nome, qtd]) => `${qtd}x ${nome}`)
                  .join(", ")}
              </p>
              <p>
                <b>Forma de Pagamento:</b> {formaPagamento}
              </p>
              <p>
                <b>Usuário:</b> {usuarioPedido}
              </p>
              <p style={{ fontWeight: "bold", color: "#00ff66" }}>
                💰 Total: R$ {totalPedido.toFixed(2)}
              </p>

              {isDono && (
                <div style={{ marginTop: "10px" }}>
                  {proximoStatus(status) && (
                    <button
                      className="botao"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Confirmar mudança para "${proximoStatus(
                              status
                            )}"?`
                          )
                        ) {
                          alterarStatus(idDoc, proximoStatus(status));
                        }
                      }}
                    >
                      ➡️ {proximoStatus(status)}
                    </button>
                  )}

                  {statusAnterior(status) && (
                    <button
                      className="botao botao-vermelho"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Deseja realmente voltar para "${statusAnterior(
                              status
                            )}"?`
                          )
                        ) {
                          alterarStatus(idDoc, statusAnterior(status));
                        }
                      }}
                    >
                      🔙 Voltar para {statusAnterior(status)}
                    </button>
                  )}

                  <button
                    className="botao botao-vermelho"
                    onClick={() => excluirPedido(idDoc)}
                  >
                    🗑️ Excluir Pedido
                  </button>
                </div>
              )}

              {!isDono && status === "Saiu para Entrega" && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    className="botao"
                    onClick={() => {
                      if (
                        window.confirm("Confirma que o pedido foi entregue?")
                      ) {
                        alterarStatus(idDoc, "Entregue");
                      }
                    }}
                  >
                    ✔️ Confirmar Entrega
                  </button>
                </div>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}