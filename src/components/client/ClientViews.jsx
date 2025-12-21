// src/components/client/ClientViews.jsx
import React, { useState } from 'react';
import { DollarSign, FileText, Calendar, Download, Filter, CheckCircle, Eye } from 'lucide-react';
import { StatusBadge } from '../ui/Shared';
import { mockCXC, mockPayments } from '../../data/constants';

export const ClientPortalDashboard = ({ user, clientStats, myCXC }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-6">
      <h2 className="text-2xl font-bold">¡Hola, {user.name}!</h2>
      <p className="opacity-80">Bienvenido a tu portal de {user.clientName}. Aquí puedes consultar tu estado de cuenta en tiempo real.</p>
    </div>

    {/* Client KPIs */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-blue-500">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Saldo Pendiente</dt>
              <dd className="text-2xl font-bold text-gray-900">${clientStats.balance.toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-yellow-500">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
            <FileText className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Facturas por Pagar</dt>
              <dd className="text-2xl font-bold text-gray-900">{clientStats.pendingInvoices}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg p-5 border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Próximo Vencimiento</dt>
              <dd className="text-lg font-bold text-gray-900">{clientStats.nextPayment}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Movements Table */}
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Movimientos Recientes</h3>
        <button className="text-sm text-blue-600 font-medium hover:underline flex items-center">
          <Download size={16} className="mr-1" /> Descargar PDF
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Límite</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {myCXC.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.concept}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dueDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{item.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
            {myCXC.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay movimientos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const ClientPortalPayments = ({ user }) => {
  const [selectedYear, setSelectedYear] = useState('2023');

  const myPayments = mockPayments.filter(p => p.clientId === user.clientId);
  const totalPaid = myPayments.reduce((acc, curr) => acc + parseFloat(String(curr.amount || 0).replace(/[^0-9.-]+/g, "") || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Historial de Pagos</h2>
          <p className="text-sm text-gray-500">Consulta y descarga tus comprobantes fiscales.</p>
        </div>
        <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center mt-4 md:mt-0">
          <CheckCircle className="text-green-600 h-5 w-5 mr-2" />
          <div>
            <span className="text-xs text-green-800 font-semibold block uppercase">Total Pagado {selectedYear}</span>
            <span className="text-lg font-bold text-green-900">${totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-sm border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 p-1 bg-white"
            >
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <button className="text-sm text-blue-600 font-medium hover:underline flex items-center">
            <Download size={16} className="mr-1" /> Exportar Reporte
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto / Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobantes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {payment.date}
                  </td>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="text-sm text-gray-900 font-medium">{payment.concept}</div>
                    <div className="text-xs text-gray-500">Ref: {payment.reference}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                    {payment.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      {payment.invoiceStatus === 'Facturado' ? (
                        <>
                          <button className="text-gray-500 hover:text-blue-600 flex items-center text-xs border border-gray-200 rounded px-2 py-1 bg-white" title="Descargar PDF">
                            <FileText size={14} className="mr-1 text-red-500" /> PDF
                          </button>
                          <button className="text-gray-500 hover:text-blue-600 flex items-center text-xs border border-gray-200 rounded px-2 py-1 bg-white" title="Descargar XML">
                            <FileText size={14} className="mr-1 text-blue-500" /> XML
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {payment.invoiceStatus}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {myPayments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    No hay pagos registrados en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};