import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import dayjs from 'dayjs';

// Instancia o áudio fora do componente para não recriar a cada renderização
const somNotificacao = new Audio('/alerta.mp3');

const AlertaPedidos = ({ isDono }) => {
  const isFirstLoad = useRef(true);
  const idsConhecidos = useRef(new Set());

  useEffect(() => {
    // Se não for admin/dono, não precisamos gastar internet ouvindo pedidos
    if (!isDono) return;

    // Calcula o início do turno para ouvir apenas os pedidos recentes
    const agora = dayjs();
    const inicioTurno = agora.hour() < 5 
      ? agora.subtract(1, 'day').hour(5).minute(0).second(0).toISOString()
      : agora.hour(5).minute(0).second(0).toISOString();

    // Uma query fixa e estável que NUNCA muda com cliques na tela
    const q = query(
      collection(db, "pedidos"),
      where("data", ">=", inicioTurno),
      orderBy("data", "desc"),
      limit(20) // Ouve apenas os 20 mais recentes para ser leve
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let tocarAlarme = false;

      querySnapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          // Se o pedido não está na memória
          if (!idsConhecidos.current.has(change.doc.id)) {
            idsConhecidos.current.add(change.doc.id);
            
            // Se não é a primeira carga do sistema, é pedido novo real
            if (!isFirstLoad.current) {
              tocarAlarme = true;
            }
          }
        }
      });

      if (tocarAlarme) {
        somNotificacao.play().catch(erro => console.warn("Navegador bloqueou o áudio. Clique na tela para liberar.", erro));
      }

      isFirstLoad.current = false;
    });

    // Limpa o ouvinte caso o dono faça logout
    return () => unsubscribe();
  }, [isDono]);

  return null; // Componente "fantasma", não aparece no HTML
};

export default AlertaPedidos;