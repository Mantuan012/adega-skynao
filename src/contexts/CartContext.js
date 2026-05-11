import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const CartContext = createContext();

export function CartProvider({ children, showToast }) {
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  const [carrinho, setCarrinho] = useState(() => {
    const salvo = localStorage.getItem('carrinho_adega');
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem('carrinho_adega', JSON.stringify(carrinho));
  }, [carrinho]);

  // ATUALIZAÇÃO: onSnapshot mantém o catálogo sempre sincronizado com o banco em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "produtos"), (snapshot) => {
      const produtosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProdutos(produtosData);
      setLoadingProdutos(false);
    }, (error) => {
      console.error("Erro ao carregar produtos:", error);
      setLoadingProdutos(false);
    });

    return () => unsubscribe();
  }, []);

  const adicionarAoCarrinho = (produto) => {
    const itemNoCarrinho = carrinho.find((item) => item.id === produto.id);
    const quantidadeAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    const estoqueDisponivel = produto.estoque;

    if (quantidadeAtual >= estoqueDisponivel) {
      if(showToast) showToast(`Limite de estoque atingido para ${produto.nome}!`, 'error'); 
      return; 
    }
    
    setCarrinho((carrinhoAtual) => {
      const itemExistente = carrinhoAtual.find((item) => item.id === produto.id);
      if (itemExistente) {
        return carrinhoAtual.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...carrinhoAtual, { ...produto, quantidade: 1 }];
    });
    if(showToast) showToast(`${produto.nome} no carrinho!`);
  };

  const adicionarComboAoCarrinho = (combo) => {
    let menorEstoquePossivel = Infinity;
    let volumeTotalCombo = 0;

    combo.itens.forEach((itemCombo) => {
      const produtoReal = produtos.find((p) => p.id === itemCombo.id);
      if (produtoReal) {
        const maxUnidades = Math.floor(produtoReal.estoque / itemCombo.qtd);
        if (maxUnidades < menorEstoquePossivel) menorEstoquePossivel = maxUnidades;
        volumeTotalCombo += (produtoReal.volume * itemCombo.qtd);
      }
    });

    if (menorEstoquePossivel === 0) {
        if(showToast) showToast("Um dos itens do combo esgotou!", "error");
        return;
    }

    setCarrinho((prevCarrinho) => {
      const itemNoCarrinho = prevCarrinho.find((i) => i.id === combo.id);
      const qtdAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

      if (qtdAtual + 1 > menorEstoquePossivel) {
        if(showToast) showToast("Estoque insuficiente para o combo!", "error");
        return prevCarrinho;
      }

      if(showToast) showToast(`${combo.nome} adicionado!`);
      if (itemNoCarrinho) {
        return prevCarrinho.map((item) =>
          item.id === combo.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prevCarrinho, { 
          id: combo.id, nome: combo.nome, preco: combo.preco, imagem: combo.imagem,
          quantidade: 1, volume: volumeTotalCombo, estoque: menorEstoquePossivel, 
          tipo: 'combo', itens: combo.itens 
      }];
    });
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho((carrinhoAtual) => {
      const itemParaRemover = carrinhoAtual.find((item) => item.id === produtoId);
      if (!itemParaRemover) return carrinhoAtual;
      if (itemParaRemover.quantidade === 1) {
        return carrinhoAtual.filter((item) => item.id !== produtoId);
      }
      return carrinhoAtual.map((item) =>
        item.id === produtoId ? { ...item, quantidade: item.quantidade - 1 } : item
      );
    });
  };

  const excluirDoCarrinho = (produtoId) => {
    setCarrinho((carrinhoAtual) => carrinhoAtual.filter((item) => item.id !== produtoId));
  };

  const calcularTotalItem = (item) => {
    if (item.tipo === 'combo') return item.preco * item.quantidade;
    
    const precoBase = item.promocao ? item.promocao.precoPromocional : item.preco;
    
    if (item.fardo && item.quantidade >= item.fardo.quantidade) {
      const numFardos = Math.floor(item.quantidade / item.fardo.quantidade);
      const resto = item.quantidade % item.fardo.quantidade;
      return (numFardos * item.fardo.preco) + (resto * precoBase);
    }
    return precoBase * item.quantidade;
  };

  const limparCarrinho = () => {
    setCarrinho([]);
    localStorage.removeItem('carrinho_adega');
  };

  return (
    <CartContext.Provider value={{
      carrinho, produtos, loadingProdutos, adicionarAoCarrinho, adicionarComboAoCarrinho,
      removerDoCarrinho, excluirDoCarrinho, calcularTotalItem, limparCarrinho
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);