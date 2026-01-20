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
        const receiverNames = [...new Set(newRows.map(row => (row['Receiver Name'] || row['Receptor'] || row['raw_order'] || '').toString().trim()).filter(Boolean))];
        console.log('📋 Receiver Names from CSV:', receiverNames);

        let clientMap = {};
        if (receiverNames.length > 0) {
            // Obtener TODOS los clientes con su ID y User_market_tec
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('id, "User_market_tec"');

            console.log('📋 Clients query result:', { clients, clientError });

            if (!clientError && clients) {
                // Crear mapa normalizado con el ID del cliente
                clients.forEach(c => {
                    if (c.User_market_tec) {
                        const normalizedKey = c.User_market_tec.toString().trim().toLowerCase();
                        clientMap[normalizedKey] = c.id; // Guardamos el ID, no solo true
                    }
                });
                console.log('📋 ClientMap keys:', Object.keys(clientMap));
            }
        }

        // 4. Mapeo para inserción
        const formattedRows = newRows.map((row, index) => {
            const receiverName = (row['Receiver Name'] || row['Receptor'] || row['raw_receiver_name'] || '').toString().trim();
            const normalizedReceiverName = receiverName.toLowerCase();
            const clientId = clientMap[normalizedReceiverName] || null; // Obtener el ID del cliente

            if (index === 0) {
                console.log('📋 First row matching debug:', {
                    rawValue: row['Receiver Name'],
                    receiverName,
                    normalizedReceiverName,
                    clientId,
                    inMap: normalizedReceiverName in clientMap
                });
            }

            return {
                upload_id: uploadId,
                unit_id: unitId,
                raw_total_value: parseFloat(row['Total Value'] || row['Monto'] || row['raw_total_value'] || 0),
                raw_authorized_date: row['Authorized Date'] || row['Fecha'] || row['raw_authorized_date'] || null,
                raw_order: row['Order'] || row['Orden'] || row['raw_order'] || '',
                raw_receiver_name: receiverName,
                raw_sku_name: row['SKU Name'] || row['SKU'] || row['raw_sku_name'] || '',
                raw_status: row['Status raw value (temporary)'] || row['Status'] || row['Estatus'] || row['raw_status'] || '',
                client_id: clientId, // ¡CLAVE! Ahora asignamos el client_id
                processing_status: clientId ? 'PENDIENTE' : 'SIN CXC'
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

        const { data: uploads, error } = await query;
        if (error) throw error;

        if (!uploads || uploads.length === 0) return [];

        // Obtener estadísticas de procesados/pendientes desde staging
        const uploadIds = uploads.map(u => u.id);
        const { data: stagingStats, error: statsError } = await supabase
            .from('payment_staging')
            .select('upload_id, processing_status')
            .in('upload_id', uploadIds);

        if (statsError) {
            console.error('Error fetching staging stats:', statsError);
            // Retornar uploads sin stats si falla esto, para no romper la UI
            return uploads.map(u => ({ ...u, processed_records: 0, pending_records: 0 }));
        }

        // Agrupar estadísticas por upload_id
        const statsMap = {};
        stagingStats.forEach(item => {
            if (!statsMap[item.upload_id]) {
                statsMap[item.upload_id] = { processed: 0, pending: 0 };
            }
            if (item.processing_status === 'PENDIENTE') {
                statsMap[item.upload_id].pending++;
            } else {
                statsMap[item.upload_id].processed++;
            }
        });

        // Combinar datos
        return uploads.map(u => {
            const stats = statsMap[u.id] || { processed: 0, pending: 0 };
            return {
                ...u,
                processed_records: stats.processed,
                pending_records: stats.pending
            };
        });
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
                .select('id, business_name, "User_market_tec"');

            if (!clientError && clients) {
                // Crear mapa normalizado (lowercase, trimmed) para comparación flexible
                clients.forEach(c => {
                    if (c.User_market_tec) {
                        const normalizedKey = c.User_market_tec.toString().trim().toLowerCase();
                        clientMap[normalizedKey] = c;
                    }
                });
            } else if (clientError) {
                console.error("Error fetching clients for join:", clientError);
            }
        }

        // 3. Mergear datos
        const enrichedData = stagingData.map(row => {
            const normalizedReceiverName = (row.raw_receiver_name || '').toString().trim().toLowerCase();
            const client = clientMap[normalizedReceiverName];
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
    // 6. Disparar conciliación vía Supabase Edge Function
    triggerReconciliation: async (uploadId) => {
        try {
            console.log("Iniciando conciliación inteligente via n8n...");

            // URL proporcionada explícitamente por el usuario
            const webhookUrl = 'https://n8n-t.intelekta.ai/webhook/c0a61e42-37a7-40a9-ac8f-24899ee74dc4';

            // Volvemos a llamada estándar: el servidor n8n rechazó 'no-cors' (405).
            // Si esto falla con CORS en localhost, ES NECESARIO agregar localhost en n8n.
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uploadId })
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new Error(`Error en conciliación (n8n): ${response.status} ${errorText}`);
            }

            // Intentar parsear JSON
            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                console.warn('La respuesta de n8n no fue un JSON válido, asumiendo éxito sin detalles.', e);
                data = { processed: 0, matches: 0 };
            }

            return {
                success: true,
                processed: data.processed || 0,
                matches: data.matches || 0
            };

        } catch (error) {
            console.error("Error en conciliación:", error);
            return { success: false, error: error.message };
        }
    },

    // 7. Verificar estado de procesamiento
    checkProcessingStatus: async (uploadId) => {
        try {
            const { data, error } = await supabase.rpc('get_upload_progress', { p_upload_id: uploadId });

            if (error) throw error;

            // La RPC ya devuelve 'is_complete' calculado correctamente
            // Mapear todos los campos necesarios para la UI
            return {
                isComplete: data.is_complete,
                totalCount: data.total,
                pendingCount: data.pending,
                processingCount: data.processing,
                processedCount: data.completed_count, // Suma de exitosos + errores
                // Campos adicionales para desglose detallado en la UI
                noCxcCount: data.no_cxc || 0,
                noClientCount: data.no_client || 0,
                errorCount: data.error || 0
            };
        } catch (error) {
            console.error('Error checking processing status:', error);
            // Fail-safe para que la UI no crea que terminó si hay error de red
            return { isComplete: false, error: error.message };
        }
    },

    // 8. Actualizar estado de la carga
    updateUploadStatus: async (uploadId, status) => {
        const { error } = await supabase
            .from('market_tec_uploads')
            .update({ status })
            .eq('id', uploadId);
        if (error) throw error;
    },

    // 9. Eliminar carga y sus registros asociados
    deleteUpload: async (uploadId) => {
        // Eliminar el registro maestro de la carga
        // Los registros de payment_staging se eliminarán automáticamente por triggers de la BD
        const { error: uploadError } = await supabase
            .from('market_tec_uploads')
            .delete()
            .eq('id', uploadId);

        if (uploadError) throw uploadError;

        return true;
    }
};
