import { useState, useEffect, useCallback } from 'react';
import { getPayments } from '../services/paymentService';

export const usePayments = (clientId = null, unitId = null) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
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
    }, [fetchPayments]);

    return {
        payments,
        loading,
        error,
        refreshPayments: fetchPayments
    };
};
