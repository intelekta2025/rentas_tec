// src/hooks/useBusinessUnit.js
// Hook personalizado para obtener información de business_units

import { useState, useEffect } from 'react'
import { getBusinessUnit } from '../services/businessUnitService'

export const useBusinessUnit = (unitId) => {
  const [businessUnit, setBusinessUnit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!unitId) {
      setBusinessUnit(null)
      setLoading(false)
      return
    }

    const loadBusinessUnit = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getBusinessUnit(unitId)
        if (error) throw error
        setBusinessUnit(data)
      } catch (err) {
        console.error('Error al cargar business_unit:', err)
        setError(err.message)
        setBusinessUnit(null)
      } finally {
        setLoading(false)
      }
    }

    loadBusinessUnit()
  }, [unitId])

  return {
    businessUnit,
    loading,
    error,
    unitName: businessUnit?.name || null,
  }
}

