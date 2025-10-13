import { corsHeaders } from './utils/cors'
import { createReservation, getReservations, deleteReservation } from './handlers/reservations'
import { getInstruments } from './handlers/instruments'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url)
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        })
      }
      
      // Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString() 
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
      
      // API routes
      if (url.pathname === '/api/instruments' && request.method === 'GET') {
        return await getInstruments(request, env)
      }
      
      if (url.pathname === '/api/reservations' && request.method === 'GET') {
        return await getReservations(request, env)
      }
      
      if (url.pathname === '/api/reservations' && request.method === 'POST') {
        return await createReservation(request, env)
      }
      
      if (url.pathname.startsWith('/api/reservations/') && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop()
        if (id) {
          return await deleteReservation(request, env, { id })
        }
      }
      
      // 404 for everything else
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
  }
}

// Environment interface
export interface Env {
  DB: D1Database
  ENVIRONMENT: string
}
