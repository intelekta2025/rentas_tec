import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

export const marketTecService = {
    // 1. Parsear archivo CSV/Excel
    parseFile: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    },

    // 2. Crear registro de carga (Master)
    createUploadRecord: async ({ unitId, filename, uploadedBy, totalRecords, totalAmount }) => {
        const { data, error } = await supabase
            .from('market_tec_uploads')
            .insert([
                {
                    unit_id: unitId,
                    filename: filename,
                    uploaded_by: uploadedBy,
                    total_records: totalRecords,
                    total_amount: totalAmount,
                    status: 'DRAFT' // Inicialmente Borrador
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Insertar datos en staging (Detail)
    insertStagingData: async (uploadId, unitId, rows) => {
        // 1. Verificar duplicados en tabla payments usando Market_tec_Referencia
        const orders = rows
            .map(r => r['Order'] || r['Orden'] || r['raw_order'])
            .filter(o => o); // Filtrar nulos/vacíos para la consulta

        let existingRefs = [];
        if (orders.length > 0) {
            // Consultar en lotes si son muchos (por brevedad aquí consultamos 'in')
            const { data: duplicates, error: dupError } = await supabase
                .from('payments')
                .select('"Market_tec_Referencia"')
                .in('"Market_tec_Referencia"', orders);

            if (dupError) {
                console.error('Error checking duplicates:', dupError);
                throw dupError;
            }
            // Extraer referencias existentes
            existingRefs = (duplicates || []).map(d => d.Market_tec_Referencia);
        }

        // 2. Filtrar filas que ya existen como pago
        const newRows = rows.filter(row => {
            const order = row['Order'] || row['Orden'] || row['raw_order'];
            return !existingRefs.includes(order);
        });

        const skippedCount = rows.length - newRows.length;

        if (newRows.length === 0) {
            return { data: [], skippedCount };
        }

        // 3. Obtener clientes para validación de "Usuario MT"
        const receiverNames = [...new Set(newRows.map(row => row['Receiver Name'] || row['Receptor'] || row['raw_order']).filter(Boolean))];
        let clientMap = {};
        if (receiverNames.length > 0) {
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('"User_market_tec"')
                .in('"User_market_tec"', receiverNames);

            if (!clientError && clients) {
                clients.forEach(c => {
                    clientMap[c.User_market_tec] = true;
                });
            }
        }

        // 4. Mapeo para inserción
        const formattedRows = newRows.map(row => {
            const receiverName = row['Receiver Name'] || row['Receptor'] || row['raw_receiver_name'] || '';
            const hasClient = clientMap[receiverName];

            return {
                upload_id: uploadId,
                unit_id: unitId,
                raw_total_value: parseFloat(row['Total Value'] || row['Monto'] || row['raw_total_value'] || 0),
                raw_authorized_date: row['Authorized Date'] || row['Fecha'] || row['raw_authorized_date'] || null,
                raw_order: row['Order'] || row['Orden'] || row['raw_order'] || '',
                raw_receiver_name: receiverName,
                raw_sku_name: row['SKU Name'] || row['SKU'] || row['raw_sku_name'] || '',
                raw_status: row['Status raw value (temporary)'] || row['Status'] || row['Estatus'] || row['raw_status'] || '',
                processing_status: hasClient ? 'PENDIENTE' : 'SIN CLIENTE'
            };
        });

        const { data, error } = await supabase
            .from('payment_staging')
            .insert(formattedRows)
            .select();

        if (error) throw error;
        return { data, skippedCount };
    },

    // 4. Obtener historial de cargas
    getUploads: async (unitId) => {
        // Si no hay unitId, traer todo (o manejar según permisos)
        let query = supabase
            .from('market_tec_uploads')
            .select('*')
            .order('upload_date', { ascending: false });

        if (unitId) {
            query = query.eq('unit_id', unitId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // 5. Obtener datos de staging para revisión
    getStagingData: async (uploadId) => {
        // 1. Obtener datos de staging
        const { data: stagingData, error } = await supabase
            .from('payment_staging')
            .select('*')
            .eq('upload_id', uploadId)
            .order('id', { ascending: true });

        if (error) throw error;
        if (!stagingData || stagingData.length === 0) return [];

        // 2. Obtener clientes relacionados para el join
        // Extraemos los nombres de receptor únicos
        const receiverNames = [...new Set(stagingData.map(r => r.raw_receiver_name).filter(Boolean))];

        let clientMap = {};
        if (receiverNames.length > 0) {
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id, business_name, "User_market_tec"') // Seleccionar User_market_tec con comillas
                .in('"User_market_tec"', receiverNames);

            if (!clientError && clients) {
                // Crear mapa por User_market_tec
                clients.forEach(c => {
                    if (c.User_market_tec) {
                        clientMap[c.User_market_tec] = c;
                    }
                });
            } else if (clientError) {
                console.error("Error fetching clients for join:", clientError);
            }
        }

        // 3. Mergear datos
        const enrichedData = stagingData.map(row => {
            const client = clientMap[row.raw_receiver_name];
            return {
                ...row,
                client_matched_id: client ? client.id : null,
                client_business_name: client ? client.business_name : null,
                client_user_market_tec: client ? client.User_market_tec : null
            };
        });

        // Ordenar por Receptor (raw_receiver_name)
        enrichedData.sort((a, b) => (a.raw_receiver_name || '').localeCompare(b.raw_receiver_name || ''));

        return enrichedData;
    },

    // 6. Disparar conciliación en n8n
    triggerReconciliation: async (uploadId, rowIds = []) => {
        try {
            let webhookUrl = `https://n8n-t.intelekta.ai/webhook-test/8a737d17-e9cf-4eaa-aae7-8dba9fc61864?upload_id=${uploadId}`;

            if (rowIds && rowIds.length > 0) {
                webhookUrl += `&record_ids=${rowIds.join(',')}`;
            }

            // Enviar ID de carga vía GET para que n8n procese
            const response = await fetch(webhookUrl, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error n8n: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('Error triggering reconciliation:', error);
            // Retornamos success false para manejarlo en la UI
            return { success: false, error: error.message };
        }
    },

    // 7. Actualizar estado de la carga
    updateUploadStatus: async (uploadId, status) => {
        const { error } = await supabase
            .from('market_tec_uploads')
            .update({ status })
            .eq('id', uploadId);
        if (error) throw error;
    }
};
