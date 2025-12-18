// src/data/constants.js

export const UNITS = {
  1: "Campus Norte",
  2: "Campus Sur",
  3: "Parque Tecnológico",
  4: "Hub Innovación"
};

export const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Logotipo_del_Tec_de_Monterrey.svg";

export const mockClients = [
  { id: 1, unitId: 1, name: "Innovación Digital S.A.", contact: "Juan Pérez", email: "cliente@innovacion.com", status: "Active", rfc: "IDI190202H52", address: "Av. Tecnológico 123, Local 204" },
  { id: 2, unitId: 2, name: "EcoSolutions", contact: "Maria Gomez", email: "maria@eco.com", status: "Pending", rfc: "ECO200101J88", address: "Calle Sur 45, Oficina 12" },
  { id: 3, unitId: 1, name: "Tech Ventures", contact: "Carlos Ruiz", email: "carlos@tech.com", status: "Active", rfc: "TVE210505K99", address: "Blvd. Innovación 88, Piso 3" },
  { id: 4, unitId: 3, name: "Alpha Dynamics", contact: "Luis Torres", email: "luis@alpha.com", status: "Active", rfc: "ALD220101K00", address: "Parque Tec Bloque B" },
  { id: 5, unitId: 4, name: "BioGen Lab", contact: "Ana Solares", email: "ana@biogen.com", status: "Overdue", rfc: "BGL180909L11", address: "Laboratorio Central 1" },
];

export const mockStaff = [
  { id: 1, name: "Admin Norte", email: "admin.norte@tec.mx", role: "Gerente de Unidad", unitId: 1, status: "Active" },
  { id: 2, name: "Admin Sur", email: "admin.sur@tec.mx", role: "Gerente de Unidad", unitId: 2, status: "Active" },
  { id: 3, name: "Contabilidad General", email: "conta@tec.mx", role: "Auditor", unitId: null, status: "Active" }, 
  { id: 4, name: "Roberto Asistente", email: "roberto@tec.mx", role: "Asistente", unitId: 1, status: "Inactive" },
];

export const mockCXC = [
  { id: 101, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$15,000.00", concept: "Renta Oficina 204 (Nov)", dueDate: "2023-11-05", status: "Overdue", daysOverdue: 12 },
  { id: 102, unitId: 2, clientId: 2, client: "EcoSolutions", amount: "$4,500.00", concept: "Servicios Impresión", dueDate: "2023-11-20", status: "Paid", daysOverdue: 0 },
  { id: 103, unitId: 1, clientId: 3, client: "Tech Ventures", amount: "$12,000.00", concept: "Renta Oficina 101", dueDate: "2023-11-25", status: "Pending", daysOverdue: 0 },
  { id: 104, unitId: 3, clientId: 4, client: "Alpha Dynamics", amount: "$8,200.00", concept: "Membresía Coworking", dueDate: "2023-10-15", status: "Overdue", daysOverdue: 33 },
  { id: 105, unitId: 4, clientId: 5, client: "BioGen Lab", amount: "$22,000.00", concept: "Renta Auditorio", dueDate: "2023-09-01", status: "Overdue", daysOverdue: 78 },
  { id: 106, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$1,200.00", concept: "Servicio Luz (Oct)", dueDate: "2023-10-05", status: "Paid", daysOverdue: 0 },
  { id: 107, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$15,000.00", concept: "Renta Oficina 204 (Oct)", dueDate: "2023-10-05", status: "Paid", daysOverdue: 0 },
  { id: 108, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$15,000.00", concept: "Renta Oficina 204 (Dic)", dueDate: "2023-12-05", status: "Pending", daysOverdue: 0 },
  { id: 109, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$0.00", concept: "Servicio Luz (Dic)", dueDate: "2023-12-05", status: "Scheduled", daysOverdue: 0 },
  { id: 110, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$15,000.00", concept: "Renta Oficina 204 (Ene)", dueDate: "2024-01-05", status: "Scheduled", daysOverdue: 0 },
  { id: 111, unitId: 1, clientId: 1, client: "Innovación Digital S.A.", amount: "$0.00", concept: "Servicio Luz (Ene)", dueDate: "2024-01-05", status: "Scheduled", daysOverdue: 0 },
];

export const mockUpcoming = [
  { id: 201, unitId: 1, clientId: 3, client: "Tech Ventures", concepts: ["Renta Of. 301", "Luz (450 kWh)"], amount: "$18,450.00", dueDate: "2023-12-25", daysUntil: 5, sent: false },
  { id: 202, unitId: 3, clientId: 4, client: "Alpha Dynamics", concepts: ["Membresía Coworking"], amount: "$3,200.00", dueDate: "2023-12-28", daysUntil: 8, sent: true },
  { id: 203, unitId: 1, clientId: 1, client: "Innovación Digital", concepts: ["Renta Of. 205", "Luz", "Sala Juntas"], amount: "$14,100.00", dueDate: "2023-12-30", daysUntil: 10, sent: false },
  { id: 204, unitId: 4, clientId: 5, client: "BioGen Lab", concepts: ["Renta Of. 101"], amount: "$9,000.00", dueDate: "2024-01-02", daysUntil: 13, sent: false },
];

export const mockPayments = [
  { id: 301, clientId: 1, date: "2023-10-05", concept: "Renta Oficina 204 (Oct)", amount: "$15,000.00", method: "Transferencia SPEI", reference: "REF-998877", invoiceStatus: "Facturado" },
  { id: 302, clientId: 1, date: "2023-10-05", concept: "Servicio Luz (Oct)", amount: "$1,200.00", method: "Transferencia SPEI", reference: "REF-998877", invoiceStatus: "Facturado" },
  { id: 303, clientId: 1, date: "2023-09-05", concept: "Renta Oficina 204 (Sep)", amount: "$15,000.00", method: "Cheque", reference: "CHQ-00123", invoiceStatus: "Pendiente XML" },
  { id: 304, clientId: 1, date: "2023-08-05", concept: "Renta Oficina 204 (Ago)", amount: "$15,000.00", method: "Transferencia SPEI", reference: "REF-776655", invoiceStatus: "Facturado" },
];

export const mockMonthlyStats = [
  { month: 'Ene', collected: 320000, pending: 10000 },
  { month: 'Feb', collected: 310000, pending: 15000 },
  { month: 'Mar', collected: 340000, pending: 5000 },
  { month: 'Abr', collected: 325000, pending: 20000 },
  { month: 'May', collected: 350000, pending: 0 },
  { month: 'Jun', collected: 330000, pending: 12000 },
  { month: 'Jul', collected: 315000, pending: 18000 },
  { month: 'Ago', collected: 340000, pending: 8000 },
  { month: 'Sep', collected: 300000, pending: 45000 },
  { month: 'Oct', collected: 290000, pending: 55000 },
  { month: 'Nov', collected: 150000, pending: 125000 },
  { month: 'Dic', collected: 0, pending: 340000 },
];