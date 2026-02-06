import React from 'react';
import { Scenario } from '../types';
import { formatCurrency } from '../utils';

// ==========================================
// COLOR PALETTE (Hex safe for html2canvas)
// ==========================================
const PDF_COLORS = {
   white: '#ffffff',
   slate900: '#0f172a',
   slate800: '#1e293b', 
   slate700: '#334155',
   slate500: '#64748b',
   slate100: '#f1f5f9',
   slate50: '#f8fafc',
   border: '#cbd5e1',
   red: '#DC2626' // Castor Red
};

interface OfficialPdfTemplateProps {
  scenario: Scenario;
}

const OfficialPdfTemplate: React.FC<OfficialPdfTemplateProps> = ({ scenario }) => {
  const data = scenario.calculatedData || [];
  const isRental = scenario.category && scenario.category !== 'LIFT';
  
  // Headers dinámicos según tipo
  const headers = isRental 
    ? (data.length > 0 && data[0].rentalItems 
        ? Object.keys(data[0].rentalItems) // IDs de items
        : [])
    : ['Adulto', 'Menor', 'Promo Adulto', 'Promo Menor']; // Lift headers

  // Si es rental, necesitamos mapear IDs a Labels para el header
  // (Esto requeriría importar RENTAL_ITEMS, pero por simplicidad usaremos el ID o buscaremos en params si es posible. 
  //  Para no complicar dependencias circulares, asumiremos que data[0].rentalItems tiene orden consistente)
  //  NOTA: En una implementación ideal, pasaríamos los labels como prop o context.
  
  return (
    <div 
        id="official-pdf-template" 
        className="w-full p-8 flex flex-col items-center bg-white"
        style={{ backgroundColor: PDF_COLORS.white, color: PDF_COLORS.slate800 }}
    >
      {/* HEADER PDF */}
      <div className="w-full flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: PDF_COLORS.border }}>
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ color: PDF_COLORS.slate900 }}>
                Cerro Castor
            </h1>
            <span className="text-sm font-medium" style={{ color: PDF_COLORS.red }}>
                Tarifario Oficial {scenario.season}
            </span>
        </div>
        <div className="flex flex-col items-end">
            <h2 className="text-lg font-bold" style={{ color: PDF_COLORS.slate700 }}>
                {scenario.name}
            </h2>
            <span className="text-xs" style={{ color: PDF_COLORS.slate500 }}>
                Generado: {new Date().toLocaleDateString('es-AR')}
            </span>
        </div>
      </div>

      {/* PARAMETERS SUMMARY */}
      <div className="w-full mb-6 p-4 rounded flex gap-8 text-sm" style={{ backgroundColor: PDF_COLORS.slate50 }}>
         <div className="flex flex-col">
            <span className="text-xs font-bold uppercase mb-1" style={{ color: PDF_COLORS.slate500 }}>Vigencia</span>
            <span style={{ color: PDF_COLORS.slate800 }}>
                {scenario.params.validFrom} al {scenario.params.validTo}
            </span>
         </div>
         <div className="flex flex-col">
            <span className="text-xs font-bold uppercase mb-1" style={{ color: PDF_COLORS.slate500 }}>Aumento</span>
            <span style={{ color: PDF_COLORS.slate800 }}>
                {scenario.params.increasePercentage}%
            </span>
         </div>
         <div className="flex flex-col">
            <span className="text-xs font-bold uppercase mb-1" style={{ color: PDF_COLORS.slate500 }}>Categoría</span>
            <span style={{ color: PDF_COLORS.slate800 }}>
                {scenario.category || 'Medios de Elevación'}
            </span>
         </div>
      </div>

      {/* DATA TABLE */}
      <table className="w-full text-sm border-collapse">
        <thead>
            <tr style={{ backgroundColor: PDF_COLORS.slate100, borderBottom: `2px solid ${PDF_COLORS.border}` }}>
                <th className="py-3 px-4 text-left font-bold" style={{ color: PDF_COLORS.slate700 }}>Días</th>
                {isRental ? (
                    // Header Rental: Mostramos IDs (Idealmente Labels)
                    headers.map(h => (
                        <th key={h} className="py-3 px-2 text-center font-bold text-xs" style={{ color: PDF_COLORS.slate700 }}>
                           {h.replace(/_/g, ' ').toUpperCase()} 
                        </th>
                    ))
                ) : (
                    // Header Lift
                    headers.map(h => (
                        <th key={h} className="py-3 px-4 text-right font-bold" style={{ color: PDF_COLORS.slate700 }}>
                            {h}
                        </th>
                    ))
                )}
            </tr>
        </thead>
        <tbody>
            {data.map((row, index) => (
                <tr key={row.days} style={{ borderBottom: `1px solid ${PDF_COLORS.border}` }}>
                    <td className="py-3 px-4 font-bold" style={{ color: PDF_COLORS.slate900 }}>
                        {row.days}
                    </td>
                    
                    {isRental ? (
                        headers.map(itemId => {
                            const price = row.rentalItems?.[itemId]?.visual || 0;
                            return (
                                <td key={itemId} className="py-3 px-2 text-center" style={{ color: PDF_COLORS.slate700 }}>
                                    {formatCurrency(price)}
                                </td>
                            );
                        })
                    ) : (
                        <>
                            <td className="py-3 px-4 text-right" style={{ color: PDF_COLORS.slate700 }}>{formatCurrency(row.adultRegularVisual)}</td>
                            <td className="py-3 px-4 text-right" style={{ color: PDF_COLORS.slate700 }}>{formatCurrency(row.minorRegularVisual)}</td>
                            <td className="py-3 px-4 text-right font-medium" style={{ color: PDF_COLORS.red }}>{formatCurrency(row.adultPromoVisual)}</td>
                            <td className="py-3 px-4 text-right" style={{ color: PDF_COLORS.red }}>{formatCurrency(row.minorPromoVisual)}</td>
                        </>
                    )}
                </tr>
            ))}
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="mt-8 text-xs text-center w-full pt-4 border-t" style={{ borderColor: PDF_COLORS.border, color: PDF_COLORS.slate500 }}>
        <p>Documento generado por sistema ERP - Cerro Castor. Uso interno y confidencial.</p>
      </div>
    </div>
  );
};

export default OfficialPdfTemplate;