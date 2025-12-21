// src/services/contractService.js
// Servicio para operaciones con contracts

import { supabase } from '../lib/supabase'

/**
 * Obtiene todos los contratos de un cliente
 * @param {number} clientId - ID del cliente
 * @returns {Promise<{data: array, error: object}>}
 */
export const getContracts = async (clientId) => {
  try {
    if (!clientId) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_id', clientId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error al obtener contracts:', error)
      return { data: [], error }
    }

    // Mapear los datos - mantener los campos originales de la BD (snake_case)
    // No necesitamos convertir a camelCase, usaremos directamente los campos de la BD
    const mappedData = (data || []).map(contract => {
      // Convertir monthly_rent_amount a número si viene como string
      let monthlyRentAmount = contract.monthly_rent_amount
      if (typeof monthlyRentAmount === 'string' && monthlyRentAmount !== '') {
        monthlyRentAmount = parseFloat(monthlyRentAmount.replace(/[^0-9.-]+/g, ''))
        if (isNaN(monthlyRentAmount)) monthlyRentAmount = null
      }

      return {
        ...contract,
        // Asegurar que monthly_rent_amount sea numérico si es posible
        monthly_rent_amount: monthlyRentAmount !== null && monthlyRentAmount !== undefined ? monthlyRentAmount : contract.monthly_rent_amount,
      }
    })

    return { data: mappedData, error: null }
  } catch (error) {
    console.error('Error al obtener contracts:', error)
    return { data: [], error }
  }
}

/**
 * Crea un nuevo contrato
 * @param {object} contractData - Datos del contrato
 * @returns {Promise<{data: object, error: object}>}
 */
export const createContract = async (contractData) => {
  try {
    const mappedData = {
      client_id: contractData.clientId,
      unit_id: contractData.unitId,
      start_date: contractData.startDate,
      end_date: contractData.endDate,
      cutoff_day: contractData.cutoffDay || null,
      monthly_rent_amount: contractData.monthlyRentAmount || contractData.monthly_rent_amount || null,
      monthly_services_amount: contractData.monthlyServicesAmount || contractData.monthly_services_amount || null,
      num_months: contractData.numMonths || null,
      status: contractData.status || 'Activo',
    }

    const { data, error } = await supabase
      .from('contracts')
      .insert([mappedData])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al crear contract:', error)
    return { data: null, error }
  }
}

/**
 * Actualiza un contrato
 * @param {number} contractId - ID del contrato
 * @param {object} contractData - Datos a actualizar
 * @returns {Promise<{data: object, error: object}>}
 */
export const updateContract = async (contractId, contractData) => {
  try {
    const mappedData = {}
    if (contractData.startDate !== undefined) mappedData.start_date = contractData.startDate
    if (contractData.endDate !== undefined) mappedData.end_date = contractData.endDate
    if (contractData.cutoffDay !== undefined) mappedData.cutoff_day = contractData.cutoffDay
    if (contractData.monthlyRentAmount !== undefined) mappedData.monthly_rent_amount = contractData.monthlyRentAmount
    if (contractData.monthly_rent_amount !== undefined) mappedData.monthly_rent_amount = contractData.monthly_rent_amount
    // Fix: Save monthly services amount (correct field name: monthly_services_amount)
    if (contractData.monthlyServicesAmount !== undefined) mappedData.monthly_services_amount = contractData.monthlyServicesAmount
    if (contractData.monthly_services_amount !== undefined) mappedData.monthly_services_amount = contractData.monthly_services_amount
    if (contractData.numMonths !== undefined) mappedData.num_months = contractData.numMonths

    const { data, error } = await supabase
      .from('contracts')
      .update(mappedData)
      .eq('id', contractId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al actualizar contract:', error)
    return { data: null, error }
  }
}

/**
 * Finaliza un contrato (actualiza termination_date a la fecha actual y status a 'Terminated')
 * @param {number} contractId - ID del contrato
 * @returns {Promise<{data: object, error: object}>}
 */
export const terminateContract = async (contractId) => {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { data, error } = await supabase
      .from('contracts')
      .update({
        termination_date: today,
        status: 'Terminado' // También actualizar el status
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error al finalizar contract:', error)
    return { data: null, error }
  }
}

