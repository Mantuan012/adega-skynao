import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { produtos } from '../data/Produtos';

// Script de migração - execute uma vez para migrar produtos estáticos para Firestore
export const migrarProdutosParaFirestore = async () => {
  try {
    console.log('Iniciando migração de produtos...');
    
    for (const produto of produtos) {
      await addDoc(collection(db, 'produtos'), produto);
      console.log(`Produto ${produto.nome} migrado com sucesso`);
    }
    
    console.log('Migração concluída!');
  } catch (error) {
    console.error('Erro na migração:', error);
  }
};

// Para executar: importe e chame migrarProdutosParaFirestore() no console do navegador ou em um componente temporário