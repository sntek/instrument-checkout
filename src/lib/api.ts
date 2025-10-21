import { Reservation, CreateReservationRequest, ApiResponse, ReservationsByInstrument, Instrument } from '../types'

const API_BASE_URL = 'https://instrument-checkout-backend.vercel.app'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      // If the response has an error message, use it; otherwise use the generic HTTP error
      const errorMessage = data.error || `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }

    return data
  }

  async getInstruments(): Promise<Instrument[]> {
    const response = await this.request<Instrument[]>('/api/instruments')
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch instruments')
    }
    
    // Transform the data to handle backend field mapping
    const instruments = response.data!.map(instrument => ({
      name: instrument.name,
      os: instrument.os,
      group: instrument.group || instrument.group_name, // Handle both field names
      ip: instrument.ip
    }))
    
    return instruments
  }

  async getReservations(instrumentName?: string): Promise<ReservationsByInstrument> {
    const endpoint = instrumentName 
      ? `/api/reservations?instrumentName=${encodeURIComponent(instrumentName)}`
      : '/api/reservations'
    
    const response = await this.request<ReservationsByInstrument>(endpoint)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch reservations')
    }
    
    // Clean up malformed data from backend
    const cleanedData: ReservationsByInstrument = {}
    const rawData = response.data!
    
    for (const [instrument, slots] of Object.entries(rawData)) {
      // Skip entries with undefined instrument names
      if (instrument === 'undefined') {
        continue
      }
      
      cleanedData[instrument] = {}
      for (const [slotKey, reservationInfo] of Object.entries(slots)) {
        // Ensure reservation info has all required fields
        cleanedData[instrument][slotKey] = {
          reserverName: reservationInfo.reserverName || 'Unknown',
          reserverUserId: reservationInfo.reserverUserId || 'unknown',
          id: reservationInfo.id
        }
      }
    }
    
    return cleanedData
  }

  async createReservation(reservation: CreateReservationRequest): Promise<Reservation> {
    const response = await this.request<Reservation>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create reservation')
    }
    return response.data!
  }

  async deleteReservation(id: string, reserverUserId: string): Promise<void> {
    const response = await this.request(`/api/reservations/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reserverUserId }),
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete reservation')
    }
  }
}

export const apiClient = new ApiClient()
