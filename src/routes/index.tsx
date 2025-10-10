import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { Header } from '@/components/Header'
import { Copyable } from '@/components/Copyable'
import { SignInRequired } from '@/components/SignInRequired'
import { InstrumentSchedulingDialog } from '@/components/InstrumentSchedulingDialog'
import { instruments } from '@/data/instruments'
import ClerkHeader from '@/integrations/clerk/header-user'
import { generateTimeSlots } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: App,
})


function App() {
  const [openInstrument, setOpenInstrument] = React.useState<string | null>(null)
  // Map instrument -> slotLabel -> reserver name
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

  // Deprecated: previously used for single bar; keeping slot-level now

  const timeSlots = React.useMemo(() => generateTimeSlots(), [])

  function isSlotReserved(instrumentName: string, slot: string) {
    return Boolean(reservationsByInstrument[instrumentName]?.[slot])
  }

  async function toggleSlot(instrumentName: string, slot: string) {
    // optimistic update
    setReservationsByInstrument((prev) => {
      const next: Record<string, Record<string, string>> = { ...prev }
      const current = { ...(next[instrumentName] ?? {}) }
      if (current[slot]) delete current[slot]
      else current[slot] = currentDisplayName
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
            {instruments.map((instrument) => {
              return (
                <div
                  key={instrument.name}
                  className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-7 md:p-8 pb-10 min-h-52 md:min-h-60 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 truncate">
                    {instrument.name}
                  </h3>
                  <div className="text-base md:text-lg text-gray-400 space-y-1.5">
                    <p><span className="text-gray-300">OS:</span> {instrument.os ?? '—'}</p>
                    <p><span className="text-gray-300">Group:</span> {instrument.group ?? '—'}</p>
                    <p>
                      <span className="text-gray-300">IP:</span>{' '}
                      {instrument.ip ? <Copyable text={instrument.ip} /> : '—'}
                    </p>
                  </div>

                  <InstrumentSchedulingDialog
                    instrument={instrument}
                    isOpen={openInstrument === instrument.name}
                    onOpenChange={(open) => setOpenInstrument(open ? instrument.name : null)}
                    timeSlots={timeSlots}
                    reservationsByInstrument={reservationsByInstrument}
                    currentDisplayName={currentDisplayName}
                    onToggleSlot={toggleSlot}
                    onIsSlotReserved={isSlotReserved}
                  />
                </div>
              )
            })}
          </div>
        </section>
      </SignedIn>

      <SignedOut>
        <SignInRequired />
      </SignedOut>
    </div>
  )
}
