import React, { useState } from 'react';
import { FaSave, FaTimes, FaTrash, FaUpload } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';

export default function FormularioProduto({ produto, onSave, onCancel, onDelete, salvando, categoriasDisponiveis = [] }) {
  
  const [formData, setFormData] = useState({
    nome: produto?.nome || '', 
    preco: produto?.preco ?? '', 
    categoria: produto?.categoria || '',
    volume: produto?.volume ?? '', 
    estoque: produto?.estoque ?? '', 
    imagem: produto?.imagem || '',
    descricao: produto?.descricao || '', 
    fardo: produto?.fardo || null
  });

  const [imagemFile, setImagemFile] = useState(null);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  const CLOUDINARY_UPLOAD_PRESET = 'adega_skynao'; 
  const CLOUDINARY_CLOUD_NAME = 'adegaskynao';

  const limparNumero = (valor) => {
    let limpo = valor.toString();
    limpo = limpo.replace('-', ''); 
    limpo = limpo.replace(/^0+(?=\d)/, ''); 
    return limpo;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'preco' || name === 'volume' || name === 'estoque') {
      value = limparNumero(value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFardoChange = (e) => {
    let { name, value } = e.target;
    value = limparNumero(value);
    setFormData(prev => ({ ...prev, fardo: { ...prev.fardo, [name]: value } }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImagemFile(e.target.files[0]);
    }
  };

  const handleSalvarComUpload = async () => {
    let urlFinal = formData.imagem;

    if (imagemFile) {
      setFazendoUpload(true);
      try {
        const options = { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(imagemFile, options);
        
        const dataForm = new FormData();
        dataForm.append('file', compressedFile);
        dataForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: dataForm
        });
        
        const dados = await resposta.json();
        urlFinal = dados.secure_url; 
        
      } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao enviar a imagem. Verifique a conexão.");
        setFazendoUpload(false);
        return;
      }
      setFazendoUpload(false);
    }

    onSave({ ...formData, imagem: urlFinal });
  };

  const isLoading = salvando || fazendoUpload;

  return (
    <div>
      <h3 className="modal-produto-titulo">{produto ? 'Editar Produto' : 'Novo Produto'}</h3>
      
      <div className="form-grid-produtos">
        <div className="form-group">
          <label className="form-label">Nome da Bebida:</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-input" placeholder="Ex: Cerveja Brahma 350ml" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Preço Unitário (R$):</label>
          <input type="number" min="0" name="preco" value={formData.preco} onChange={handleChange} step="0.01" className="form-input" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Categoria:</label>
          <select name="categoria" value={formData.categoria} onChange={handleChange} className="form-input">
            <option value="">Selecione...</option>
            {categoriasDisponiveis.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Estoque Atual:</label>
          <input type="number" min="0" name="estoque" value={formData.estoque} onChange={handleChange} className="form-input" />
        </div>

        <div className="form-group">
          <label className="form-label">Volume (L ou ML):</label>
          <input type="number" min="0" name="volume" value={formData.volume} onChange={handleChange} step="0.1" className="form-input" placeholder="Ex: 0.35 para 350ml" />
        </div>
        
        <div className="form-group form-group-full">
          <label className="form-label">Imagem do Produto:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ cursor: 'pointer', backgroundColor: '#333', padding: '10px 15px', borderRadius: '6px', color: '#00ff66', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaUpload /> Escolher Arquivo
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
              {imagemFile ? `Arquivo selecionado: ${imagemFile.name}` : formData.imagem ? "Imagem já cadastrada." : "Nenhuma imagem selecionada."}
            </span>
          </div>
        </div>

        <div className="form-group form-group-full">
          <label className="form-label">Descrição (Opcional):</label>
          <textarea 
            name="descricao" 
            value={formData.descricao} 
            onChange={handleChange} 
            rows="2" 
            className="form-input" 
            placeholder="Detalhes do produto ou itens do combo..."
          ></textarea>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #00ff66' }}>
        <label className="form-checkbox-label">
          <input type="checkbox" checked={!!formData.fardo} onChange={(e) => setFormData(prev => ({ ...prev, fardo: e.target.checked ? { quantidade: '', preco: '' } : null }))} />
          Vender em Fardo / Caixa
        </label>
        
        {formData.fardo && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className="form-group">
              <label className="form-label">Unidades no Fardo:</label>
              <input type="number" min="0" name="quantidade" value={formData.fardo.quantidade} onChange={handleFardoChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Preço do Fardo (R$):</label>
              <input type="number" min="0" name="preco" value={formData.fardo.preco} onChange={handleFardoChange} step="0.01" className="form-input" />
            </div>
          </div>
        )}
      </div>

      <div className="botoes-form-produto">
        <button type="button" className="btn-form btn-form-salvar" disabled={isLoading} onClick={handleSalvarComUpload}>
          <FaSave /> {isLoading ? (fazendoUpload ? 'Enviando...' : 'A guardar...') : 'Gravar Alterações'}
        </button>
        <button type="button" onClick={onCancel} className="btn-form btn-form-cancelar" disabled={isLoading}>
          <FaTimes /> Cancelar
        </button>
        {produto && (
           <button type="button" onClick={onDelete} className="btn-form btn-form-excluir" disabled={isLoading}>
             <FaTrash /> Excluir
           </button>
        )}
      </div>
    </div>
  );
}