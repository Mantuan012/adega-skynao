import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2bYNF1JsljbO_dP6SP5qqh-jdq9XQ_bs",
  authDomain: "adega-skynao.firebaseapp.com",
  projectId: "adega-skynao",
  storageBucket: "adega-skynao.firebasestorage.app",
  messagingSenderId: "586669456980",
  appId: "1:586669456980:web:b6f2746d7b832e6f4c77c1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };