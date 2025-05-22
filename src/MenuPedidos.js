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
      }));

      // 🔒 Filtra para usuário comum ver só seus próprios pedidos
      if (!isDono && usuario) {
        data = data.filter((pedido) => pedido.userId === usuario.uid);
      }

      // 🔄 Ordenação dos pedidos do mais recente para o mais antigo
      data.sort((a, b) => new Date(b.data) - new Date(a.data));

      // ⏳ Verificar se há pedidos que passaram de 2 horas no status "Saiu para Entrega"
      data.forEach(async (pedido) => {
        if (
          pedido.status === "Saiu para Entrega" &&
          pedido.saidaTimestamp &&
          Timestamp.now().seconds - pedido.saidaTimestamp.seconds >= 7200
        ) {
          await alterarStatus(pedido.idDoc, "Entregue");
        }
      });

      setPedidos(data);
    });

    return () => unsubscribe();
  }, [isDono, usuario]);

  // 🔄 Avançar status
  function proximoStatus(status) {
    if (status === "Em Preparo") return "Saiu para Entrega";
    if (status === "Saiu para Entrega") return "Entregue";
    return null;
  }

  // 🔙 Status anterior (desfazer)
  function statusAnterior(status) {
    if (status === "Saiu para Entrega") return "Em Preparo";
    if (status === "Entregue") return "Saiu para Entrega";
    return null;
  }

  // 🔥 Alterar status
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

  // 🗑️ Excluir pedido
  async function excluirPedido(idDoc) {
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;
    try {
      await deleteDoc(doc(db, "pedidos", idDoc));
    } catch (error) {
      console.error("Erro ao excluir pedido: ", error);
    }
  }

  // 🎯 Aplicar filtro de status
  const pedidosFiltrados =
    filtroStatus === "Todos"
      ? pedidos
      : pedidos.filter((p) => p.status === filtroStatus);

  return (
    <div>
      <h2>Menu de Pedidos</h2>

      {/* 🔎 Filtro de status */}
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
        }) => {
          const agrupamento = itens.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
          }, {});

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

              {/* 🔥 Dono controla todos os pedidos */}
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

              {/* ✅ Cliente pode confirmar entrega */}
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