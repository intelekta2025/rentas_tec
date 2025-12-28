// src/components/ui/Shared.jsx
import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  School
} from 'lucide-react';
import { LOGO_URL } from '../../data/constants';

export const StatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-green-100 text-green-800",
    Activo: "bg-green-100 text-green-800",
    Paid: "bg-green-100 text-green-800",
    Pagado: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Pendiente: "bg-yellow-100 text-yellow-800",
    Partial: "bg-blue-100 text-blue-800",
    parcial: "bg-blue-100 text-blue-800",
    Overdue: "bg-red-100 text-red-800",
    Vencido: "bg-red-100 text-red-800",
    Scheduled: "bg-gray-100 text-gray-500 border border-gray-200",
    Inactive: "bg-gray-100 text-gray-600",
    Inactivo: "bg-gray-100 text-gray-600",
    Baja: "bg-gray-100 text-gray-600"
  };

  const labels = {
    Active: "Activo",
    Paid: "Pagado",
    Partial: "Parcial",
    parcial: "Parcial",
    Pending: "Pendiente",
    Overdue: "Vencido",
    Scheduled: "Programado",
    Inactive: "Baja"
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status === 'Overdue' && <AlertTriangle size={12} className="mr-1 mt-0.5" />}
      {labels[status] || status}
    </span>
  );
};

export const OverdueBadge = ({ days }) => {
  let colorClass = "bg-yellow-100 text-yellow-800";
  let label = "Reciente";

  if (days > 30) {
    colorClass = "bg-orange-100 text-orange-800";
    label = "> 30 Días";
  }
  if (days > 60) {
    colorClass = "bg-red-100 text-red-800";
    label = "> 60 Días";
  }

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
      <Clock size={12} className="mr-1 mt-0.5" />
      {days} días ({label})
    </span>
  );
};

export const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors duration-200 ${active
      ? "bg-blue-900 text-white border-r-4 border-white"
      : "text-blue-100 hover:bg-blue-800 hover:text-white"
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const KPICard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
    style={{ borderColor: color }}
  >
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6" style={{ color: color }} />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd>
            <div className="text-lg font-bold" style={{ color: color }}>{value}</div>
          </dd>
        </dl>
      </div>
    </div>
    {subtext && <div className="mt-2 text-xs text-gray-400">{subtext}</div>}
  </div>
);

