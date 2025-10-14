import { Env } from '../worker'

export async function handleDailyReservationRollover(env: Env): Promise<void> {
  try {
    console.log('Starting daily reservation rollover...')
    
    // Get current date and tomorrow's date
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
    const tomorrowStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD format
    
    console.log(`Processing rollover: ${todayStr} <- ${tomorrowStr}`)
    
    // Step 1: Clear today's reservations
    console.log('Clearing today\'s reservations...')
    const deleteTodayResult = await env.DB.prepare(
      'DELETE FROM reservations WHERE date = ?'
    ).bind(todayStr).run()
    
    console.log(`Deleted ${deleteTodayResult.changes} reservations from today (${todayStr})`)
    
    // Step 2: Get tomorrow's reservations
    console.log('Fetching tomorrow\'s reservations...')
    const tomorrowReservations = await env.DB.prepare(
      'SELECT * FROM reservations WHERE date = ?'
    ).bind(tomorrowStr).all()
    
    console.log(`Found ${tomorrowReservations.results.length} reservations for tomorrow (${tomorrowStr})`)
    
    // Step 3: Copy tomorrow's reservations to today
    if (tomorrowReservations.results.length > 0) {
      console.log('Copying tomorrow\'s reservations to today...')
      
      // Prepare batch insert
      const insertPromises = tomorrowReservations.results.map(async (reservation: any) => {
        const newId = crypto.randomUUID()
        const now = new Date().toISOString()
        
        return env.DB.prepare(`
          INSERT INTO reservations (id, instrumentName, slot, date, reserverName, reserverUserId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newId,
          reservation.instrumentName,
          reservation.slot,
          todayStr, // Copy to today
          reservation.reserverName,
          reservation.reserverUserId,
          now,
          now
        ).run()
      })
      
      const insertResults = await Promise.all(insertPromises)
      const totalInserted = insertResults.reduce((sum, result) => sum + (result.changes || 0), 0)
      console.log(`Copied ${totalInserted} reservations to today (${todayStr})`)
    }
    
    // Step 4: Clear tomorrow's reservations
    console.log('Clearing tomorrow\'s reservations...')
    const deleteTomorrowResult = await env.DB.prepare(
      'DELETE FROM reservations WHERE date = ?'
    ).bind(tomorrowStr).run()
    
    console.log(`Deleted ${deleteTomorrowResult.changes} reservations from tomorrow (${tomorrowStr})`)
    
    console.log('Daily reservation rollover completed successfully')
  } catch (error) {
    console.error('Error during daily reservation rollover:', error)
    throw error
  }
}
