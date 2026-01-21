import React from 'react';

interface Props {
  className?: string;
}

// Placeholder SVG Base64 (Cerro Castor Red Branding)
// This prevents the "Error loading image" caused by an empty src.
// You can replace this string with your specific official logo Base64 later if needed.
const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMDAgODAiPgogIDwhLS-gSWNvbiAtLT4KICA8cGF0aCBkPSJNMzAgNjBMMTUgMzVMMCA2MEgzMFoiIGZpbGw9IiNDODEwMkUiLz4KICA8cGF0aCBkPSJNMjAgNjBMNDAgMjVMNjAgNjBIMjBaIiBmaWxsPSIjQzgxMDJFIiBmaWxsLW9wYWNpdHk9IjAuNyIvPgogIDwhLS0gVGV4dCAtLT4KICA8dGV4dCB4PSI3MCIgeT0iNTIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjM4IiBmaWxsPSIjQzgxMDJFIj5DRVJSTyBDQVNUT1I8L3RleHQ+Cjwvc3ZnPg==";

export const CastorLogo: React.FC<Props> = ({ className }) => (
  <img 
    src={LOGO_BASE64} 
    alt="Cerro Castor" 
    className={className} 
    style={{ objectFit: 'contain' }} 
  />
);

export default CastorLogo;