export const AppLogo = ({ className, whiteBg = false }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-blue-100 text-blue-900 font-bold ${className} ${whiteBg ? 'rounded-full' : 'rounded-lg'}`}>
        <School size={20} />
      </div>
    );
  }

  return (
    <img
      src={LOGO_URL}
      alt="Logo Tec"
      className={`${className} ${whiteBg ? 'bg-white p-1 rounded-full' : 'object-contain'}`}
      onError={() => setError(true)}
    />
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizeClass = size === "lg" ? "max-w-3xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none px-4">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className={`relative w-full ${sizeClass} mx-auto my-6 bg-white rounded-lg shadow-lg`}>
        <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
          <h3 className="text-xl font-semibold text-blue-900">{title}</h3>
          <button onClick={onClose} className="p-1 ml-auto bg-transparent border-0 text-gray-500 hover:text-red-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none">
            <span className="text-2xl block outline-none focus:outline-none">×</span>
          </button>
        </div>
        <div className="relative p-6 flex-auto max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const RevenueChart = ({ data, year = new Date().getFullYear(), title = "Comportamiento de Cobranza", availableYears = [], onYearChange }) => {
  const allValues = data.flatMap(d => [d.collected, d.pending]);
  const rawMax = Math.max(...allValues, 100);
  const rawMin = Math.min(...allValues, 0);

  // Función para obtener límites "redondos"
  const getRoundedLimit = (val) => {
    const absVal = Math.abs(val);
    if (absVal === 0) return 0;
    let limit;
    if (absVal <= 100) limit = 100;
    else if (absVal <= 1000) limit = Math.ceil(absVal / 100) * 100;
    else if (absVal <= 10000) limit = Math.ceil(absVal / 1000) * 1000;
    else limit = Math.ceil(absVal / 5000) * 5000;
    return val < 0 ? -limit : limit;
  };

  const maxVal = getRoundedLimit(rawMax);
  let minVal = getRoundedLimit(rawMin);
  // Asegurar que si hay valores negativos, el eje 0 no esté pegado al fondo absoluto
  // Forzamos que el rango cubra al menos un 10% de espacio negativo si hay negativos pequeñitos
  if (minVal < 0) {
    const minHeight = maxVal * 0.05; // 5% del positivo
    if (Math.abs(minVal) < minHeight) {
      minVal = -getRoundedLimit(minHeight);
    }
  }

  const totalRange = maxVal - minVal;
  const zeroPercentage = ((0 - minVal) / totalRange) * 100;

  // Generar pasos (5 líneas aprox)
  const steps = [];
  const stepCount = 5;
  const stepValue = totalRange / (stepCount - 1); // 4 intervalos
  for (let i = 0; i < stepCount; i++) {
    steps.push(maxVal - (stepValue * i));
  }
  // Asegurarnos de que el 0 esté perfectamente alineado si está cerca
  // O simplemente renderizar el eje 0 explícitamente

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title} {year}</h3>
          <p className="text-xs text-gray-500">Comparativo Mensual: Cobrado vs. Pendiente</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Year Selector */}
          {availableYears.length > 1 && onYearChange && (
            <div className="relative">
              <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 pr-8 font-medium"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
            <span className="text-xs text-gray-600">Cobrado</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded-sm mr-2"></div>
            <span className="text-xs text-gray-600">Pendiente</span>
          </div>
        </div>
      </div>

      <div className="relative h-48 flex">
        {/* Y-Axis Labels */}
        <div className="hidden sm:flex flex-col justify-between h-44 pr-4 pb-2 text-[10px] text-gray-400 font-medium text-right w-14 select-none">
          {steps.map((s, i) => (
            <span key={i}>${Math.abs(s) >= 1000 ? `${(s / 1000).toFixed(1)}k` : s.toFixed(0)}</span>
          ))}
        </div>

        {/* Chart Container */}
        <div className="flex-1 relative h-44 pb-2 border-b border-gray-100">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
            {steps.map((_, i) => (
              <div key={i} className="w-full border-t border-gray-50 h-0"></div>
            ))}
          </div>

          {/* Zero Line - Highlighted */}
          <div
            className="absolute w-full border-t border-gray-400 border-dashed pointer-events-none z-0"
            style={{ bottom: `${zeroPercentage}%`, left: 0 }}
          ></div>

          <div className="flex items-end space-x-2 sm:space-x-4 h-full relative z-10 px-2 pointer-events-none">
            {data.map((d, i) => {
              const collectedHeight = (Math.abs(d.collected) / totalRange) * 100;
              const pendingHeight = (Math.abs(d.pending) / totalRange) * 100;

              // Calcular posición 'bottom' basándose en si es positivo o negativo
              // Si es positivo, bottom = zeroPercentage
              // Si es negativo, top = (100 - zeroPercentage) -> bottom = zeroPercentage - height

              const collectedBottom = d.collected >= 0 ? zeroPercentage : zeroPercentage - collectedHeight;
              const pendingBottom = d.pending >= 0 ? zeroPercentage : zeroPercentage - pendingHeight;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[40px] pointer-events-auto">

                  {/* Container for bars rendering relative to full height */}
                  <div className="flex-1 w-full relative h-full">
                    {/* Collected Bar */}
                    <div
                      style={{
                        height: `${Math.max(collectedHeight, 0.5)}%`, // min 0.5% visual
                        bottom: `${collectedBottom}%`,
                        left: '5%',
                        width: '40%'
                      }}
                      className={`absolute bg-green-500 hover:bg-green-600 transition-all cursor-pointer ${d.collected >= 0 ? 'rounded-t-sm' : 'rounded-b-sm'}`}
                      title={`Cobrado: $${d.collected.toLocaleString()}`}
                    ></div>

                    {/* Pending Bar */}
                    <div
                      style={{
                        height: `${Math.max(pendingHeight, 0.5)}%`,
                        bottom: `${pendingBottom}%`,
                        right: '5%',
                        width: '40%'
                      }}
                      className={`absolute bg-orange-400 hover:bg-orange-500 transition-all cursor-pointer ${d.pending >= 0 ? 'rounded-t-sm' : 'rounded-b-sm'}`}
                      title={`Pendiente: $${d.pending.toLocaleString()}`}
                    ></div>
                  </div>

                  <span className="text-[10px] sm:text-xs text-gray-500 mt-2 font-medium absolute -bottom-6 w-full text-center truncate">{d.month}</span>

                  {/* Tooltip */}
                  <div className="absolute bottom-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] rounded p-2 z-20 w-32 text-center pointer-events-none shadow-lg left-1/2 transform -translate-x-1/2 hidden sm:block">
                    <div className="font-bold border-b border-gray-600 pb-1 mb-1">{d.month} {year}</div>
                    <div className="flex justify-between"><span className="text-green-300">Cobrado:</span><span>${d.collected.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-orange-300">Pendiente:</span><span>${d.pending.toLocaleString()}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};