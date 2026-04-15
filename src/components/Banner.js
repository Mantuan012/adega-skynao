import React from "react";

function Banner({ onBannerClick }) {
  return (
    <div className="banner-container" onClick={onBannerClick}>
      {/* Bloco de texto da Esquerda */}
      <div className="banner-texto-esquerda">
        <h2>PROMOÇÕES</h2>
        <h2>IMPERDÍVEIS</h2>
      </div>

      {/* Bloco de Texto da Direita (Atualizado) */}
      <div className="banner-texto-direita">
        {/* Usamos h2 para manter a consistência de tamanho e cor */}
        <h2>PEÇA JÁ!</h2>
      </div>
    </div>
  );
}

export default Banner;