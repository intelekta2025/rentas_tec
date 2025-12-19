// src/hooks/useContracts.js
// Hook personalizado para obtener contratos de un cliente

import { useState, useEffect } from 'react'
import { getContracts, createContract, updateContract, terminateContract } from '../services/contractService'

export const useContracts = (clientId) => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!clientId) {
      setContracts([])
      setLoading(false)
      return
    }

    const loadContracts = async () => {
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
    }

    loadContracts()
  }, [clientId])

  const addContract = async (contractData) => {
    try {
      const { data, error } = await createContract(contractData)
      if (error) throw error
      setContracts(prev => [data, ...prev])
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
      setContracts(prev => prev.map(contract => 
        contract.id === contractId ? data : contract
      ))
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
      setContracts(prev => prev.map(contract => 
        contract.id === contractId ? data : contract
      ))
      return { success: true, data, error: null }
    } catch (err) {
      setError(err.message)
      return { success: false, data: null, error: err }
    }
  }

  const refreshContracts = async () => {
    if (!clientId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getContracts(clientId)
      if (error) throw error
      setContracts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    contracts,
    loading,
    error,
    addContract,
    editContract,
    finalizeContract,
    refreshContracts,
  }
}

