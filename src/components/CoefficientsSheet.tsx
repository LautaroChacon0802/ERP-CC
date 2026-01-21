import React from 'react';
import { CoefficientRow, Scenario, ScenarioStatus } from '../types';

interface Props {
  scenario: Scenario;
  onUpdateCoefficient: (day: number, value: number) => void;
}

const CoefficientsSheet: React.FC<Props> = ({ scenario, onUpdateCoefficient }) => {
  const isReadOnly = scenario.status === ScenarioStatus.CLOSED;

  return (
    <div className="p-6 bg-white min-h-[500px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Tabla de Descuentos por Cantidad de Días</h2>
        <p className="text-sm text-gray-500">
            Defina el porcentaje de descuento que se aplicará sobre el total lineal (Tarifa Base x Días).
            <br/>
            <strong>Fórmula:</strong> Precio = (Base x Días) x (1 - %Dto/100)
        </p>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Días
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Descuento (Input)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factor Resultante (Ref)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scenario.coefficients.map((row) => (
              <tr key={row.day} className={isReadOnly ? 'bg-gray-50' : 'hover:bg-yellow-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.day} {row.day === 1 ? 'Día' : 'Días'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="relative rounded-md shadow-sm w-32">
                    <input
                        type="number"
                        step="0.01"
                        disabled={isReadOnly}
                        value={row.value}
                        onChange={(e) => onUpdateCoefficient(row.day, parseFloat(e.target.value))}
                        className={`
                            block w-full pr-8 border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm
                            ${isReadOnly ? 'bg-transparent border-none' : 'border'}
                        `}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                    {/* Display what the calculation looks like: e.g. "x 0.95" for 5% discount */}
                    x { (1 - (row.value / 100)).toFixed(4) }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoefficientsSheet;