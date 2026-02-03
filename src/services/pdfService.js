// src/services/pdfService.js
// Servicio para generar PDFs de estado de cuenta

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF de Estado de Cuenta para un cliente
 * @param {Object} client - Datos del cliente
 * @param {Array} receivables - Lista de movimientos/cuentas por cobrar
 * @param {Object} contractInfo - Información del contrato (opcional)
 * @returns {jsPDF} - Documento PDF generado
 */
/**
 * Genera un PDF de Estado de Cuenta para un cliente
 * @param {Object} client - Datos del cliente
 * @param {Array} receivables - Lista de movimientos/cuentas por cobrar
 * @param {Object} contractInfo - Información del contrato (opcional)
 * @param {string} logoBase64 - Logo en base64 (opcional)
 * @returns {jsPDF} - Documento PDF generado
 */
export const generateEstadoCuentaPDF = (client, receivables, contractInfo = {}, logoBase64 = null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colores corporativos
    const primaryColor = [30, 58, 138]; // blue-900
    const secondaryColor = [59, 130, 246]; // blue-500
    const successColor = [22, 163, 74]; // green-600
    const dangerColor = [220, 38, 38]; // red-600
    const grayColor = [107, 114, 128]; // gray-500

    // ============ HEADER ============
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Logo (Alineado a la derecha)
    if (logoBase64) {
        try {
            // Asumimos un aspect ratio rectangular para el logo
            // Logo ancho 100, margen derecho 14. X = pageWidth - 14 - 100
            const logoX = pageWidth - 14 - 100;
            doc.addImage(logoBase64, 'PNG', logoX, 8, 100, 20);
        } catch (e) {
            console.error('Error al agregar el logo al PDF:', e);
        }
    }

    // Título (Alineado a la izquierda)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', 14, 15, { align: 'left' });

    doc.setFontSize(12);
    doc.text('RENTAS Y SERVICIOS', 14, 22, { align: 'left' });

    // Business Unit Name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    // Usamos el nombre de la unidad de negocio del cliente si está disponible, o un valor por defecto
    const unitName = client.unit_name || client.business_unit || 'Parque Tecnológico Culiacán';
    const businessUnitName = `PEI ${unitName}`;
    doc.text(businessUnitName, 14, 29, { align: 'left' });

    // ============ INFO CLIENTE Y CONTRATO (TABLA) ============
    let yPos = 45;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name || client.business_name || 'Cliente', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Información de Contacto (Centrada)
    const contactParts = [];
    if (client.contact || client.contact_name) contactParts.push(`Contacto: ${client.contact || client.contact_name}`);
    if (client.email) contactParts.push(client.email);
    if (client.contactPhone || client.contact_phone) contactParts.push(client.contactPhone || client.contact_phone);

    if (contactParts.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);

        const contactText = contactParts.join(', ');
        const maxWidth = pageWidth - 28; // Margen de 14 a cada lado
        const splitText = doc.splitTextToSize(contactText, maxWidth);

        doc.text(splitText, pageWidth / 2, yPos, { align: 'center' });
        yPos += (splitText.length * 5) + 2; // Ajustar espacio según número de líneas
    }

    // Centrar información del contrato debajo del cliente
    if (contractInfo && (contractInfo.start_date || contractInfo.end_date)) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);

        let contractDates = '';
        if (contractInfo.start_date) {
            try {
                // Parse "YYYY-MM-DD" manually to avoid timezone issues
                const [y, m, d] = contractInfo.start_date.split('T')[0].split('-');
                const startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                const startFormatted = startDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                contractDates += `Inicio: ${startFormatted}`;
            } catch (e) {
                contractDates += `Inicio: ${contractInfo.start_date}`;
            }
        }
        if (contractInfo.end_date) {
            try {
                // Parse "YYYY-MM-DD" manually to avoid timezone issues
                const [y, m, d] = contractInfo.end_date.split('T')[0].split('-');
                const endDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                const endFormatted = endDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                contractDates += contractDates ? ` | Fin: ${endFormatted}` : `Fin: ${endFormatted}`;
            } catch (e) {
                contractDates += contractDates ? ` | Fin: ${contractInfo.end_date}` : `Fin: ${contractInfo.end_date}`;
            }
        }

        if (contractDates) {
            doc.text(`Contrato: ${contractDates}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6; // Espacio reducido
        }
    }

    // Centrar CXC Rentas y Servicios en una sola línea
    if (contractInfo && Object.keys(contractInfo).length > 0) {
        let cxcTextParts = [];

        // CXC Rentas
        if (contractInfo.monthly_rent_amount != null) {
            const amount = typeof contractInfo.monthly_rent_amount === 'string'
                ? parseFloat(contractInfo.monthly_rent_amount.replace(/[^0-9.-]+/g, ''))
                : parseFloat(contractInfo.monthly_rent_amount);
            if (!isNaN(amount)) {
                const count = contractInfo.cxc_renta != null ? contractInfo.cxc_renta : 0;
                cxcTextParts.push(`CXC Rentas: $${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${count})`);
            }
        }

        // CXC Servicios
        if (contractInfo.monthly_services_amount != null) {
            const amount = typeof contractInfo.monthly_services_amount === 'string'
                ? parseFloat(contractInfo.monthly_services_amount.replace(/[^0-9.-]+/g, ''))
                : parseFloat(contractInfo.monthly_services_amount);
            if (!isNaN(amount)) {
                const count = contractInfo.cxc_servicios != null ? contractInfo.cxc_servicios : 0;
                cxcTextParts.push(`CXC Servicios: $${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${count})`);
            }
        }

        if (cxcTextParts.length > 0) {
            doc.setFontSize(10); // Mismo tamaño que contrato
            doc.setTextColor(...grayColor);
            doc.text(cxcTextParts.join('   |   '), pageWidth / 2, yPos, { align: 'center' });
            yPos += 5; // Espacio reducido (antes 15)
        } else {
            yPos += 5;
        }
    } else {
        yPos += 5;
    }

    // ============ TARJETAS DE RESUMEN ============
    // Usamos los totales calculados pasados en contractInfo, o calculamos defaults (aunque idealmente siempre vienen)
    const totalMonto = contractInfo.total_contract || 0;
    const totalPagado = contractInfo.total_paid || 0;
    const saldoPendiente = contractInfo.contract_balance || 0;
    const deudaVencida = contractInfo.overdue_debt || 0;

    const cardsY = yPos + 5; // Espacio reducido (antes 10)
    const cardWidth = (pageWidth - 28 - (3 * 5)) / 4; // 4 tarjetas con espacio de 5 entre ellas
    const cardHeight = 25;

    // 1. Total del Contrato
    doc.setFillColor(248, 248, 248); // Gray 50
    doc.setDrawColor(209, 213, 219); // Gray 300
    doc.rect(14, cardsY, cardWidth, cardHeight, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DEL CONTRATO', 14 + (cardWidth / 2), cardsY + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Black for value
    doc.text(`$${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14 + (cardWidth / 2), cardsY + 18, { align: 'center' });

    // 2. Total Pagado
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(34, 197, 94); // Green 500 border like in UI (border-l-4 style simulated with full border or just color text)
    // To mimic the UI border-left simply, we can just use colored text or a line. Let's stick to the previous style but updated.
    doc.rect(14 + cardWidth + 5, cardsY, cardWidth, cardHeight, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text('TOTAL DE PAGOS', 14 + cardWidth + 5 + (cardWidth / 2), cardsY + 8, { align: 'center' });
    doc.text('DEL CONTRATO', 14 + cardWidth + 5 + (cardWidth / 2), cardsY + 12, { align: 'center' }); // Split text if too long
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74); // Green 600
    doc.text(`$${totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14 + cardWidth + 5 + (cardWidth / 2), cardsY + 20, { align: 'center' });

    // 3. Saldo del Contrato
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(59, 130, 246); // Blue 500
    doc.rect(14 + (2 * (cardWidth + 5)), cardsY, cardWidth, cardHeight, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text('SALDO DEL CONTRATO', 14 + (2 * (cardWidth + 5)) + (cardWidth / 2), cardsY + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Black/Gray
    doc.text(`$${saldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14 + (2 * (cardWidth + 5)) + (cardWidth / 2), cardsY + 18, { align: 'center' });

    // 4. Deuda Vencida
    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(239, 68, 68); // Red 500
    doc.rect(14 + (3 * (cardWidth + 5)), cardsY, cardWidth, cardHeight, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text('DEUDA VENCIDA', 14 + (3 * (cardWidth + 5)) + (cardWidth / 2), cardsY + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38); // Red 600
    doc.text(`$${deudaVencida.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14 + (3 * (cardWidth + 5)) + (cardWidth / 2), cardsY + 18, { align: 'center' });

    yPos = cardsY + 35; // Update Y position for next section

    // ============ FUNCIÓN PARA CREAR TABLA ============
    const createTable = (title, items, titleColor) => {
        const parseAmount = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;
        };

        // Ordenar por fecha de vencimiento ascendente
        const sortedItems = [...items].sort((a, b) => {
            const dateA = a.dueDate || a.due_date || '';
            const dateB = b.dueDate || b.due_date || '';
            return new Date(dateA) - new Date(dateB);
        });

        // Preparar datos para la tabla
        const tableData = sortedItems.map(r => {
            const concepto = r.concept || '-';
            const refMT = r.paymentReferences || r.market_tec_referencia || '-';

            const monto = parseAmount(r.amount);
            const pagado = parseAmount(r.amount_paid);
            const saldo = parseAmount(r.balanceDueRaw || r.balance_due);

            // Calcular Días Vencidos
            let diasVencidos = '-';
            let daysDiff = 0;

            if (r.status !== 'Paid' && r.status !== 'Pagado' && saldo > 0) {
                if (r.dueDate || r.due_date) {
                    const dueDate = new Date(r.dueDate || r.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Solo calcular si ya venció
                    if (dueDate < today) {
                        const diffTime = Math.abs(today - dueDate);
                        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        diasVencidos = daysDiff.toString();
                    } else {
                        diasVencidos = '0';
                    }
                }
            }

            // Formatear fechas de pago
            let fechaPago = '-';
            if (r.paymentDates) {
                try {
                    fechaPago = r.paymentDates.split(', ').map(d => {
                        const [y, m, day] = d.split('-');
                        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                        return `${day} ${months[parseInt(m) - 1]}`;
                    }).join(', ');
                } catch (_) { fechaPago = r.paymentDates; }
            }

            let estado = 'Pendiente';
            if (r.status === 'Paid' || r.status === 'Pagado') {
                estado = 'Pagado';
            } else if (r.status === 'Overdue' || r.status === 'Vencido') {
                estado = 'Vencido';
            } else {
                if (diasVencidos !== '-' && parseInt(diasVencidos) > 0) {
                    estado = 'Vencido';
                }
            }

            return [
                concepto,
                diasVencidos,
                refMT,
                fechaPago,
                `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                `$${pagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                `$${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                estado
            ];
        });

        if (tableData.length === 0) return;

        // Título de sección
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...titleColor);
        doc.text(title, pageWidth / 2, yPos, { align: 'center' });
        yPos += 2;

        autoTable(doc, {
            startY: yPos,
            head: [['Concepto', 'Atraso', 'Ref MT', 'Fecha Pago', 'Monto', 'Pagado', 'Saldo', 'Estado']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: titleColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 35 }, // Concepto
                1: { cellWidth: 14, halign: 'center' }, // Atraso (antes Días Vencidos, reducido de 20)
                2: { cellWidth: 26 }, // Ref MT (Reducido de 30)
                3: { cellWidth: 17 }, // Fecha Pago (Reducido de 18)
                4: { cellWidth: 23, halign: 'right' }, // Monto (Aumentado de 19)
                5: { cellWidth: 22, halign: 'right' }, // Pagado (Aumentado de 19)
                6: { cellWidth: 23, halign: 'right' }, // Saldo (Aumentado de 19)
                7: { cellWidth: 22, halign: 'center' } // Estado
            },
            didParseCell: function (data) {
                // Colorear Días Vencidos
                if (data.section === 'body' && data.column.index === 1) {
                    const val = parseInt(data.cell.raw);
                    if (!isNaN(val) && val > 0) {
                        data.cell.styles.fontStyle = 'bold';
                        if (val <= 30) {
                            data.cell.styles.textColor = [234, 179, 8]; // Ambar/Naranja suave
                        } else if (val <= 60) {
                            data.cell.styles.textColor = [249, 115, 22]; // Naranja fuerte
                        } else {
                            data.cell.styles.textColor = [220, 38, 38]; // Rojo
                        }
                    } else {
                        data.cell.styles.textColor = successColor;
                    }
                }

                // Colorear estado
                if (data.section === 'body' && data.column.index === 7) {
                    if (data.cell.raw === 'Pagado') {
                        data.cell.styles.textColor = successColor;
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'Vencido') {
                        data.cell.styles.textColor = dangerColor;
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [234, 179, 8];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
                // Colorear saldo
                if (data.section === 'body' && data.column.index === 6) {
                    const saldoValue = parseFloat(String(data.cell.raw).replace(/[^0-9.-]+/g, "")) || 0;
                    if (saldoValue > 0) {
                        data.cell.styles.textColor = dangerColor;
                    } else {
                        data.cell.styles.textColor = successColor;
                    }
                }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    };

    // Separar receivables por tipo
    const rentas = receivables.filter(r => r.type === 'Renta' || r.type === 'Rent');
    const servicios = receivables.filter(r => r.type === 'Service' || r.type === 'Services' || r.type === 'Luz');
    const otros = receivables.filter(r => r.type === 'Other' || r.type === 'Otro');

    // Crear tabla de Rentas
    if (rentas.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Detalle de Movimientos', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        createTable('Rentas', rentas, primaryColor);
    }

    // Crear tabla de Servicios
    if (servicios.length > 0) {
        if (rentas.length === 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Detalle de Movimientos', pageWidth / 2, yPos, { align: 'center' });
            yPos += 8;
        }
        createTable('Servicios', servicios, [234, 179, 8]); // amber-500
    }

    // Crear tabla de Otros
    if (otros.length > 0) {
        if (rentas.length === 0 && servicios.length === 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Detalle de Movimientos', pageWidth / 2, yPos, { align: 'center' });
            yPos += 8;
        }
        createTable('Otros', otros, [147, 51, 234]); // purple-600
    }

    // ============ FOOTER ============
    const pageCount = doc.internal.getNumberOfPages();
    const today = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
            `Página ${i} de ${pageCount} | Generado el ${today}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    return doc;
};

/**
 * Genera y descarga el PDF de Estado de Cuenta
 * @param {Object} client - Datos del cliente
 * @param {Array} receivables - Lista de movimientos
 * @param {Object} contractInfo - Información del contrato (opcional)
 * @param {string} filename - Nombre del archivo (opcional)
 */
import { logoBase64 } from './logoData.js';

/**
 * Genera y descarga el PDF de Estado de Cuenta
 * @param {Object} client - Datos del cliente
 * @param {Array} receivables - Lista de movimientos
 * @param {Object} contractInfo - Información del contrato (opcional)
 * @param {string} filename - Nombre del archivo (opcional)
 */
export const downloadEstadoCuentaPDF = (client, receivables, contractInfo = {}, filename = null) => {
    // Usamos el logo importado directamente
    const doc = generateEstadoCuentaPDF(client, receivables, contractInfo, logoBase64);
    const clientName = (client.name || client.business_name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    const finalFilename = filename || `Estado_Cuenta_${clientName}_${date}.pdf`;
    doc.save(finalFilename);
};
