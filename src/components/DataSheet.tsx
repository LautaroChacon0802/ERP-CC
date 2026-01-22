import React, { useRef, useState, useEffect } from 'react';
import { PricingRow, Scenario, ScenarioCategory, RentalItem } from '../types';
import { formatCurrency, formatDecimal, format4Decimals } from '../utils';
import { getItemsByCategory } from '../constants';
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, File, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

type ViewMode = 'matrix' | 'visual' | 'system';

interface Props {
  scenario: Scenario;
  viewMode: ViewMode;
}

const DataSheet: React.FC<Props> = ({ scenario, viewMode }) => {
  const isVisual = viewMode === 'visual';
  const isSystem = viewMode === 'system';
  const category = scenario.category || 'LIFT';
  const isRental = category !== 'LIFT';
  const isAlpino = category === 'RENTAL_ALPINO';
  
  const tableRef = useRef<HTMLDivElement>(null);
  
  // State for export operations
  const [isExporting, setIsExporting] = useState(false);
  
  // State for Dropdown Menu
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const closeMenuTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeMenuTimeoutRef.current) clearTimeout(closeMenuTimeoutRef.current);
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
    }, 300);
  };

  // --- HELPERS ---

  const getTitle = () => {
    if (isSystem) return 'Tarifario Sistema (Doblemente)';
    if (category === 'LIFT') return 'Tarifario Medios de Elevación';
    if (category === 'RENTAL_ALPINO') return 'Rental Alpino';
    return 'Tarifario Rental / Equipos';
  };

  const getDescription = () => {
    if (isSystem) return 'Valores UNITARIOS truncados a 4 decimales para carga en sistema.';
    if (isVisual) return 'Precios finales redondeados (Visualización Agencias/Público).';
    return 'Matriz de cálculo cruda (Base x Coeficiente).';
  };

  // --- LOGIC FOR RENTAL COLUMNS ---
  // If Rental, we get items dynamically.
  // Special case Alpino: We might need to split tables by Unit (Day vs Hour)
  const allItems = isRental ? getItemsByCategory(category) : [];
  
  // For Alpino, we split items. For others, 'dailyItems' has everything.
  const hourlyItems = isAlpino ? allItems.filter(i => i.pricingUnit === 'HOUR') : [];
  const dailyItems = isAlpino ? allItems.filter(i => i.pricingUnit === 'DAY') : allItems;

  const renderValue = (row: PricingRow, itemId?: string, legacyField?: string) => {
    // 1. RENTAL ITEM LOGIC
    if (itemId && row.rentalItems && row.rentalItems[itemId]) {
        const data = row.rentalItems[itemId];
        if (isSystem) return format4Decimals(data.dailySystem);
        if (isVisual) return formatCurrency(data.visual);
        return formatDecimal(data.raw);
    }
    // 2. LIFT LEGACY LOGIC
    if (legacyField) {
        const val = (row as any)[legacyField]; // Quick access
        if (isSystem) return format4Decimals(val);
        if (isVisual && legacyField.includes('Visual')) return formatCurrency(val);
        return formatDecimal(val);
    }
    return '-';
  };

  // --- EXPORT FUNCTIONS (Updated for Dynamic Columns) ---

  const handleExportExcel = () => {
    // Helper to generate a flat object for a row
    const generateRowData = (row: PricingRow, items: RentalItem[], unitLabel: string) => {
        const base = { [unitLabel]: row.days };
        const values: any = {};
        
        if (isRental) {
            items.forEach(item => {
                const key = item.label + (isSystem ? ' (Unitario)' : '');
                const val = row.rentalItems?.[item.id];
                values[key] = val ? (isSystem ? val.dailySystem : isVisual ? val.visual : val.raw) : 0;
            });
        } else {
            // LIFT
            if (isSystem) {
                values['Adulto Reg'] = row.adultRegularDailySystem;
                values['Menor Reg'] = row.minorRegularDailySystem;
                values['Adulto Promo'] = row.adultPromoDailySystem;
                values['Menor Promo'] = row.minorPromoDailySystem;
            } else {
                values['Adulto Reg'] = isVisual ? row.adultRegularVisual : row.adultRegularRaw;
                values['Menor Reg'] = isVisual ? row.minorRegularVisual : row.minorRegularRaw;
                values['Adulto Promo'] = isVisual ? row.adultPromoVisual : row.adultPromoRaw;
                values['Menor Promo'] = isVisual ? row.minorPromoVisual : row.minorPromoRaw;
            }
        }
        return { ...base, ...values };
    };

    const wb = XLSX.utils.book_new();

    if (isAlpino) {
        // Sheet 1: Hours
        if (hourlyItems.length > 0) {
            const dataH = scenario.calculatedData.map(r => generateRowData(r, hourlyItems, 'Horas'));
            const wsH = XLSX.utils.json_to_sheet(dataH);
            XLSX.utils.book_append_sheet(wb, wsH, "Por Hora");
        }
        // Sheet 2: Days
        if (dailyItems.length > 0) {
            const dataD = scenario.calculatedData.map(r => generateRowData(r, dailyItems, 'Días'));
            const wsD = XLSX.utils.json_to_sheet(dataD);
            XLSX.utils.book_append_sheet(wb, wsD, "Por Día");
        }
    } else {
        // Single Sheet
        const data = scenario.calculatedData.map(r => generateRowData(r, dailyItems, 'Días'));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Tarifario");
    }

    XLSX.writeFile(wb, `Castor_${scenario.name}_${viewMode}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for many columns
    
    // Header Wrapper
    const addHeader = (title: string, y: number) => {
        doc.setFontSize(14);
        doc.setTextColor(200, 16, 46);
        doc.text("CERRO CASTOR", 14, y);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`${scenario.name} - ${title}`, 14, y + 6);
    };

    const generateTable = (items: RentalItem[], unitLabel: string, startY: number) => {
        const head = [[unitLabel, ...items.map(i => i.label)]];
        if (!isRental) {
             // Hardcoded LIFT headers
             head[0] = ['Días', 'Adulto Regular', 'Menor Regular', 'Adulto Promo', 'Menor Promo'];
        }

        const body = scenario.calculatedData.map(row => {
            const firstCol = row.days;
            if (isRental) {
                 return [firstCol, ...items.map(i => renderValue(row, i.id))];
            } else {
                 return [
                     firstCol,
                     renderValue(row, undefined, isSystem ? 'adultRegularDailySystem' : 'adultRegularVisual'),
                     renderValue(row, undefined, isSystem ? 'minorRegularDailySystem' : 'minorRegularVisual'),
                     renderValue(row, undefined, isSystem ? 'adultPromoDailySystem' : 'adultPromoVisual'),
                     renderValue(row, undefined, isSystem ? 'minorPromoDailySystem' : 'minorPromoVisual'),
                 ];
            }
        });

        autoTable(doc, {
            head,
            body,
            startY,
            theme: 'grid',
            headStyles: { fillColor: [200, 16, 46], fontSize: 8 },
            styles: { fontSize: 7, halign: 'right' },
            columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
        });
        return (doc as any).lastAutoTable.finalY + 15;
    };

    let cursorY = 20;
    
    if (isAlpino) {
        if (hourlyItems.length > 0) {
            addHeader("Tarifas por Hora", cursorY);
            cursorY = generateTable(hourlyItems, 'Horas', cursorY + 10);
        }
        if (dailyItems.length > 0) {
            addHeader("Tarifas por Día", cursorY);
            cursorY = generateTable(dailyItems, 'Días', cursorY + 10);
        }
    } else {
        addHeader(getTitle(), cursorY);
        generateTable(dailyItems, 'Días', cursorY + 10);
    }

    doc.save(`Castor_${scenario.name}_${viewMode}.pdf`);
  };

  const handleExportJPEG = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);
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

  // --- RENDER TABLE COMPONENT ---
  const RenderTable = ({ items, unitLabel }: { items: RentalItem[], unitLabel: string }) => (
    <div className="overflow-x-auto border rounded-lg shadow-sm mb-8">
        <table className="min-w-full divide-y divide-gray-200 text-right">
            <thead className={isVisual ? 'bg-red-50' : isSystem ? 'bg-purple-50' : 'bg-blue-50'}>
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 z-10 bg-inherit border-r">
                        {unitLabel}
                    </th>
                    {items.map(item => (
                        <th key={item.id} className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider min-w-[120px]">
                            {item.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-mono text-xs">
                {scenario.calculatedData.map((row) => (
                    <tr key={row.days} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-left text-gray-900 font-bold sticky left-0 bg-white z-10 border-r">
                            {row.days}
                        </td>
                        {items.map(item => (
                             <td key={item.id} className="px-4 py-3 text-gray-800">
                                {renderValue(row, item.id)}
                             </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );

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
                        <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-green-600"/> Excel (.xlsx)
                        </button>
                        <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <FileText size={16} className="text-red-600"/> PDF (.pdf)
                        </button>
                        <button onClick={handleExportJPEG} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-600"/> Tabla actual (.jpg)
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div ref={tableRef} className={`${isExporting ? 'p-8 bg-white' : ''}`}>
        {isExporting && (
             <div className="mb-6 text-center border-b-2 border-castor-red pb-4">
                 <h1 className="text-3xl font-bold text-castor-red uppercase tracking-wider">Cerro Castor</h1>
                 <h2 className="text-lg text-gray-600 font-semibold mt-1">{scenario.name}</h2>
             </div>
        )}

        {/* LOGIC TO RENDER TABLES */}
        
        {/* CASE 1: RENTAL ALPINO (SPLIT VIEW) */}
        {isAlpino ? (
            <>
                {hourlyItems.length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-500 uppercase text-xs mb-2">Tarifas por Hora</h3>
                        <RenderTable items={hourlyItems} unitLabel="Horas" />
                    </div>
                )}
                {dailyItems.length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-bold text-gray-500 uppercase text-xs mb-2">Tarifas por Día</h3>
                        <RenderTable items={dailyItems} unitLabel="Días" />
                    </div>
                )}
            </>
        ) : isRental ? (
             /* CASE 2: STANDARD RENTAL (Dynamic Columns) */
             <RenderTable items={dailyItems} unitLabel="Días" />
        ) : (
             /* CASE 3: LIFT LEGACY (Fixed Columns) */
             <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-right">
                  <thead className={isVisual ? 'bg-red-50' : isSystem ? 'bg-purple-50' : 'bg-blue-50'}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 z-10">Días</th>
                      {!isSystem && <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">% Dto</th>}
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Adulto Reg</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Menor Reg</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Adulto Promo</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider">Menor Promo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
                    {scenario.calculatedData.map((row) => (
                      <tr key={row.days} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-left text-gray-900 font-bold sticky left-0 bg-white z-10 border-r">{row.days}</td>
                        {!isSystem && <td className="px-4 py-3 text-gray-400 text-xs">{row.coefficient.toFixed(2)}%</td>}
                        <td className="px-4 py-3 font-bold text-gray-900">{renderValue(row, undefined, isSystem ? 'adultRegularDailySystem' : isVisual ? 'adultRegularVisual' : 'adultRegularRaw')}</td>
                        <td className="px-4 py-3 text-gray-800">{renderValue(row, undefined, isSystem ? 'minorRegularDailySystem' : isVisual ? 'minorRegularVisual' : 'minorRegularRaw')}</td>
                        <td className="px-4 py-3 text-gray-600">{renderValue(row, undefined, isSystem ? 'adultPromoDailySystem' : isVisual ? 'adultPromoVisual' : 'adultPromoRaw')}</td>
                        <td className="px-4 py-3 text-gray-600">{renderValue(row, undefined, isSystem ? 'minorPromoDailySystem' : isVisual ? 'minorPromoVisual' : 'minorPromoRaw')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
        )}
        
        <div className="mt-4 p-2 text-xs text-gray-400 text-center border-t">
             Documento generado por Pricing Manager - Cerro Castor
        </div>
      </div>
    </div>
  );
};

export default DataSheet;