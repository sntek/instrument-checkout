import { Env } from '../worker'
import { Reservation, CreateReservationRequest, ApiResponse, ReservationsByInstrument } from '../types'

export async function getReservations(request: Request, env: Env): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const instrumentName = searchParams.get('instrumentName')
    
    let query = 'SELECT * FROM reservations ORDER BY createdAt DESC'
    let params: any[] = []
    
    if (instrumentName) {
      query = 'SELECT * FROM reservations WHERE instrumentName = ? ORDER BY createdAt DESC'
      params = [instrumentName]
    }
    
    const result = await env.DB.prepare(query).bind(...params).all()
    const reservations = result.results as Reservation[]
    
    // Transform reservations into the format expected by the frontend
    const reservationsByInstrument: ReservationsByInstrument = {}
    
    reservations.forEach(reservation => {
      if (!reservationsByInstrument[reservation.instrumentName]) {
        reservationsByInstrument[reservation.instrumentName] = {}
      }
      const slotKey = `${reservation.date}-${reservation.slot}`
      // Store both reserver name, user ID, and reservation ID for deletion
      reservationsByInstrument[reservation.instrumentName][slotKey] = {
        reserverName: reservation.reserverName,
        reserverUserId: reservation.reserverUserId,
        id: reservation.id
      }
    })
    
    const response: ApiResponse<ReservationsByInstrument> = {
      success: true,
      data: reservationsByInstrument
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch reservations'
    }
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function createReservation(request: Request, env: Env): Promise<Response> {
  try {
    const body: CreateReservationRequest = await request.json()
    const { instrumentName, slot, date, reserverName, reserverUserId } = body
    
    if (!instrumentName || !slot || !date || !reserverName || !reserverUserId) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: instrumentName, slot, date, reserverName, reserverUserId'
      }
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Check if slot is already reserved
    const existingReservation = await env.DB.prepare(
      'SELECT * FROM reservations WHERE instrumentName = ? AND slot = ? AND date = ?'
    ).bind(instrumentName, slot, date).first()
    
    if (existingReservation) {
      const response: ApiResponse = {
        success: false,
        error: 'Slot is already reserved'
      }
      return new Response(JSON.stringify(response), {
        status: 409,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Create new reservation
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    const result = await env.DB.prepare(`
      INSERT INTO reservations (id, instrumentName, slot, date, reserverName, reserverUserId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, instrumentName, slot, date, reserverName, reserverUserId, now, now).run()
    
    if (result.success) {
      const response: ApiResponse<Reservation> = {
        success: true,
        data: {
          id,
          instrumentName,
          slot,
          date,
          reserverName,
          reserverUserId,
          createdAt: now,
          updatedAt: now
        }
      }
      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    } else {
      throw new Error('Failed to create reservation')
    }
  } catch (error) {
    console.error('Error creating reservation:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create reservation'
    }
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function deleteReservation(request: Request, env: Env, params: { id: string }): Promise<Response> {
  try {
    const { id } = params
    
    // Get the user ID from the request body or headers
    const body = await request.json().catch(() => ({}))
    const { reserverUserId } = body
    
    if (!reserverUserId) {
      const response: ApiResponse = {
        success: false,
        error: 'User ID is required to delete reservation'
      }
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Check if reservation exists
    const existingReservation = await env.DB.prepare(
      'SELECT * FROM reservations WHERE id = ?'
    ).bind(id).first()
    
    if (!existingReservation) {
      const response: ApiResponse = {
        success: false,
        error: 'Reservation not found'
      }
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Check if the user owns the reservation
    if (existingReservation.reserverUserId !== reserverUserId) {
      const response: ApiResponse = {
        success: false,
        error: 'You can only delete your own reservations'
      }
      return new Response(JSON.stringify(response), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    }
    
    // Delete reservation
    const result = await env.DB.prepare(
      'DELETE FROM reservations WHERE id = ?'
    ).bind(id).run()
    
    if (result.success) {
      const response: ApiResponse = {
        success: true,
        data: { deleted: true }
      }
      return new Response(JSON.stringify(response), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      })
    } else {
      throw new Error('Failed to delete reservation')
    }
  } catch (error) {
    console.error('Error deleting reservation:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete reservation'
    }
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
