import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { PricingRow, Scenario } from '../types';
import { formatCurrency } from '../utils';

export const useExport = () => {
  const exportToExcel = useCallback((scenario: Scenario) => {
    if (!scenario.calculatedData || scenario.calculatedData.length === 0) {
      console.warn("No hay datos para exportar");
      return;
    }

    // 1. Mapear datos a formato legible para negocio (Columnas en Español)
    const exportData = scenario.calculatedData.map(row => ({
      "Días": row.days,
      "Coeficiente": row.coefficient,
      
      "Adulto (Lista)": row.adultRegularRaw,
      "Adulto (Venta)": row.adultRegularVisual,
      "Adulto (Sistema)": row.adultRegularDailySystem,
      
      "Menor (Lista)": row.minorRegularRaw,
      "Menor (Venta)": row.minorRegularVisual,
      "Menor (Sistema)": row.minorRegularDailySystem,
      
      "Adulto Promo (Venta)": row.adultPromoVisual,
      "Menor Promo (Venta)": row.minorPromoVisual,
    }));

    // 2. Crear Libro y Hoja
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Ajustar anchos de columna (cosmético)
    const wscols = [
      { wch: 6 },  // Días
      { wch: 10 }, // Coef
      { wch: 15 }, // Adulto Lista
      { wch: 15 }, // Adulto Venta
      { wch: 15 }, // Adulto Sistema
      { wch: 15 }, // Menor Lista
      { wch: 15 }, // Menor Venta
      { wch: 15 }, // Menor Sistema
    ];
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tarifario Detallado");

    // 3. Generar nombre de archivo descriptivo
    // Ej: Tarifario_2025_LIFT_Base_v1.xlsx
    const cleanName = scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const category = scenario.category || 'LIFT';
    const filename = `Tarifario_${scenario.season}_${category}_${cleanName}.xlsx`;

    // 4. Descargar
    XLSX.writeFile(workbook, filename);
  }, []);

  return { exportToExcel };
};