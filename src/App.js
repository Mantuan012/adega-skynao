import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

// Contexto Global (O "Cofre" do Carrinho)
import { CartProvider } from "./contexts/CartContext";

// Páginas
import Login from "./pages/Login";
import Catalogo from "./pages/Catalogo";
import MenuPedidos from "./pages/MenuPedidos";
import Dashboard from "./pages/Dashboard";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CombosPage from "./pages/CombosPage";
import PerfilEntregador from "./pages/PerfilEntregador";

// Componentes Fixos
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import UserInfo from "./components/UserInfo";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const fecharToast = () => setToast(null);

  // Monitorização em tempo real da autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUsuario(user);
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setDadosUsuario(userSnap.data());
        }
      } else {
        setDadosUsuario(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ color: '#00ff00', textAlign: 'center', marginTop: '20%', fontFamily: 'sans-serif' }}>Sincronizando Adega Skynão...</div>;

  const isDono = dadosUsuario?.tipo === "admin";
  const isEntregador = dadosUsuario?.tipo === "entregador";

  return (
    <CartProvider showToast={showToast}>
      <Router>
        <div className="container">
          {!usuario ? (
            <Login showToast={showToast} />
          ) : (
            <div className="painel">
              <NavBar 
                isDono={isDono}
                isEntregador={isEntregador}
                usuario={usuario}
                dadosUsuario={dadosUsuario}
              />

              <Routes>
                {/* 1. Direcionamento Inicial Inteligente */}
                <Route path="/" element={<Navigate to={isEntregador ? "/entregador" : "/catalogo"} />} />
                
                {/* 2. Rotas de Cliente com "Leão de Chácara" (Proteção contra Entregadores) */}
                <Route path="/catalogo" element={
                  isEntregador ? <Navigate to="/entregador" /> : <Catalogo />
                } />
                
                <Route path="/combos" element={
                  isEntregador ? <Navigate to="/entregador" /> : <CombosPage />
                } />
                
                <Route path="/produto/:id" element={
                  isEntregador ? <Navigate to="/entregador" /> : <ProductDetailPage />
                } />
                
                <Route path="/carrinho" element={
                  isEntregador ? <Navigate to="/entregador" /> : 
                  <CartPage usuario={usuario} dadosUsuario={dadosUsuario} showToast={showToast} />
                } />

                {/* 3. Rotas de Perfil e Histórico (Comuns a todos) */}
                <Route path="/perfil" element={
                  <UserInfo usuario={usuario} showToast={showToast} fechar={() => window.history.back()} />
                } />
                
                <Route path="/pedidos" element={<MenuPedidos isDono={isDono} usuario={usuario} />} />
                
                {/* 4. Rota Privada do Dono/Admin */}
                <Route path="/dashboard" element={
                  isDono ? <Dashboard /> : <Navigate to="/" />
                } />
                
                {/* 5. Rota Privada do Entregador */}
                <Route path="/entregador" element={
                  isEntregador ? <PerfilEntregador dadosUsuario={dadosUsuario} showToast={showToast} /> : <Navigate to="/" />
                } />

                {/* 6. Fallback de Segurança */}
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