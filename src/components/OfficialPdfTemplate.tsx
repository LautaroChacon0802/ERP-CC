import React, { forwardRef } from 'react';
import { Scenario } from '../types';
import CastorLogo from './CastorLogo';
import { formatCurrency } from '../utils';
import { getItemsByCategory } from '../constants';

interface Props {
  scenario: Scenario;
}

const PDF_COLORS = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  gray600:  '#4b5563',
  gray500:  '#6b7280',
  gray400:  '#9ca3af',
  redCastor: '#DC2626', // Rojo estándar seguro
  white: '#ffffff'
};

const OfficialPdfTemplate = forwardRef<HTMLDivElement, Props>(({ scenario }, ref) => {
  const category = scenario.category || 'LIFT';
  const isRental = category !== 'LIFT';
  const isAlpino = category === 'RENTAL_ALPINO';

  // 1. Obtener los artículos correspondientes a la categoría
  const items = isRental ? getItemsByCategory(category) : [];

  // 2. Filtro Especial para Alpino:
  const displayItems = isAlpino 
    ? items.filter(i => i.pricingUnit === 'DAY') 
    : items;

  return (
    <div 
      ref={ref} 
      className="p-8 w-[1100px] h-auto min-h-[600px] relative" 
      style={{ 
        backgroundColor: PDF_COLORS.white, 
        color: PDF_COLORS.slate800, 
        fontFamily: 'Arial, sans-serif' 
      }}
    >
      
      {/* HEADER */}
      <div 
        className="flex justify-between items-end border-b-4 pb-4 mb-6"
        style={{ borderColor: PDF_COLORS.redCastor }}
      >
        <div>
          <h1 
            className="text-4xl font-black tracking-tighter uppercase"
            style={{ color: PDF_COLORS.redCastor }}
          >
            Cerro Castor
          </h1>
          <h2 
            className="text-xl font-bold mt-1"
            style={{ color: PDF_COLORS.gray600 }}
          >
            {scenario.name}
          </h2>
          <p 
            className="text-sm font-medium uppercase tracking-widest mt-1"
            style={{ color: PDF_COLORS.gray400 }}
          >
             Temporada {scenario.season} | {isRental ? 'Tarifario de Equipos' : 'Medios de Elevación'}
          </p>
        </div>
        <div className="w-24 opacity-90" style={{ color: PDF_COLORS.redCastor }}>
            <CastorLogo />
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: PDF_COLORS.slate100 }}>
              {/* Columna Días Fija */}
              <th 
                className="p-3 text-left font-black uppercase text-xs border-b-2 w-16"
                style={{ color: PDF_COLORS.slate700, borderColor: PDF_COLORS.slate300 }}
              >
                Días
              </th>
              
              {isRental ? (
                  // HEADER RENTAL (Dinámico)
                  displayItems.map(item => (
                      <th 
                        key={item.id} 
                        className="p-3 text-right font-black uppercase text-[10px] border-b-2 leading-tight"
                        style={{ color: PDF_COLORS.slate700, borderColor: PDF_COLORS.slate300 }}
                      >
                          {item.label}
                      </th>
                  ))
              ) : (
                  // HEADER LIFT (Legacy / Fijo)
                  <>
                    <th 
                      className="p-3 text-right font-black uppercase text-xs border-b-2"
                      style={{ color: PDF_COLORS.slate700, borderColor: PDF_COLORS.slate300 }}
                    >
                      Adulto
                    </th>
                    <th 
                      className="p-3 text-right font-black uppercase text-xs border-b-2"
                      style={{ color: PDF_COLORS.slate700, borderColor: PDF_COLORS.slate300 }}
                    >
                      Menor
                    </th>
                    <th 
                      className="p-3 text-right font-black uppercase text-xs border-b-2"
                      style={{ color: PDF_COLORS.gray500, borderColor: PDF_COLORS.slate300 }}
                    >
                      Ad. Promo
                    </th>
                    <th 
                      className="p-3 text-right font-black uppercase text-xs border-b-2"
                      style={{ color: PDF_COLORS.gray500, borderColor: PDF_COLORS.slate300 }}
                    >
                      Men. Promo
                    </th>
                  </>
              )}
            </tr>
          </thead>
          <tbody>
            {scenario.calculatedData.map((row, idx) => (
              <tr 
                key={row.days} 
                style={{ backgroundColor: idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.slate50 }}
              >
                {/* Columna Días */}
                <td 
                  className="p-3 text-left font-bold border-b"
                  style={{ color: PDF_COLORS.slate900, borderColor: PDF_COLORS.slate100 }}
                >
                    {row.days}
                </td>
                
                {isRental ? (
                    // BODY RENTAL (Dinámico)
                    displayItems.map(item => (
                        <td 
                          key={item.id} 
                          className="p-3 text-right font-medium border-b text-sm"
                          style={{ color: PDF_COLORS.slate600, borderColor: PDF_COLORS.slate100 }}
                        >
                            {/* Verificamos si existe el precio visual para este item */}
                            {row.rentalItems?.[item.id] 
                                ? formatCurrency(row.rentalItems[item.id].visual) 
                                : '-'}
                        </td>
                    ))
                ) : (
                    // BODY LIFT (Legacy)
                    <>
                        <td 
                          className="p-3 text-right font-bold border-b"
                          style={{ color: PDF_COLORS.slate800, borderColor: PDF_COLORS.slate100 }}
                        >
                            {formatCurrency(row.adultRegularVisual)}
                        </td>
                        <td 
                          className="p-3 text-right font-medium border-b"
                          style={{ color: PDF_COLORS.slate600, borderColor: PDF_COLORS.slate100 }}
                        >
                            {formatCurrency(row.minorRegularVisual)}
                        </td>
                        <td 
                          className="p-3 text-right font-medium border-b"
                          style={{ color: PDF_COLORS.gray400, borderColor: PDF_COLORS.slate100 }}
                        >
                            {formatCurrency(row.adultPromoVisual)}
                        </td>
                        <td 
                          className="p-3 text-right font-medium border-b"
                          style={{ color: PDF_COLORS.gray400, borderColor: PDF_COLORS.slate100 }}
                        >
                            {formatCurrency(row.minorPromoVisual)}
                        </td>
                    </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div 
        className="mt-8 pt-4 border-t flex justify-between items-center text-[10px]"
        style={{ borderColor: PDF_COLORS.slate200, color: PDF_COLORS.gray400 }}
      >
        <p>Documento oficial generado el {new Date().toLocaleDateString()}</p>
        <p>Sistema de Gestión ERP - Cerro Castor</p>
      </div>
    </div>
  );
});

export default OfficialPdfTemplate;