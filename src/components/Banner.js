import React, { useState, useEffect } from 'react';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import imageCompression from 'browser-image-compression';
import './Banner.css'; 

function Banner({ onBannerClick, isDono }) {
  const [bannerUrl, setBannerUrl] = useState('/placeholder-imagem.png'); 
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const CLOUDINARY_UPLOAD_PRESET = 'adega_skynao'; 
  const CLOUDINARY_CLOUD_NAME = 'adegaskynao';

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const docRef = doc(db, 'configuracoes', 'layout');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().bannerUrl) {
          setBannerUrl(docSnap.data().bannerUrl);
        }
      } catch (error) {
        console.error("Erro ao buscar o banner:", error);
      }
    };
    fetchBanner();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFazendoUpload(true);
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const dataForm = new FormData();
      dataForm.append('file', compressedFile);
      dataForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: dataForm
      });
      const dados = await resposta.json();
      const novaUrl = dados.secure_url;

      const docRef = doc(db, 'configuracoes', 'layout');
      await setDoc(docRef, { bannerUrl: novaUrl }, { merge: true });

      setBannerUrl(novaUrl);
    } catch (error) {
      alert("Erro ao atualizar o banner. Verifique a internet.");
    } finally {
      setFazendoUpload(false);
    }
  };

  return (
    // Agora o clique de navegação fica no container inteiro
    <div className="banner-container-dinamico" onClick={onBannerClick}>
      <img
        src={bannerUrl}
        alt="Combos e Ofertas Especiais"
        className="banner-img-dinamico"
        style={{ opacity: fazendoUpload ? 0.5 : 1 }}
      />

      {/* O NOVO LETREIRO DE INFORMAÇÕES */}
      <div className="banner-overlay-info">
        <span className="banner-icone-fogo">🔥</span>
        <div className="banner-textos">
          <h3 className="banner-titulo-texto">Combos & Promoções</h3>
          <p className="banner-subtitulo-texto">Toque aqui para ver nossas ofertas especiais!</p>
        </div>
      </div>

      {isDono && (
        <label 
          className="btn-editar-banner" 
          /* Isso impede que o clique no botão ative o onBannerClick e te jogue pra outra página */
          onClick={(e) => e.stopPropagation()} 
        >
          {fazendoUpload ? <FaSpinner className="spin-icon" /> : <FaCamera />}
          {fazendoUpload ? ' Atualizando...' : ' Trocar Banner'}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
            disabled={fazendoUpload} 
          />
        </label>
      )}
    </div>
  );
}

export default Banner;