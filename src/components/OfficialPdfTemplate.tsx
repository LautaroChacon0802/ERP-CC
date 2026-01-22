import React, { forwardRef } from 'react';
import { Scenario } from '../types';
import CastorLogo from './CastorLogo';
import { formatCurrency } from '../utils';
import { getItemsByCategory } from '../constants';

interface Props {
  scenario: Scenario;
}

const OfficialPdfTemplate = forwardRef<HTMLDivElement, Props>(({ scenario }, ref) => {
  const category = scenario.category || 'LIFT';
  const isRental = category !== 'LIFT';
  const isAlpino = category === 'RENTAL_ALPINO';

  // 1. Obtener los artículos correspondientes a la categoría
  const items = isRental ? getItemsByCategory(category) : [];

  // 2. Filtro Especial para Alpino:
  // El diseño oficial suele ser una hoja A4 vertical/horizontal.
  // Para Alpino, que tiene tarifas por Hora y por Día, por defecto en este reporte 
  // mostramos solo los items POR DÍA (Esquí de fondo, Lockers) para mantener la limpieza.
  // (Si necesitas imprimir lo de por hora, usualmente es otro cartel).
  const displayItems = isAlpino 
    ? items.filter(i => i.pricingUnit === 'DAY') 
    : items;

  return (
    <div ref={ref} className="bg-white p-8 w-[1100px] h-auto min-h-[600px] relative text-slate-800" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b-4 border-castor-red pb-4 mb-6">
        <div>
          <h1 className="text-4xl font-black text-castor-red tracking-tighter uppercase">Cerro Castor</h1>
          <h2 className="text-xl font-bold text-gray-600 mt-1">{scenario.name}</h2>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">
             Temporada {scenario.season} | {isRental ? 'Tarifario de Equipos' : 'Medios de Elevación'}
          </p>
        </div>
        <div className="w-24 opacity-90">
            <CastorLogo />
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {/* Columna Días Fija */}
              <th className="p-3 text-left font-black text-slate-700 uppercase text-xs border-b-2 border-slate-300 w-16">
                Días
              </th>
              
              {isRental ? (
                  // HEADER RENTAL (Dinámico)
                  displayItems.map(item => (
                      <th key={item.id} className="p-3 text-right font-black text-slate-700 uppercase text-[10px] border-b-2 border-slate-300 leading-tight">
                          {item.label}
                      </th>
                  ))
              ) : (
                  // HEADER LIFT (Legacy / Fijo)
                  <>
                    <th className="p-3 text-right font-black text-slate-700 uppercase text-xs border-b-2 border-slate-300">Adulto</th>
                    <th className="p-3 text-right font-black text-slate-700 uppercase text-xs border-b-2 border-slate-300">Menor</th>
                    <th className="p-3 text-right font-black text-gray-500 uppercase text-xs border-b-2 border-slate-300">Ad. Promo</th>
                    <th className="p-3 text-right font-black text-gray-500 uppercase text-xs border-b-2 border-slate-300">Men. Promo</th>
                  </>
              )}
            </tr>
          </thead>
          <tbody>
            {scenario.calculatedData.map((row, idx) => (
              <tr key={row.days} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {/* Columna Días */}
                <td className="p-3 text-left font-bold text-slate-900 border-b border-slate-100">
                    {row.days}
                </td>
                
                {isRental ? (
                    // BODY RENTAL (Dinámico)
                    displayItems.map(item => (
                        <td key={item.id} className="p-3 text-right font-medium text-slate-600 border-b border-slate-100 text-sm">
                            {/* Verificamos si existe el precio visual para este item */}
                            {row.rentalItems?.[item.id] 
                                ? formatCurrency(row.rentalItems[item.id].visual) 
                                : '-'}
                        </td>
                    ))
                ) : (
                    // BODY LIFT (Legacy)
                    <>
                        <td className="p-3 text-right font-bold text-slate-800 border-b border-slate-100">
                            {formatCurrency(row.adultRegularVisual)}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-600 border-b border-slate-100">
                            {formatCurrency(row.minorRegularVisual)}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-400 border-b border-slate-100">
                            {formatCurrency(row.adultPromoVisual)}
                        </td>
                        <td className="p-3 text-right font-medium text-gray-400 border-b border-slate-100">
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
      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-gray-400">
        <p>Documento oficial generado el {new Date().toLocaleDateString()}</p>
        <p>Sistema de Gestión ERP - Cerro Castor</p>
      </div>
    </div>
  );
});

export default OfficialPdfTemplate;