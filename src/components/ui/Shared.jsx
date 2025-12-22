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

export const RevenueChart = ({ data, year = new Date().getFullYear(), title = "Comportamiento de Cobranza" }) => {
  const rawMax = Math.max(...data.map(d => Math.max(d.collected, d.pending, 0)), 100);

  // Calcular un máximo "redondo" para la escala
  let maxVal;
  if (rawMax <= 100) maxVal = 100;
  else if (rawMax <= 1000) maxVal = Math.ceil(rawMax / 100) * 100;
  else if (rawMax <= 10000) maxVal = Math.ceil(rawMax / 1000) * 1000;
  else maxVal = Math.ceil(rawMax / 5000) * 5000;

  const steps = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title} {year}</h3>
          <p className="text-xs text-gray-500">Comparativo Mensual: Cobrado vs. Pendiente</p>
        </div>
        <div className="flex space-x-4">
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

      <div className="relative h-72 flex">
        {/* Y-Axis Labels */}
        <div className="hidden sm:flex flex-col justify-between h-64 pr-4 pb-2 text-[10px] text-gray-400 font-medium text-right w-16 select-none">
          {steps.map((s, i) => (
            <span key={i}>${s >= 1000 ? `${(s / 1000).toFixed(1)}k` : s}</span>
          ))}
        </div>

        {/* Chart Container */}
        <div className="flex-1 relative h-64 pb-2 border-b border-gray-100 overflow-x-auto">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-full border-t border-gray-50 h-0"></div>
            ))}
          </div>

          <div className="flex items-end space-x-2 sm:space-x-4 h-full relative z-10 px-2">
            {data.map((d, i) => {
              const collectedHeight = (d.collected / maxVal) * 100;
              const pendingHeight = (d.pending / maxVal) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[40px]">
                  <div className="flex-1 w-full flex items-end justify-center space-x-1 px-1">
                    <div
                      style={{ height: `${collectedHeight}%` }}
                      className={`w-full bg-green-500 rounded-t-sm hover:bg-green-600 transition-all cursor-pointer relative ${d.collected > 0 ? 'min-h-[2px]' : 'h-0'}`}
                      title={`Cobrado: $${d.collected.toLocaleString()}`}
                    ></div>
                    <div
                      style={{ height: `${pendingHeight}%` }}
                      className={`w-full bg-orange-400 rounded-t-sm hover:bg-orange-500 transition-all cursor-pointer relative ${d.pending > 0 ? 'min-h-[2px]' : 'h-0'}`}
                      title={`Pendiente: $${d.pending.toLocaleString()}`}
                    ></div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 mt-2 font-medium">{d.month}</span>

                  {/* Tooltip */}
                  <div className="absolute bottom-16 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] rounded p-2 z-20 w-32 text-center pointer-events-none shadow-lg left-1/2 transform -translate-x-1/2 hidden sm:block">
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