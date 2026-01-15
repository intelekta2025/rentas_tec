import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de importar supabase
import { getPayments } from '../services/paymentService';

export const usePayments = (clientId = null, unitId = null) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPayments = useCallback(async () => {
        try {
            // setLoading(true); // Opcional: comentar para que sea silencioso
            const { data, error: fetchError } = await getPayments(clientId, unitId);

            if (fetchError) throw fetchError;

            setPayments(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId, unitId]);

    useEffect(() => {
        fetchPayments();

        // LOGICA REALTIME AÑADIDA
        const channel = supabase
            .channel(`realtime_payments_${clientId || unitId || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payments',
                    // Filtramos inteligentemente según el contexto (Cliente o Unidad)
                    filter: clientId
                        ? `client_id=eq.${clientId}`
                        : unitId
                            ? `unit_id=eq.${unitId}`
                            : undefined
                },
                (payload) => {
                    console.log('Pago detectado:', payload);
                    fetchPayments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPayments, clientId, unitId]);

    return {
        payments,
        loading,
        error,
        refreshPayments: fetchPayments
    };
};
