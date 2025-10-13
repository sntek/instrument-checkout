import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { Header } from '@/components/Header'
import { SignInRequired } from '@/components/SignInRequired'
import { InstrumentCard } from '@/components/InstrumentCard'
import { instruments } from '@/data/instruments'
import ClerkHeader from '@/integrations/clerk/header-user'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [openInstrument, setOpenInstrument] = React.useState<string | null>(null)
  const [reservationsByInstrument, setReservationsByInstrument] = React.useState<Record<string, Record<string, string>>>({})
  const { user } = useUser()
  const currentDisplayName = React.useMemo(() => {
    return (
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      'You'
    )
  }, [user])

  function isSlotReserved(instrumentName: string, slot: string, date: string) {
    return Boolean(reservationsByInstrument[instrumentName]?.[`${date}-${slot}`])
  }

  async function toggleSlot(instrumentName: string, slot: string, date: string) {
    // optimistic update
    setReservationsByInstrument((prev) => {
      const next: Record<string, Record<string, string>> = { ...prev }
      const current = { ...(next[instrumentName] ?? {}) }
      const slotKey = `${date}-${slot}`
      if (current[slotKey]) delete current[slotKey]
      else current[slotKey] = currentDisplayName
      next[instrumentName] = current
      return next
    })
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
                reservationsByInstrument={reservationsByInstrument}
                currentDisplayName={currentDisplayName}
                onToggleSlot={toggleSlot}
                onIsSlotReserved={isSlotReserved}
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
