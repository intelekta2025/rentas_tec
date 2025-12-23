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
        // Mapeo de columnas del CSV a la base de datos
        // Se asumen ciertos nombres de cabecera, adaptar según el CSV real
        const formattedRows = rows.map(row => ({
            upload_id: uploadId,
            unit_id: unitId,
            raw_total_value: parseFloat(row['Total Value'] || row['Monto'] || row['raw_total_value'] || 0),
            raw_authorized_date: row['Authorized Date'] || row['Fecha'] || row['raw_authorized_date'] || null,
            raw_order: row['Order'] || row['Orden'] || row['raw_order'] || '',
            raw_receiver_name: row['Receiver Name'] || row['Receptor'] || row['raw_receiver_name'] || '',
            raw_sku_name: row['SKU Name'] || row['SKU'] || row['raw_sku_name'] || '',
            raw_status: row['Status raw value (temporary)'] || row['Status'] || row['Estatus'] || row['raw_status'] || '',
            processing_status: 'PENDING'
        }));

        const { data, error } = await supabase
            .from('payment_staging')
            .insert(formattedRows)
            .select();

        if (error) throw error;
        return data;
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
        const { data, error } = await supabase
            .from('payment_staging')
            .select('*')
            .eq('upload_id', uploadId)
            .order('id', { ascending: true });

        if (error) throw error;
        return data;
    },

    // 6. Actualizar estado de la carga
    updateUploadStatus: async (uploadId, status) => {
        const { error } = await supabase
            .from('market_tec_uploads')
            .update({ status })
            .eq('id', uploadId);
        if (error) throw error;
    }
};
