import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

import { CartProvider } from "./contexts/CartContext";

// Pages
import Login from "./pages/Login";
import Catalogo from "./pages/Catalogo";
import MenuPedidos from "./pages/MenuPedidos";
import Dashboard from "./pages/Dashboard";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CombosPage from "./pages/CombosPage";
import PerfilEntregador from "./pages/PerfilEntregador";
import GerenciamentoUsuarios from "./pages/GerenciamentoUsuarios";
import AcessoRapido from "./pages/AcessoRapido"; // Import da página de QR Code

// Components
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import UserInfo from "./components/UserInfo";
import AlertaPedidos from "./components/AlertaPedidos";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const fecharToast = () => setToast(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true); 
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setDadosUsuario(userSnap.data());
        setUsuario(user); 
        setLoading(false); 
      } else {
        setUsuario(null);
        setDadosUsuario(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ color: '#00ff00', textAlign: 'center', marginTop: '20%' }}>Sincronizando Adega Skynão...</div>;

  const isDono = dadosUsuario?.tipo === "admin";
  const isEntregador = dadosUsuario?.tipo === "entregador";

  return (
    <CartProvider showToast={showToast}>
      <Router>
        <div className="container">
          <AlertaPedidos isDono={isDono} />
          
          <Routes>
            <Route path="/acesso" element={<AcessoRapido />} />
          </Routes>

          {!usuario ? (
            <Login showToast={showToast} />
          ) : (
            <div className="painel">
              <NavBar isDono={isDono} isEntregador={isEntregador} usuario={usuario} dadosUsuario={dadosUsuario} />
              <Routes>
                <Route path="/" element={<Navigate to={isEntregador ? "/entregador" : "/catalogo"} />} />
                <Route path="/catalogo" element={isEntregador ? <Navigate to="/entregador" /> : <Catalogo isDono={isDono} showToast={showToast} />} />
                <Route path="/combos" element={isEntregador ? <Navigate to="/entregador" /> : <CombosPage isDono={isDono} showToast={showToast} />} />
                <Route path="/produto/:id" element={isEntregador ? <Navigate to="/entregador" /> : <ProductDetailPage />} />
                <Route path="/carrinho" element={isEntregador ? <Navigate to="/entregador" /> : <CartPage usuario={usuario} dadosUsuario={dadosUsuario} showToast={showToast} />} />
                <Route path="/perfil" element={<UserInfo usuario={usuario} showToast={showToast} fechar={() => window.history.back()} />} />
                <Route path="/pedidos" element={<MenuPedidos isDono={isDono} usuario={usuario} />} />
                <Route path="/dashboard" element={isDono ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/gerenciamento-usuarios" element={isDono ? <GerenciamentoUsuarios /> : <Navigate to="/" />} />
                <Route path="/entregador" element={isEntregador ? <PerfilEntregador dadosUsuario={dadosUsuario} showToast={showToast} /> : <Navigate to="/" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          )}
          <Footer />
          {toast && <Toast toast={toast} onClose={fecharToast} />}
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;