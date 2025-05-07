import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "./firebaseConfig";
import {collection, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy, limit, startAfter, getDocs} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function PainelAdega() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [maisPedidos, setMaisPedidos] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const observer = useRef(null);

  const emailDono = "gobboe4@gmail.com";

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserEmail(user ? user.email : null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    setLoading(true);
    const pedidosRef = collection(db, "pedidos");
    const q = query(pedidosRef, orderBy("data", "desc"), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        usuario: doc.data().usuario || "Desconhecido",
        itens: doc.data().itens || [],
        status: doc.data().status || "Pendente",
        data: doc.data().data || new Date().toISOString(),
      }));

      setPedidos(listaPedidos);
      setUltimoPedido(snapshot.docs[snapshot.docs.length - 1] || null);
      setMaisPedidos(snapshot.docs.length === 5);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const carregarMaisPedidos = useCallback(async () => {
    if (!maisPedidos || !ultimoPedido) return;

    try {
      const pedidosRef = collection(db, "pedidos");
      const q = query(pedidosRef, orderBy("data", "desc"), startAfter(ultimoPedido), limit(5));
      const snapshot = await getDocs(q);
      const novosPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        usuario: doc.data().usuario || "Desconhecido",
        itens: doc.data().itens || [],
        status: doc.data().status || "Pendente",
        data: doc.data().data || new Date().toISOString(),
      }));

      setPedidos((prev) => [...prev, ...novosPedidos]);
      setUltimoPedido(snapshot.docs[snapshot.docs.length - 1] || null);
      setMaisPedidos(snapshot.docs.length === 5);
    } catch (error) {
      console.error("Erro ao carregar mais pedidos:", error);
    }
  }, [maisPedidos, ultimoPedido]);

  const atualizarStatus = useCallback(async (id, novoStatus) => {
    if (userEmail !== emailDono) return;

    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, { status: novoStatus });
      setPedidos((prev) => prev.map((pedido) => (pedido.id === id ? { ...pedido, status: novoStatus } : pedido)));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  }, [userEmail]);

  const excluirPedido = useCallback(async (id) => {
    if (userEmail !== emailDono) return;
    if (!window.confirm("Tem certeza que deseja excluir este pedido?")) return;

    try {
      await deleteDoc(doc(db, "pedidos", id));
      setPedidos((prev) => prev.filter((pedido) => pedido.id !== id));
      alert("Pedido excluído com sucesso!");
    } catch (error) {
      alert("Erro ao excluir pedido: " + error.message);
    }
  }, [userEmail]);

  const lastPedidoElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && maisPedidos) {
          carregarMaisPedidos();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, maisPedidos, carregarMaisPedidos]
  );

  return (
    <div className="container">
      <h1 className="titulo-principal">📦 Painel de Pedidos</h1>
      {loading ? (
        <p style={{ textAlign: 'center' }}>Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Nenhum pedido encontrado.</p>
      ) : (
        <div className="painel">
          {pedidos.map((pedido, index) => (
            <div key={pedido.id} ref={index === pedidos.length - 1 ? lastPedidoElementRef : null} className="cartao">
              <h2>Pedido de {pedido.usuario}</h2>
              <p>Status: <b>{pedido.status}</b></p>
              <ul>
                {pedido.itens.map((item, idx) => (
                  <li key={idx}>{item.nome} - R$ {item.preco?.toFixed(2) || "0.00"}</li>
                ))}
              </ul>
              {userEmail === emailDono && (
                <div style={{ marginTop: '12px' }}>
                  <button onClick={() => atualizarStatus(pedido.id, "Em Preparo")} className="botao" style={{ backgroundColor: '#ff8c00' }}>
                    Em Preparo
                  </button>
                  <button onClick={() => atualizarStatus(pedido.id, "Saiu para Entrega")} className="botao" style={{ backgroundColor: '#ffd700' }}>
                    Saiu para Entrega
                  </button>
                  <button onClick={() => atualizarStatus(pedido.id, "Entregue")} className="botao botao-verde">
                    Entregue
                  </button>
                  <button onClick={() => excluirPedido(pedido.id)} className="botao botao-vermelho">
                    ❌ Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}