import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Scenario } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const useExport = () => {
  
  // EXCEL
  const exportToExcel = useCallback((scenario: Scenario) => {
    if (!scenario.calculatedData || scenario.calculatedData.length === 0) {
      console.warn("No hay datos para exportar");
      return;
    }

    const exportData = scenario.calculatedData.map(row => {
      const baseRow: Record<string, any> = {
        "Días": row.days,
        "Coeficiente (%)": row.coefficient,
      };

      if (scenario.category === 'LIFT' || !scenario.category) {
        baseRow["Adulto (Lista)"] = row.adultRegularRaw;
        baseRow["Adulto (Venta)"] = row.adultRegularVisual;
        baseRow["Adulto (Sistema Diario)"] = row.adultRegularDailySystem;
        baseRow["Menor (Lista)"] = row.minorRegularRaw;
        baseRow["Menor (Venta)"] = row.minorRegularVisual;
        baseRow["Menor (Sistema Diario)"] = row.minorRegularDailySystem;
        baseRow["Adulto Promo (Venta)"] = row.adultPromoVisual;
        baseRow["Menor Promo (Venta)"] = row.minorPromoVisual;
      } else {
        if (row.rentalItems) {
            Object.entries(row.rentalItems).forEach(([key, values]) => {
                baseRow[`${key} (Venta)`] = values.visual;
                baseRow[`${key} (Sistema)`] = values.dailySystem;
            });
        }
      }
      return baseRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tarifario Detallado");
    const cleanName = (scenario.name || 'SinNombre').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `Tarifario_${scenario.season}_${scenario.category || 'LIFT'}_${cleanName}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }, []);

  // PDF
  const exportToPdf = useCallback(async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
    } catch (err) {
        console.error("Error exportando PDF", err);
    }
  }, []);

  // JPEG
  const exportToJpeg = useCallback(async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, { scale: 2 });
        const link = document.createElement('a');
        link.download = `${fileName}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    } catch (err) {
        console.error("Error exportando Imagen", err);
    }
  }, []);

  return { exportToExcel, exportToPdf, exportToJpeg };
};