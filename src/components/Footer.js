import React from "react";

function Footer() {
  return (
    <footer className="footer-container" style={{ textAlign: 'center', padding: '25px 15px', backgroundColor: '#050505', borderTop: '1px solid #1a1a1a', marginTop: 'auto' }}>
      <div className="footer-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ margin: '0 0 8px 0', color: '#00ff66', fontWeight: 'bold', fontSize: '1rem' }}>
          © 2026 Adega Skynão - Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

export default Footer;