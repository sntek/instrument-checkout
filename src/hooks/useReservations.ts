import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../lib/api'
import { ReservationsByInstrument, CreateReservationRequest } from '../types'

export function useReservations() {
  const [reservations, setReservations] = useState<ReservationsByInstrument>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set())

  const fetchReservations = useCallback(async () => {
    try {
      console.log('Fetching reservations...')
      setLoading(true)
      setError(null)
      const data = await apiClient.getReservations()
      console.log('Fetched reservations:', data)
      setReservations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reservations')
      console.error('Error fetching reservations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimistic update functions
  const optimisticCreateReservation = useCallback((reservation: CreateReservationRequest) => {
    const slotKey = `${reservation.date}-${reservation.slot}`
    const updateKey = `${reservation.instrumentName}-${slotKey}`
    
    console.log('Optimistic create reservation:', reservation)
    
    // Add to optimistic updates
    setOptimisticUpdates(prev => new Set([...prev, updateKey]))
    
    // Update local state immediately
    setReservations(prev => {
      const newReservations = { ...prev }
      if (!newReservations[reservation.instrumentName]) {
        newReservations[reservation.instrumentName] = {}
      }
      newReservations[reservation.instrumentName][slotKey] = {
        reserverName: reservation.reserverName,
        id: `temp-${Date.now()}` // Temporary ID for optimistic updates
      }
      return newReservations
    })
  }, [])

  const optimisticDeleteReservation = useCallback((instrumentName: string, slot: string, date: string) => {
    const slotKey = `${date}-${slot}`
    const updateKey = `${instrumentName}-${slotKey}`
    
    console.log('Optimistic delete reservation:', { instrumentName, slot, date })
    
    // Add to optimistic updates
    setOptimisticUpdates(prev => new Set([...prev, updateKey]))
    
    // Update local state immediately
    setReservations(prev => {
      const newReservations = { ...prev }
      if (newReservations[instrumentName]?.[slotKey]) {
        delete newReservations[instrumentName][slotKey]
        // Clean up empty instrument entries
        if (Object.keys(newReservations[instrumentName]).length === 0) {
          delete newReservations[instrumentName]
        }
      }
      return newReservations
    })
  }, [])

  const createReservation = useCallback(async (reservation: CreateReservationRequest) => {
    try {
      console.log('Creating reservation in hook:', reservation)
      setError(null)
      
      // Apply optimistic update first
      optimisticCreateReservation(reservation)
      
      // Then sync with server
      const result = await apiClient.createReservation(reservation)
      console.log('Reservation created, refreshing data...')
      
      // Remove from optimistic updates
      const slotKey = `${reservation.date}-${reservation.slot}`
      const updateKey = `${reservation.instrumentName}-${slotKey}`
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(updateKey)
        return newSet
      })
      
      // Refresh to get the real data from server
      await fetchReservations()
      console.log('Data refreshed')
    } catch (err) {
      console.error('Error creating reservation:', err)
      
      // Revert optimistic update on error
      const slotKey = `${reservation.date}-${reservation.slot}`
      const updateKey = `${reservation.instrumentName}-${slotKey}`
      setOptimisticUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(updateKey)
        return newSet
      })
      
      // Refresh to get correct state
      await fetchReservations()
      
      setError(err instanceof Error ? err.message : 'Failed to create reservation')
      throw err
    }
  }, [fetchReservations, optimisticCreateReservation])

  const deleteReservation = useCallback(async (id: string, instrumentName?: string, slot?: string, date?: string) => {
    try {
      setError(null)
      
      // If we have the slot info, apply optimistic update
      if (instrumentName && slot && date) {
        optimisticDeleteReservation(instrumentName, slot, date)
      }
      
      await apiClient.deleteReservation(id)
      console.log('Reservation deleted, refreshing data...')
      
      // Remove from optimistic updates if we applied one
      if (instrumentName && slot && date) {
        const slotKey = `${date}-${slot}`
        const updateKey = `${instrumentName}-${slotKey}`
        setOptimisticUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(updateKey)
          return newSet
        })
      }
      
      // Refresh to get the real data from server
      await fetchReservations()
      console.log('Data refreshed')
    } catch (err) {
      console.error('Error deleting reservation:', err)
      
      // Revert optimistic update on error if we applied one
      if (instrumentName && slot && date) {
        const slotKey = `${date}-${slot}`
        const updateKey = `${instrumentName}-${slotKey}`
        setOptimisticUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(updateKey)
          return newSet
        })
        
        // Refresh to get correct state
        await fetchReservations()
      }
      
      setError(err instanceof Error ? err.message : 'Failed to delete reservation')
      throw err
    }
  }, [fetchReservations, optimisticDeleteReservation])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  return {
    reservations,
    loading,
    error,
    createReservation,
    deleteReservation,
    refetch: fetchReservations,
    optimisticUpdates
  }
}
