import { Env } from '../worker'
import { Instrument, ApiResponse } from '../types'

// Static instruments data - in a real app, this could come from a database
const instruments: Instrument[] = [
  { name: 'MSO46B-Q000024', os: 'Linux', group: 'G8', ip: '10.233.67.6' },
  { name: 'MSO56-Q100057', os: 'Linux', group: 'G8', ip: '10.233.66.244' },
  { name: 'MSO58B-PQ010001', os: 'Windows', group: 'G8', ip: '10.233.65.193' },
  { name: 'MSO54B-PQ010002', os: 'Linux', group: 'G8', ip: '10.233.65.195' },
  { name: 'DPO71A-KR20007', os: undefined, group: 'G8', ip: undefined },
  { name: 'MSO68B-B030015', os: 'Windows', group: 'G8', ip: '10.233.67.178' },
  { name: 'MSO58B-C067209', os: undefined, group: 'G8', ip: undefined },
  { name: 'MSO44B-SGVJ010550', os: 'Linux', group: undefined, ip: '10.233.67.186' },
]

export async function getInstruments(request: Request, env: Env): Promise<Response> {
  try {
    const response: ApiResponse<Instrument[]> = {
      success: true,
      data: instruments
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
    console.error('Error fetching instruments:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch instruments'
    }
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    })
  }
}
