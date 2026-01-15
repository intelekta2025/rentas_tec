import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getContracts, createContract, updateContract, terminateContract, reactivateContract as reactivateContractService } from '../services/contractService'

export const useContracts = (clientId) => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchContracts = useCallback(async () => {
    if (!clientId) {
      setContracts([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getContracts(clientId)
      if (error) throw error
      setContracts(data || [])
    } catch (err) {
      console.error('Error al cargar contratos:', err)
      setError(err.message)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchContracts()

    if (clientId) {
      const channel = supabase
        .channel(`realtime_contracts_${clientId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contracts',
            filter: `client_id=eq.${clientId}`
          },
          (payload) => {
            console.log('Cambio detectado en BD (Contracts):', payload);
            fetchContracts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchContracts, clientId])

  const addContract = async (contractData) => {
    try {
      const { data, error } = await createContract(contractData)
      if (error) throw error
      await fetchContracts()
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  const editContract = async (contractId, contractData) => {
    try {
      const { data, error } = await updateContract(contractId, contractData)
      if (error) throw error
      await fetchContracts()
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  const finalizeContract = async (contractId) => {
    try {
      const { data, error } = await terminateContract(contractId)
      if (error) throw error
      await fetchContracts()
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  const refreshContracts = fetchContracts

  const reactivateContractHook = async (contractId) => {
    try {
      const { data, error } = await reactivateContractService(contractId)
      if (error) throw error
      await fetchContracts()
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  return {
    contracts,
    loading,
    error,
    addContract,
    editContract,
    finalizeContract,
    reactivateContract: reactivateContractHook,
    refreshContracts,
  }
}

