import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Chave e informações de configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC2bYNF1JsljbO_dP6SP5qqh-jdq9XQ_bs",
  authDomain: "adega-skynao.firebaseapp.com",
  projectId: "adega-skynao",
  storageBucket: "adega-skynao.firebasestorage.app",
  messagingSenderId: "586669456980",
  appId: "1:586669456980:web:b6f2746d7b832e6f4c77c1"
};

// Inicializando Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Para autenticação
export const db = getFirestore(app); // Para banco de dados Firestore