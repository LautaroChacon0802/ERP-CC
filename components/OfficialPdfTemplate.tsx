import React, { forwardRef } from 'react';
import { Scenario, DateRange } from '../types';
import { formatCurrency } from '../utils';
import CastorLogo from './CastorLogo';

interface Props {
  scenario: Scenario;
}

// Fixed subset of days as requested for the official sheet
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 30];

const OfficialPdfTemplate = forwardRef<HTMLDivElement, Props>(({ scenario }, ref) => {
  const { params } = scenario;

  // Helper to get price for a specific day
  const getPrice = (day: number, type: 'adultRegular' | 'minorRegular' | 'adultPromo' | 'minorPromo') => {
    const row = scenario.calculatedData.find(d => d.days === day);
    if (!row) return '-';
    
    let val = 0;
    switch (type) {
        case 'adultRegular': val = row.adultRegularVisual; break;
        case 'minorRegular': val = row.minorRegularVisual; break;
        case 'adultPromo': val = row.adultPromoVisual; break;
        case 'minorPromo': val = row.minorPromoVisual; break;
    }
    return formatCurrency(val); // Returns $ X.XXX
  };

  // Helper to format date YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return '...';
    try {
        const date = new Date(dateString + 'T12:00:00'); // Prevent timezone issues
        return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (e) {
        return dateString;
    }
  };

  // Helper to format ranges
  const formatRanges = (ranges: DateRange[]) => {
      if (!ranges || ranges.length === 0) return '...';
      return ranges.map(r => `del ${formatDate(r.start)} al ${formatDate(r.end)}`).join(' y ');
  };

  return (
    <div ref={ref} id="official-template" className="bg-white text-slate-900 w-[297mm] h-[210mm] px-12 py-8 relative shadow-2xl mx-auto font-sans leading-tight flex flex-col justify-between">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4 mb-2">
        <div className="flex items-center gap-6">
             {/* Logo */}
            <div className="h-14 w-auto">
                 <CastorLogo className="h-full w-auto" />
            </div>
            <div>
                <h1 className="text-2xl font-bold uppercase tracking-wide text-castor-red leading-none mb-1">
                  {scenario.name}
                </h1>
                <h2 className="text-sm font-medium text-gray-600 uppercase tracking-widest">
                  Temporada {scenario.season}
                </h2>
            </div>
        </div>
        
        <div className="text-right">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vigencia</p>
             <p className="text-sm font-semibold text-gray-600 uppercase">
                VIGENTE DESDE {formatDate(params.validFrom)} HASTA {formatDate(params.validTo)}
             </p>
        </div>
      </div>

      {/* --- CONTENT BLOCK --- */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        
        {/* --- BLOCK 1: TEMPORADA REGULAR --- */}
        <section>
            <div className="flex items-baseline justify-between mb-2 border-l-4 border-castor-red pl-3">
                <h3 className="text-lg font-bold text-slate-800 uppercase">Temporada Regular</h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                    Vigente {formatRanges(params.regularSeasons)}
                </span>
            </div>
            
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-100 border-t border-b border-gray-300">
                        <th className="py-1 px-2 text-left font-bold text-gray-700 w-32">CATEGORÍA</th>
                        {DISPLAY_DAYS.map(day => (
                            <th key={day} className="py-1 px-1 text-center font-bold text-castor-red text-xs border-l border-gray-200">
                                {day} {day === 1 ? 'DÍA' : 'DÍAS'}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-100">
                        <td className="py-2 px-2 font-bold text-slate-800 text-sm">MAYOR</td>
                        {DISPLAY_DAYS.map(day => (
                            <td key={day} className="py-2 px-1 text-center font-medium text-slate-700 border-l border-gray-100">
                                {getPrice(day, 'adultRegular')}
                            </td>
                        ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                        <td className="py-2 px-2 font-bold text-slate-800 text-sm">MENOR</td>
                        {DISPLAY_DAYS.map(day => (
                            <td key={day} className="py-2 px-1 text-center font-medium text-slate-600 border-l border-gray-100">
                                {getPrice(day, 'minorRegular')}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </section>


        {/* --- BLOCK 2: TEMPORADA PROMOCIONAL --- */}
        <section>
            <div className="flex items-baseline justify-between mb-2 border-l-4 border-castor-blue pl-3">
                <h3 className="text-lg font-bold text-slate-800 uppercase">Temporada Promocional</h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                    Vigente {formatRanges(params.promoSeasons)}
                </span>
            </div>
            
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-100 border-t border-b border-gray-300">
                        <th className="py-1 px-2 text-left font-bold text-gray-700 w-32">CATEGORÍA</th>
                        {DISPLAY_DAYS.map(day => (
                            <th key={day} className="py-1 px-1 text-center font-bold text-castor-blue text-xs border-l border-gray-200">
                                {day} {day === 1 ? 'DÍA' : 'DÍAS'}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-100">
                        <td className="py-2 px-2 font-bold text-slate-800 text-sm">MAYOR</td>
                        {DISPLAY_DAYS.map(day => (
                            <td key={day} className="py-2 px-1 text-center font-medium text-slate-700 border-l border-gray-100">
                                {getPrice(day, 'adultPromo')}
                            </td>
                        ))}
                    </tr>
                    <tr className="bg-gray-50/50">
                        <td className="py-2 px-2 font-bold text-slate-800 text-sm">MENOR</td>
                        {DISPLAY_DAYS.map(day => (
                            <td key={day} className="py-2 px-1 text-center font-medium text-slate-600 border-l border-gray-100">
                                {getPrice(day, 'minorPromo')}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </section>

      </div>

      {/* --- FOOTER / LEGALES --- */}
      <div className="text-[9px] text-gray-500 leading-snug border-t border-gray-200 pt-3 mt-2">
        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
                <p className="mb-1 font-bold uppercase text-gray-600 text-[10px]">Condiciones Generales</p>
                <div className="grid grid-cols-2 gap-4">
                    <ul className="list-disc pl-3 space-y-0.5">
                        <li>Tarifas sujetas a modificaciones sin previo aviso.</li>
                        <li>Tarifas rack expresadas en $ (pesos argentinos) válidas para mercado extranjero.</li>
                        <li>Las fechas de inicio y/o fin de temporada pueden sufrir modificaciones según condiciones climáticas.</li>
                    </ul>
                    <ul className="list-disc pl-3 space-y-0.5">
                        <li>Menor: tarifa aplicable a niños de 5 a 11 años inclusive.</li>
                        <li>Infante (0-4 años) sin cargo. Senior (+70 años) sin cargo.</li>
                        <li>Tarifas IVA Incluido.</li>
                    </ul>
                </div>
            </div>
            <div className="text-right flex flex-col justify-end">
                 <p className="font-bold text-castor-red uppercase text-xs mb-0.5">Cerro Castor</p>
                 <p>Ushuaia, Tierra del Fuego, Argentina</p>
                 <p>www.cerrocastor.com</p>
                 <p>ventas@cerrocastor.com</p>
            </div>
        </div>
      </div>

    </div>
  );
});

OfficialPdfTemplate.displayName = 'OfficialPdfTemplate';

export default OfficialPdfTemplate;