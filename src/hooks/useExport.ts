import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Scenario } from '../types';

export const useExport = () => {
  const exportToExcel = useCallback((scenario: Scenario) => {
    if (!scenario.calculatedData || scenario.calculatedData.length === 0) {
      console.warn("No hay datos para exportar");
      return;
    }

    // 1. Aplanar los datos para que Excel los entienda
    const exportData = scenario.calculatedData.map(row => {
      // Columnas base
      const baseRow: Record<string, any> = {
        "Días": row.days,
        "Coeficiente (%)": row.coefficient,
      };

      if (scenario.category === 'LIFT' || !scenario.category) {
        // Estructura LIFT (Pase de esquí)
        baseRow["Adulto (Lista)"] = row.adultRegularRaw;
        baseRow["Adulto (Venta)"] = row.adultRegularVisual;
        baseRow["Adulto (Sistema Diario)"] = row.adultRegularDailySystem;
        
        baseRow["Menor (Lista)"] = row.minorRegularRaw;
        baseRow["Menor (Venta)"] = row.minorRegularVisual;
        baseRow["Menor (Sistema Diario)"] = row.minorRegularDailySystem;
        
        baseRow["Adulto Promo (Venta)"] = row.adultPromoVisual;
        baseRow["Menor Promo (Venta)"] = row.minorPromoVisual;
      } else {
        // Estructura RENTAL (Equipos)
        // Iteramos sobre los items dinámicos si existen
        if (row.rentalItems) {
            Object.entries(row.rentalItems).forEach(([key, values]) => {
                // Generamos columnas dinámicas: Ej "Ski Sport (Venta)"
                baseRow[`${key} (Venta)`] = values.visual;
                baseRow[`${key} (Sistema)`] = values.dailySystem;
            });
        }
      }

      return baseRow;
    });

    // 2. Crear Libro y Hoja
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Ajustar anchos de columna automáticamente (estimación básica)
    const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tarifario Detallado");

    // 3. Generar nombre de archivo descriptivo
    // Formato: Tarifario_[Temp]_[Cat]_[Nombre].xlsx
    const cleanName = (scenario.name || 'SinNombre').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const category = scenario.category || 'LIFT';
    const filename = `Tarifario_${scenario.season}_${category}_${cleanName}.xlsx`;

    // 4. Descargar
    XLSX.writeFile(workbook, filename);
  }, []);

  return { exportToExcel };
};