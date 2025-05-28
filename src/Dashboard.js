import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";

export default function Dashboard({ fechar }) {
  const usuario = auth.currentUser;
  const isDono = usuario?.email === "pesquisaciencia012@gmail.com";

  const [faturamento, setFaturamento] = useState(0);
  const [quantidade, setQuantidade] = useState(0);

  useEffect(() => {
    const carregarDados = async () => {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const lista = snapshot.docs.map((doc) => doc.data());

      const pedidosEntregues = lista.filter((p) => p.status === "Entregue");

      const totalFaturado = pedidosEntregues.reduce(
        (acc, p) => acc + (p.total || 0),
        0
      );
      const totalPedidos = pedidosEntregues.length;

      setFaturamento(totalFaturado);
      setQuantidade(totalPedidos);
    };

    if (isDono) carregarDados();
  }, [isDono]);

  if (!isDono) {
    return (
      <div className="cartao">
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar este painel.</p>
        <button onClick={fechar} className="botao botao-vermelho">
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="cartao">
      <h2 className="titulo-principal">📊 Dashboard</h2>

      <p>
        <b>Total de Pedidos Entregues:</b> {quantidade}
      </p>
      <p>
        <b>Faturamento Total:</b> R$ {faturamento.toFixed(2)}
      </p>

      <div style={{ marginTop: "10px" }}>
        <button onClick={fechar} className="botao botao-vermelho">
          Fechar
        </button>
      </div>
    </div>
  );
}