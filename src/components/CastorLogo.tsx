import React from 'react';
// Importamos el archivo directamente para que Vite lo procese
import logoImg from '../assets/logo-castor.png'; 

interface Props {
  className?: string;
}

export const CastorLogo: React.FC<Props> = ({ className }) => (
  <img 
    src={logoImg} 
    alt="Cerro Castor" 
    className={className} 
    style={{ objectFit: 'contain' }} 
    // Añadimos un fallback por si la imagen no carga
    onError={(e) => {
      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Cerro+Castor';
    }}
  />
);

export default CastorLogo;