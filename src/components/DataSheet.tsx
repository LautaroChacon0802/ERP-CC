import React, { useRef, useState, useEffect } from 'react';
import { PricingRow, Scenario } from '../types';
import { formatCurrency, formatDecimal, format4Decimals } from '../utils'; // Import updated
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, File, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import OfficialPdfTemplate from './OfficialPdfTemplate';

type ViewMode = 'matrix' | 'visual' | 'system';

interface Props {
  scenario: Scenario;
  viewMode: ViewMode;
}

const DataSheet: React.FC<Props> = ({ scenario, viewMode }) => {
  const isVisual = viewMode === 'visual';
  const isSystem = viewMode === 'system';
  const isMatrix = viewMode === 'matrix';
  const tableRef = useRef<HTMLDivElement>(null);
  const officialTemplateRef = useRef<HTMLDivElement>(null);
  
  // State for export operations
  const [isExporting, setIsExporting] = useState(false);
  
  // State for Dropdown Menu with grace period
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const closeMenuTimeoutRef = useRef<number | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeMenuTimeoutRef.current) {
        clearTimeout(closeMenuTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnterExport = () => {
    if (closeMenuTimeoutRef.current) {
      clearTimeout(closeMenuTimeoutRef.current);
      closeMenuTimeoutRef.current = null;
    }
    setIsExportMenuOpen(true);
  };

  const handleMouseLeaveExport = () => {
    closeMenuTimeoutRef.current = window.setTimeout(() => {
      setIsExportMenuOpen(false);
    }, 300); // 300ms grace period to allow cursor to move over gap
  };


  const getTitle = () => {
    if (isMatrix) return 'Matriz de Cálculo';
    if (isVisual) return 'Tarifario Visual (Agencias)';
    if (isSystem) return 'Tarifario Sistema (Doblemente)';
    return '';
  };

  const getDescription = () => {
    if (isMatrix) return 'Cálculo técnico: (Base x Días) x (1 - %Dto).';
    if (isVisual) return 'Aplicando reglas de redondeo: Adulto (Cielo), Menor (Piso).';
    if (isSystem) return 'Valores DIARIOS truncados a 4 decimales.';
    return '';
  };

  // --- EXPORT FUNCTIONS ---

  const handleExportExcel = () => {
    const data = scenario.calculatedData.map(row => {
      const baseObj = { Días: row.days };
      if (isVisual) {
        return {
          ...baseObj,
          'Adulto Regular': row.adultRegularVisual,
          'Menor Regular': row.minorRegularVisual,
          'Adulto Promo': row.adultPromoVisual,
          'Menor Promo': row.minorPromoVisual
        };
      } else if (isSystem) {
        // EXPORT: SYSTEM VALUES (DAILY, 4 DECIMALS)
        return {
          ...baseObj,
          'Adulto Regular (Diario)': row.adultRegularDailySystem,
          'Menor Regular (Diario)': row.minorRegularDailySystem,
          'Adulto Promo (Diario)': row.adultPromoDailySystem,
          'Menor Promo (Diario)': row.minorPromoDailySystem
        };
      } else {
        return {
           ...baseObj,
           '% Dto': row.coefficient,
           'Adulto Raw': row.adultRegularRaw,
           'Menor Raw': row.minorRegularRaw
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tarifario");
    XLSX.writeFile(wb, `Castor_${scenario.name.replace(/\s+/g, '_')}_${viewMode}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(200, 16, 46); // Brand Red
    doc.text("CERRO CASTOR", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Tarifario: ${scenario.name} (${scenario.season})`, 14, 28);
    doc.text(`Tipo: ${getTitle()}`, 14, 34);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 40);

    // Table
    const headers = isVisual 
        ? [['Días', 'Adulto Regular', 'Menor Regular', 'Adulto Promo', 'Menor Promo']]
        : isSystem 
            ? [['Días', 'Ad. Reg (Diario)', 'Men. Reg (Diario)', 'Ad. Promo (Diario)', 'Men. Promo (Diario)']]
            : [['Días', '% Dto', 'Adulto Raw', 'Menor Raw', 'Ad. Promo Raw', 'Men. Promo Raw']];

    const body = scenario.calculatedData.map(row => {
        if (isVisual) {
            return [
                row.days, 
                formatCurrency(row.adultRegularVisual), 
                formatCurrency(row.minorRegularVisual),
                formatCurrency(row.adultPromoVisual),
                formatCurrency(row.minorPromoVisual)
            ];
        } else if (isSystem) {
            // PDF EXPORT: SYSTEM VALUES (DAILY, 4 DECIMALS)
            return [
                row.days,
                format4Decimals(row.adultRegularDailySystem),
                format4Decimals(row.minorRegularDailySystem),
                format4Decimals(row.adultPromoDailySystem),
                format4Decimals(row.minorPromoDailySystem)
            ];
        } else {
            return [
                row.days,
                row.coefficient.toFixed(2) + '%',
                formatDecimal(row.adultRegularRaw),
                formatDecimal(row.minorRegularRaw),
                formatDecimal(row.adultPromoRaw),
                formatDecimal(row.minorPromoRaw)
            ];
        }
    });

    autoTable(doc, {
        head: headers,
        body: body,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [200, 16, 46] }, // Brand Red
        styles: { fontSize: 9 }
    });

    doc.save(`Castor_${scenario.name}_${viewMode}.pdf`);
  };

  const handleExportJPEG = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
    // Timeout to allow UI to update (show branding header)
    setTimeout(async () => {
        try {
            const canvas = await html2canvas(tableRef.current!, { scale: 2, backgroundColor: '#ffffff' });
            const image = canvas.toDataURL("image/jpeg", 1.0);
            const link = document.createElement("a");
            link.href = image;
            link.download = `Castor_${scenario.name}_${viewMode}.jpg`;
            link.click();
        } finally {
            setIsExporting(false);
        }
    }, 100);
  };

  // New function to export the Official A4 Template
  const handleExportOfficial = async () => {
    if (!officialTemplateRef.current) return;
    
    try {
        // High scale for print quality (A4 @ 300dpi approx)
        const canvas = await html2canvas(officialTemplateRef.current, { 
            scale: 2.5, 
            backgroundColor: '#ffffff',
            useCORS: true 
        });
        const image = canvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        link.href = image;
        link.download = `OFICIAL_Castor_${scenario.name}.jpg`;
        link.click();
    } catch (e) {
        console.error("Error exporting official template", e);
        alert("Error al generar la imagen oficial.");
    }
  };

  const handleExportWord = () => {
     // Simple HTML to Word Blob
     const tableHTML = document.getElementById('data-table')?.outerHTML || '';
     const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
     <head><meta charset='utf-8'><title>Tarifario</title>
     <style>
        body { font-family: sans-serif; }
        table { border-collapse: collapse; width: 100%; } 
        td, th { border: 1px solid #999; padding: 5px; text-align: right; }
        th { background-color: #f3f3f3; color: #C8102E; }
     </style>
     </head><body>
     <h1 style="color: #C8102E;">CERRO CASTOR</h1>
     <h2>${scenario.name} - ${getTitle()}</h2>
     <p>Temporada: ${scenario.season}</p>
     `;
     const postHtml = "</body></html>";
     const html = preHtml + tableHTML + postHtml;

     const blob = new Blob(['\ufeff', html], {
         type: 'application/msword'
     });
     
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `Castor_${scenario.name}_${viewMode}.doc`;
     link.click();
  };

  return (
    <div className="p-6 bg-white min-h-[500px]">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isVisual ? 'text-castor-red' : isSystem ? 'text-purple-800' : 'text-blue-800'}`}>
            {getTitle()}
          </h2>
          <p className="text-sm text-gray-500">{getDescription()}</p>
        </div>
        
        <div className="flex gap-2">
            {/* Export Buttons */}
            <div 
                className="relative z-20"
                onMouseEnter={handleMouseEnterExport}
                onMouseLeave={handleMouseLeaveExport}
            >
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded shadow hover:bg-slate-700 transition-colors text-sm font-medium">
                    <Download size={16} /> Exportar
                </button>
                
                {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border animate-in fade-in zoom-in-95 duration-100">
                        {/* Official Export Option */}
                        <button onClick={handleExportOfficial} className="w-full text-left px-4 py-3 text-sm font-bold text-castor-red hover:bg-red-50 flex items-center gap-2 border-b">
                            <Printer size={16} /> Diseño Oficial (.jpg)
                        </button>
                        
                        <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-green-600"/> Excel (.xlsx)
                        </button>
                        <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <FileText size={16} className="text-red-600"/> PDF (.pdf)
                        </button>
                        <button onClick={handleExportJPEG} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-600"/> Tabla actual (.jpg)
                        </button>
                        <button onClick={handleExportWord} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <File size={16} className="text-blue-800"/> Word (.doc)
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div ref={tableRef} className={`overflow-x-auto border rounded-lg shadow-sm ${isExporting ? 'p-8 bg-white' : ''}`}>
        {isExporting && (
             <div className="mb-6 text-center border-b-2 border-castor-red pb-4">
                 <h1 className="text-3xl font-bold text-castor-red uppercase tracking-wider">Cerro Castor</h1>
                 <h2 className="text-lg text-gray-600 font-semibold mt-1">{scenario.name}</h2>
                 <p className="text-sm text-gray-500">{getTitle()} | {scenario.season}</p>
             </div>
        )}
        <table className="min-w-full divide-y divide-gray-200 text-right" id="data-table">
          <thead className={
              isVisual ? 'bg-red-50' : isSystem ? 'bg-purple-50' : 'bg-blue-50'
          }>
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 z-10">
                Días
              </th>
              { !isSystem && <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">% Dto</th> }
              
              <th scope="col" className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-l border-gray-200">
                Adulto Regular {isSystem && '(Diario)'}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">
                Menor Regular {isSystem && '(Diario)'}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider border-l border-gray-200">
                Adulto Promo {isSystem && '(Diario)'}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                Menor Promo {isSystem && '(Diario)'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
            {scenario.calculatedData.map((row) => (
              <tr key={row.days} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-left text-gray-900 font-bold sticky left-0 bg-white z-10 border-r">
                  {row.days}
                </td>
                { !isSystem && <td className="px-4 py-3 text-gray-400 text-xs">{row.coefficient.toFixed(2)}%</td> }
                
                {/* Adult Regular */}
                <td className="px-4 py-3 font-bold text-gray-900 border-l bg-gray-50/50">
                   {isSystem ? format4Decimals(row.adultRegularDailySystem) : 
                    isVisual ? formatCurrency(row.adultRegularVisual) : 
                    formatDecimal(row.adultRegularRaw)}
                </td>
                {/* Minor Regular */}
                <td className="px-4 py-3 text-gray-800">
                   {isSystem ? format4Decimals(row.minorRegularDailySystem) : 
                    isVisual ? formatCurrency(row.minorRegularVisual) : 
                    formatDecimal(row.minorRegularRaw)}
                </td>
                 {/* Adult Promo */}
                <td className="px-4 py-3 text-gray-600 border-l bg-gray-50/50">
                   {isSystem ? format4Decimals(row.adultPromoDailySystem) : 
                    isVisual ? formatCurrency(row.adultPromoVisual) : 
                    formatDecimal(row.adultPromoRaw)}
                </td>
                {/* Minor Promo */}
                <td className="px-4 py-3 text-gray-600">
                   {isSystem ? format4Decimals(row.minorPromoDailySystem) : 
                    isVisual ? formatCurrency(row.minorPromoVisual) : 
                    formatDecimal(row.minorPromoRaw)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 p-2 text-xs text-gray-400 text-center border-t">
             Documento generado por Pricing Manager - Cerro Castor
        </div>
      </div>

      {/* --- HIDDEN OFFICIAL TEMPLATE FOR EXPORT --- */}
      <div className="fixed -top-[9999px] left-0 overflow-hidden">
         <OfficialPdfTemplate ref={officialTemplateRef} scenario={scenario} />
      </div>

    </div>
  );
};

export default DataSheet;