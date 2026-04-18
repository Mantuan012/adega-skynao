import React, { useEffect } from 'react';
import './Toast.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function Toast({ toast, onClose }) {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // fecha após 3 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  // Define o ícone e a classe CSS com base no 'toast.type'
  const isError = toast.type === 'error';
  
  const icon = isError 
    ? <FaTimesCircle size={20} /> 
    : <FaCheckCircle size={20} />;
    
  const containerClass = isError 
    ? 'toast-container toast-error' 
    : 'toast-container toast-success';

  return (
    <div className={containerClass}>
      <div className="toast-icon">
        {icon}
      </div>
      <div className="toast-message">
        {toast.message}
      </div>
    </div>
  );
}