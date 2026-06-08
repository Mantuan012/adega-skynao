import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const AcessoRapido = () => {
  const navigate = useNavigate();
  // Altere para a URL correta do seu domínio no Firebase
  const urlSistema = "https://adega-skynao.web.app";

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', minHeight: '100vh', backgroundColor: '#121212', 
      color: '#ffffff', fontFamily: 'sans-serif', padding: '20px' 
    }}>
      <h1 style={{ color: '#00ff66', marginBottom: '10px' }}>Adega Skynão</h1>
      <p style={{ marginBottom: '30px' }}>Faça seu pedido com rapidez e qualidade!</p>
      
      <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '30px' }}>
        <QRCodeSVG value={urlSistema} size={256} level={"H"} />
      </div>

      <button 
        onClick={() => navigate('/')} 
        style={{ 
          padding: '15px 30px', fontSize: '18px', backgroundColor: '#00ff66', 
          border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', color: '#000' 
        }}
      >
        Acessar Sistema Agora
      </button>
    </div>
  );
};

export default AcessoRapido;