// src/components/ui/Shared.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle,
  Clock,
  School,
  Download
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

export const RevenueChart = ({ data, year = new Date().getFullYear(), title = "Comportamiento de Cobranza", availableYears = [], onYearChange, onClientClick }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({ type: '', month: '', items: [], total: 0 });

  const allValues = data.flatMap(d => [d.collected, d.pending]);
  const rawMax = Math.max(...allValues, 100);
  const rawMin = Math.min(...allValues, 0);

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
  if (minVal < 0) {
    const minHeight = maxVal * 0.05;
    if (Math.abs(minVal) < minHeight) {
      minVal = -getRoundedLimit(minHeight);
    }
  }

  const totalRange = maxVal - minVal;
  const zeroPercentage = ((0 - minVal) / totalRange) * 100;

  const steps = [];
  const stepCount = 5;
  const stepValue = totalRange / (stepCount - 1);
  for (let i = 0; i < stepCount; i++) {
    steps.push(maxVal - (stepValue * i));
  }

  const handleBarClick = (d, type) => {
    const items = type === 'collected' ? (d.collectedItems || []) : (d.pendingItems || []);
    const total = type === 'collected' ? d.collected : d.pending;
    setDrawerData({
      type: type === 'collected' ? 'Cobrado' : 'Pendiente',
      month: `${d.month} ${year}`,
      items,
      total
    });
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title} {year}</h3>
            <p className="text-xs text-gray-500">Comparativo Mensual: Cobrado vs. Pendiente (click en barra para detalles)</p>
          </div>
          <div className="flex items-center space-x-4">
            {availableYears.length > 0 && onYearChange && (
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
          <div className="hidden sm:flex flex-col justify-between h-44 pr-4 pb-2 text-[10px] text-gray-400 font-medium text-right w-14 select-none">
            {steps.map((s, i) => (
              <span key={i}>${Math.abs(s) >= 1000 ? `${(s / 1000).toFixed(1)}k` : s.toFixed(0)}</span>
            ))}
          </div>

          <div className="flex-1 relative h-44 pb-2 border-b border-gray-100">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
              {steps.map((_, i) => (
                <div key={i} className="w-full border-t border-gray-50 h-0"></div>
              ))}
            </div>

            <div
              className="absolute w-full border-t border-gray-400 border-dashed pointer-events-none z-0"
              style={{ bottom: `${zeroPercentage}%`, left: 0 }}
            ></div>

            <div className="flex items-end space-x-2 sm:space-x-4 h-full relative z-10 px-2">
              {data.map((d, i) => {
                const collectedHeight = (Math.abs(d.collected) / totalRange) * 100;
                const pendingHeight = (Math.abs(d.pending) / totalRange) * 100;
                const collectedBottom = d.collected >= 0 ? zeroPercentage : zeroPercentage - collectedHeight;
                const pendingBottom = d.pending >= 0 ? zeroPercentage : zeroPercentage - pendingHeight;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-[40px]">
                    <div className="flex-1 w-full relative h-full">
                      {/* Collected Bar - Clickable */}
                      <div
                        onClick={() => handleBarClick(d, 'collected')}
                        style={{
                          height: `${Math.max(collectedHeight, 0.5)}%`,
                          bottom: `${collectedBottom}%`,
                          left: '5%',
                          width: '40%'
                        }}
                        className={`absolute bg-green-500 hover:bg-green-600 transition-all cursor-pointer ${d.collected >= 0 ? 'rounded-t-sm' : 'rounded-b-sm'} hover:ring-2 hover:ring-green-300`}
                        title={`Click para ver detalles - Cobrado: $${d.collected.toLocaleString()}`}
                      ></div>

                      {/* Pending Bar - Clickable */}
                      <div
                        onClick={() => handleBarClick(d, 'pending')}
                        style={{
                          height: `${Math.max(pendingHeight, 0.5)}%`,
                          bottom: `${pendingBottom}%`,
                          right: '5%',
                          width: '40%'
                        }}
                        className={`absolute bg-orange-400 hover:bg-orange-500 transition-all cursor-pointer ${d.pending >= 0 ? 'rounded-t-sm' : 'rounded-b-sm'} hover:ring-2 hover:ring-orange-300`}
                        title={`Click para ver detalles - Pendiente: $${d.pending.toLocaleString()}`}
                      ></div>
                    </div>

                    <span className="text-[10px] sm:text-xs text-gray-500 mt-2 font-medium absolute -bottom-6 w-full text-center truncate">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform animate-in slide-in-from-right duration-300">
            <div className={`p-4 border-b ${drawerData.type === 'Cobrado' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg font-bold ${drawerData.type === 'Cobrado' ? 'text-green-800' : 'text-orange-800'}`}>
                    {drawerData.type} - {drawerData.month}
                  </h3>
                  <p className={`text-sm ${drawerData.type === 'Cobrado' ? 'text-green-600' : 'text-orange-600'}`}>
                    Total: ${drawerData.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const runExport = () => {
                        const data = drawerData.items.map(item => ({
                          Cliente: item.clientName,
                          Concepto: item.concept,
                          'Fecha de Pago': item.paymentDate || '',
                          'Fecha Vencimiento': item.dueDate || '',
                          Monto: item.paymentAmount || item.paid || item.balance,
                          Status: item.status,
                          Referencia: item.paymentReference || '',
                          'Market Tec Receiver': item.marketTecReceiver || ''
                        }));

                        const ws = XLSX.utils.json_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Detalle");
                        XLSX.writeFile(wb, `Detalle_Cobranza_${drawerData.month.replace(/\s/g, '_')}.xlsx`);
                      };
                      runExport();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-blue-600"
                    title="Exportar a Excel"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              {drawerData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay registros detallados disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drawerData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        if (onClientClick && item.clientId) {
                          setDrawerOpen(false);
                          onClientClick(item.clientId);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.clientName}</p>
                          <p className="text-xs text-gray-500 truncate">{item.concept}</p>
                          {/* Mostrar Fecha de Pago si está disponible (Cobrado), si no Vence (solo para Pendiente) */}
                          {item.paymentDate ? (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Fecha de Pago: {item.paymentDate}
                            </p>
                          ) : (
                            // Ocultar Vence si estamos en modo Cobrado (para evitar confusión si falta fecha de pago)
                            drawerData.type !== 'Cobrado' && item.dueDate && (
                              <p className="text-xs text-gray-400 mt-1">Vence: {item.dueDate}</p>
                            )
                          )}
                          {/* Mostrar Referencia Market Tec */}
                          {item.paymentReference && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Ref: {item.paymentReference}
                            </p>
                          )}
                          {/* Mostrar Receiver de Market Tec */}
                          {item.marketTecReceiver && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              Market Tec: {item.marketTecReceiver}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          {drawerData.type === 'Cobrado' ? (
                            <p className="font-bold text-green-600">${item.paymentAmount?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || item.paid?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</p>
                          ) : (
                            <p className="font-bold text-orange-600">${item.balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</p>
                          )}
                        </div>
                      </div>
                      {onClientClick && item.clientId && (
                        <div className="mt-2 text-xs text-indigo-600 flex items-center">
                          <span>Ver estado de cuenta</span>
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export const AccumulatedChart = ({ data, year = new Date().getFullYear(), onClientClick, user }) => {
  // Use user provided data or empty array
  const chartData = data || [];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({ type: '', month: '', items: [], total: 0 });
  const [loadingDetails, setLoadingDetails] = useState(false);

  const formatMoney = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);

  const formatYAxis = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return value;
  };

  const handleDotClick = async (dataPoint, type) => {
    setDrawerOpen(true);
    setLoadingDetails(true);

    const total = type === 'collected' ? dataPoint.cumulative_collected : dataPoint.cumulative_pending;

    setDrawerData({
      type: type === 'collected' ? 'Cobrado Acumulado' : 'Deuda Acumulada',
      month: `${dataPoint.month_name} ${year}`,
      items: [],
      total
    });

    try {
      // Import the service function dynamically
      const { getCollectionTrendDetails } = await import('../../services/invoiceService');

      const { data: details } = await getCollectionTrendDetails(
        year,
        dataPoint.month_num,
        user?.unitId,
        type
      );

      setDrawerData(prev => ({
        ...prev,
        items: details || []
      }));
    } catch (error) {
      console.error('Error loading trend details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Tendencia Financiera Acumulada {year}
            </h3>
            <p className="text-sm text-gray-500">
              Crecimiento de ingresos vs deuda acumulada año corriente (click en punto para detalles)
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
              Cobrado
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
              Pendiente
            </span>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

              <XAxis
                dataKey="month_name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />

              <YAxis
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                width={60}
              />

              <Tooltip
                formatter={(value) => [formatMoney(value), ""]}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
              />

              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />

              <Line
                type="monotone"
                dataKey="cumulative_collected"
                name="Cobrado Total"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff', cursor: 'pointer' }}
                activeDot={{
                  r: 8,
                  strokeWidth: 0,
                  cursor: 'pointer',
                  onClick: (e, payload) => handleDotClick(payload.payload, 'collected')
                }}
                animationDuration={1500}
              />

              <Line
                type="monotone"
                dataKey="cumulative_pending"
                name="Deuda Acumulada"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff', cursor: 'pointer' }}
                activeDot={{
                  r: 8,
                  strokeWidth: 0,
                  cursor: 'pointer',
                  onClick: (e, payload) => handleDotClick(payload.payload, 'pending')
                }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Slide-in Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform animate-in slide-in-from-right duration-300">
            <div className={`p-4 border-b ${drawerData.type.includes('Cobrado') ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg font-bold ${drawerData.type.includes('Cobrado') ? 'text-green-800' : 'text-orange-800'}`}>
                    {drawerData.type} - {drawerData.month}
                  </h3>
                  <p className={`text-sm ${drawerData.type.includes('Cobrado') ? 'text-green-600' : 'text-orange-600'}`}>
                    Total: {formatMoney(drawerData.total)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const runExport = () => {
                        const exportData = drawerData.items.map(item => ({
                          Cliente: item.clientName,
                          Concepto: item.concept,
                          'Fecha de Pago': item.paymentDate || '',
                          'Fecha Vencimiento': item.dueDate || '',
                          Monto: item.paymentAmount || item.paid || item.balance,
                          Status: item.status,
                          Referencia: item.paymentReference || '',
                          'Market Tec Receiver': item.marketTecReceiver || ''
                        }));

                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Detalle");
                        XLSX.writeFile(wb, `Tendencia_${drawerData.month.replace(/\s/g, '_')}.xlsx`);
                      };
                      runExport();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-blue-600"
                    title="Exportar a Excel"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-500 mt-3 font-medium">Cargando detalles...</p>
                </div>
              ) : drawerData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay registros detallados disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drawerData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        if (onClientClick && item.clientId) {
                          setDrawerOpen(false);
                          onClientClick(item.clientId);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.clientName}</p>
                          <p className="text-xs text-gray-500 truncate">{item.concept}</p>
                          {item.paymentDate ? (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Fecha de Pago: {item.paymentDate}
                            </p>
                          ) : (
                            drawerData.type !== 'Cobrado Acumulado' && item.dueDate && (
                              <p className="text-xs text-gray-400 mt-1">Vence: {item.dueDate}</p>
                            )
                          )}
                          {item.paymentReference && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Ref: {item.paymentReference}
                            </p>
                          )}
                          {item.marketTecReceiver && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              Market Tec: {item.marketTecReceiver}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          {drawerData.type.includes('Cobrado') ? (
                            <p className="font-bold text-green-600">{formatMoney(item.paymentAmount || item.paid || 0)}</p>
                          ) : (
                            <p className="font-bold text-orange-600">{formatMoney(item.balance || 0)}</p>
                          )}
                        </div>
                      </div>
                      {onClientClick && item.clientId && (
                        <div className="mt-2 text-xs text-indigo-600 flex items-center">
                          <span>Ver estado de cuenta</span>
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};