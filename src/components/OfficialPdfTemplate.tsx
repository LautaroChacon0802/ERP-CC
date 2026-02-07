import React from 'react';
import { Scenario } from '../types';
import { formatCurrency } from '../utils';
import CastorLogo from './CastorLogo';

// ==========================================
// PALETA DE COLORES (Sanitizada a Hex Safe)
// ==========================================
const STYLES = {
  colors: {
    primary: '#000000',
    secondary: '#8A99A8',
    accent: '#C8102E', // Rojo Castor
    bgHeader: '#F8FAFC',
    border: '#E2E8F0',
    white: '#FFFFFF', // Hex explícito, no usar string 'white'
  },
  fonts: {
    family: 'Inter, system-ui, sans-serif',
  }
};

interface OfficialPdfTemplateProps {
  scenario: Scenario;
}

const OfficialPdfTemplate: React.FC<OfficialPdfTemplateProps> = ({ scenario }) => {
  const data = scenario.calculatedData || [];
  const isRental = scenario.category && scenario.category !== 'LIFT';
  
  // Formateo de Fechas para el Header
  const validFrom = scenario.params.validFrom ? new Date(scenario.params.validFrom).toLocaleDateString('es-AR') : '-';
  const validTo = scenario.params.validTo ? new Date(scenario.params.validTo).toLocaleDateString('es-AR') : '-';
  const validityString = `Vigencia: ${validFrom} al ${validTo}`;

  // --- ESTILOS REUTILIZABLES ---
  const tableHeaderStyle = {
    backgroundColor: STYLES.colors.bgHeader,
    color: STYLES.colors.secondary, // Hex seguro
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    padding: '12px 16px',
    textAlign: 'left' as const,
    borderBottom: `1px solid ${STYLES.colors.border}`,
    letterSpacing: '0.5px',
  };

  const tableCellStyle = {
    padding: '10px 16px',
    borderBottom: `1px solid ${STYLES.colors.border}`,
    color: STYLES.colors.primary,
    fontSize: '13px',
    fontWeight: 500,
  };

  const cardStyle = {
    backgroundColor: STYLES.colors.white,
    border: `1px solid ${STYLES.colors.border}`,
    borderRadius: '12px',
    overflow: 'hidden',
    flex: 1, // Para que ocupen el mismo ancho en flex row
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  };

  const cardHeaderStyle = {
    padding: '20px',
    borderBottom: `1px solid ${STYLES.colors.border}`,
    backgroundColor: STYLES.colors.white,
  };

  // --- RENDERIZADO LIFT (DOBLE CARD) ---
  const renderLiftMode = () => (
    <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', alignItems: 'flex-start' }}>
      {/* CARD REGULAR */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '18px', color: STYLES.colors.primary, fontWeight: 800 }}>Temporada Regular</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: STYLES.colors.secondary }}>Tarifa base estándar</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Días</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Adulto</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Menor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`reg-${row.days}`}>
                <td style={{ ...tableCellStyle, fontWeight: 700, color: STYLES.colors.secondary }}>{row.days}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatCurrency(row.adultRegularVisual)}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>{formatCurrency(row.minorRegularVisual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CARD PROMO */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '18px', color: STYLES.colors.accent, fontWeight: 800 }}>Temporada Promo</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: STYLES.colors.secondary }}>Tarifas promocionales aplicadas</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Días</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Adulto</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Menor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`promo-${row.days}`}>
                <td style={{ ...tableCellStyle, fontWeight: 700, color: STYLES.colors.secondary }}>{row.days}</td>
                <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 700, color: STYLES.colors.accent }}>
                    {formatCurrency(row.adultPromoVisual)}
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 700, color: STYLES.colors.accent }}>
                    {formatCurrency(row.minorPromoVisual)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- RENDERIZADO RENTAL (CARD ÚNICA ANCHA) ---
  const renderRentalMode = () => {
    // Obtener headers dinámicamente del primer row si existen items
    const rentalItemIds = data.length > 0 && data[0].rentalItems ? Object.keys(data[0].rentalItems) : [];
    
    return (
      <div style={{ display: 'flex', marginBottom: '40px' }}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ margin: 0, fontSize: '18px', color: STYLES.colors.primary, fontWeight: 800 }}>Equipos & Accesorios</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: STYLES.colors.secondary }}>Tarifas de alquiler diario</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Días</th>
                {rentalItemIds.map(id => (
                   <th key={id} style={{ ...tableHeaderStyle, textAlign: 'right' }}>
                      {id.replace(/_/g, ' ').replace('COMP', '').trim()} 
                   </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={`rent-${row.days}`}>
                  <td style={{ ...tableCellStyle, fontWeight: 700, color: STYLES.colors.secondary }}>{row.days}</td>
                  {rentalItemIds.map(id => (
                    <td key={id} style={{ ...tableCellStyle, textAlign: 'right' }}>
                        {formatCurrency(row.rentalItems?.[id]?.visual || 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div 
        id="official-pdf-template" 
        style={{ 
            width: '1200px', 
            backgroundColor: STYLES.colors.white,
            color: STYLES.colors.primary,
            padding: '60px',
            fontFamily: STYLES.fonts.family,
            boxSizing: 'border-box'
        }}
    >
      {/* 1. HEADER */}
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px', 
          paddingBottom: '24px', 
          borderBottom: `2px solid ${STYLES.colors.accent}` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Logo Wrapper */}
            <div style={{ width: '80px', display: 'flex', alignItems: 'center' }}>
                <CastorLogo className="w-full h-auto text-black" />
            </div>
            <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', lineHeight: '1.2' }}>
                    TARIFARIO OFICIAL
                </h1>
                <span style={{ fontSize: '16px', color: STYLES.colors.secondary, fontWeight: 500 }}>
                    Temporada {scenario.season}
                </span>
            </div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: STYLES.colors.primary }}>
                {scenario.name}
            </h2>
            <div style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: STYLES.colors.bgHeader, borderRadius: '6px', display: 'inline-block' }}>
                <p style={{ margin: 0, fontSize: '13px', color: STYLES.colors.secondary, fontWeight: 600 }}>
                    {validityString}
                </p>
            </div>
        </div>
      </div>

      {/* 2. INTRO TEXT */}
      <div style={{ marginBottom: '40px', maxWidth: '800px' }}>
        <p style={{ margin: 0, fontSize: '15px', color: STYLES.colors.secondary, lineHeight: '1.6' }}>
            A continuación se detallan los valores vigentes para la temporada actual. 
            Las tarifas están expresadas en pesos argentinos, incluyen IVA y están sujetas a modificaciones sin previo aviso. 
            Consulte por planes familiares y descuentos especiales en boletería.
        </p>
      </div>

      {/* 3. PRICE GRID (DUAL MODE) */}
      {isRental ? renderRentalMode() : renderLiftMode()}

      {/* 4. IMPORTANT INFORMATION (LEGALES) */}
      <div style={{ 
          backgroundColor: STYLES.colors.bgHeader, 
          border: `1px solid ${STYLES.colors.border}`, 
          borderRadius: '12px', 
          padding: '32px',
          position: 'relative'
      }}>
        <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: '32px', 
            transform: 'translateY(-50%)', 
            backgroundColor: STYLES.colors.accent, 
            color: STYLES.colors.white, // Hex Safe
            padding: '4px 12px', 
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase'
        }}>
            Información Importante
        </div>
        
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '0', listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
                "Las fechas de apertura y cierre de temporada están sujetas a condiciones climáticas y de nieve.",
                "Los pases son personales, intransferibles y no reembolsables bajo ninguna circunstancia.",
                "En caso de pérdida, rotura o deterioro de la tarjeta (Keycard), se cobrará un cargo por reposición.",
                "Se considera 'Menor' a niños de 5 a 11 años inclusive. 'Infante' (0-4 años) sin cargo (solo seguro).",
                "El pase de medio día es válido estrictamente a partir de las 13:00 hs.",
                "La empresa se reserva el derecho de admisión y permanencia en las instalaciones.",
                "El uso de casco es obligatorio para menores en escuelas y snowpark."
            ].map((text, i) => (
                <li key={i} style={{ fontSize: '12px', color: STYLES.colors.secondary, display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: '1.5' }}>
                    <span style={{ color: STYLES.colors.accent, fontSize: '18px', lineHeight: '12px' }}>•</span>
                    <span>{text}</span>
                </li>
            ))}
        </ul>
      </div>

      {/* 5. FOOTER */}
      <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: `1px solid ${STYLES.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: STYLES.colors.secondary, fontWeight: 600 }}>
                &copy; {new Date().getFullYear()} Cerro Castor
            </span>
            <span style={{ fontSize: '11px', color: STYLES.colors.border }}>|</span>
            <span style={{ fontSize: '11px', color: STYLES.colors.secondary }}>
                Ushuaia, Tierra del Fuego
            </span>
        </div>
        <span style={{ fontSize: '10px', color: STYLES.colors.secondary, fontStyle: 'italic' }}>
            Documento generado el {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString('es-AR')}
        </span>
      </div>
    </div>
  );
};

export default OfficialPdfTemplate;