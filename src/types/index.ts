export interface Instrument {
  name: string
  os?: string
  group?: string
  ip?: string
}

export interface Reservation {
  id: string
  instrumentName: string
  slot: string
  date: string
  reserverName: string
  createdAt: string
  updatedAt: string
}

export interface CreateReservationRequest {
  instrumentName: string
  slot: string
  date: string
  reserverName: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ReservationInfo {
  reserverName: string
  id: string
}

export interface ReservationsByInstrument {
  [instrumentName: string]: {
    [slotKey: string]: ReservationInfo
  }
}
