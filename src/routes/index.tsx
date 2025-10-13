import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { Header } from '@/components/Header'
import { SignInRequired } from '@/components/SignInRequired'
import { InstrumentCard } from '@/components/InstrumentCard'
import { instruments } from '@/data/instruments'
import ClerkHeader from '@/integrations/clerk/header-user'
import { useReservations } from '@/hooks/useReservations'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [openInstrument, setOpenInstrument] = React.useState<string | null>(null)
  const { user } = useUser()
  const { 
    reservations, 
    createReservation, 
    deleteReservation, 
    optimisticUpdates  } = useReservations({ pollingInterval: 30000, enablePolling: true })
  
  const currentDisplayName = React.useMemo(() => {
    if (user?.firstName && user?.lastName) {
      const cleanFirstName = user.firstName.trim().replace(/,$/, '')
      const cleanLastName = user.lastName.trim().replace(/,$/, '')
      return `${cleanLastName} ${cleanFirstName}`
    }
    return (
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      'You'
    )
  }, [user])

  function isSlotReserved(instrumentName: string, slot: string, date: string) {
    return Boolean(reservations[instrumentName]?.[`${date}-${slot}`])
  }

  function getReservationInfo(instrumentName: string, slot: string, date: string) {
    return reservations[instrumentName]?.[`${date}-${slot}`]
  }

  function isOptimisticallyUpdating(instrumentName: string, slot: string, date: string) {
    const slotKey = `${date}-${slot}`
    const updateKey = `${instrumentName}-${slotKey}`
    return optimisticUpdates.has(updateKey)
  }

  async function toggleSlot(instrumentName: string, slot: string, date: string) {
    const slotKey = `${date}-${slot}`
    const reservationInfo = getReservationInfo(instrumentName, slot, date)
    const isReserved = Boolean(reservationInfo)
    
    console.log('Toggle slot:', { instrumentName, slot, date, slotKey, isReserved, reservationInfo, currentReservations: reservations })
    
    try {
      if (isReserved) {
        // Delete the reservation using the ID
        console.log('Deleting reservation for:', { instrumentName, slot, date, id: reservationInfo?.id })
        if (reservationInfo?.id) {
          await deleteReservation(reservationInfo.id, instrumentName, slot, date)
          console.log('Reservation deleted')
        } else {
          console.error('No reservation ID found for deletion')
        }
      } else {
        // Create new reservation
        console.log('Creating reservation:', { instrumentName, slot, date, reserverName: currentDisplayName })
        await createReservation({
          instrumentName,
          slot,
          date,
          reserverName: currentDisplayName
        })
        console.log('Reservation created, should refresh automatically')
      }
    } catch (error) {
      console.error('Error toggling slot:', error)
      // You might want to show a toast notification here
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <div className="fixed top-4 right-4 z-50 text-white hover:text-cyan-500 transition-colors hover:underline">
        <ClerkHeader />
      </div>
      <SignedIn>
        <section className="py-16 px-6 mx-auto w-full">
          <div className="grid grid-cols-4 gap-8 items-stretch">
            {instruments.map((instrument) => (
              <InstrumentCard
                key={instrument.name}
                instrument={instrument}
                isOpen={openInstrument === instrument.name}
                onOpenChange={(open) => setOpenInstrument(open ? instrument.name : null)}
                reservationsByInstrument={reservations}
                currentDisplayName={currentDisplayName}
                onToggleSlot={toggleSlot}
                onIsSlotReserved={isSlotReserved}
                onIsOptimisticallyUpdating={isOptimisticallyUpdating}
              />
            ))}
          </div>
        </section>
      </SignedIn>

      <SignedOut>
        <SignInRequired />
      </SignedOut>
    </div>
  )
}
