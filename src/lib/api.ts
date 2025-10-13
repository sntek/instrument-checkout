import { Reservation, CreateReservationRequest, ApiResponse, ReservationsByInstrument, Instrument } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getInstruments(): Promise<Instrument[]> {
    const response = await this.request<Instrument[]>('/api/instruments')
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch instruments')
    }
    return response.data!
  }

  async getReservations(instrumentName?: string): Promise<ReservationsByInstrument> {
    const endpoint = instrumentName 
      ? `/api/reservations?instrumentName=${encodeURIComponent(instrumentName)}`
      : '/api/reservations'
    
    const response = await this.request<ReservationsByInstrument>(endpoint)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch reservations')
    }
    return response.data!
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

  async deleteReservation(id: string): Promise<void> {
    const response = await this.request(`/api/reservations/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete reservation')
    }
  }
}

export const apiClient = new ApiClient()
