import React from 'react'
import { Copyable } from '@/components/Copyable'
import { InstrumentSchedulingDialog } from '@/components/InstrumentSchedulingDialog'

export interface Instrument {
  name: string
  os?: string
  group?: string
  ip?: string
}

interface InstrumentCardProps {
  instrument: Instrument
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reservationsByInstrument: Record<string, Record<string, string>>
  currentDisplayName: string
  onToggleSlot: (instrumentName: string, slot: string, date: string) => void
  onIsSlotReserved: (instrumentName: string, slot: string, date: string) => boolean
}

export function InstrumentCard({
  instrument,
  isOpen,
  onOpenChange,
  reservationsByInstrument,
  currentDisplayName,
  onToggleSlot,
  onIsSlotReserved,
}: InstrumentCardProps) {
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
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        reservationsByInstrument={reservationsByInstrument}
        currentDisplayName={currentDisplayName}
        onToggleSlot={onToggleSlot}
        onIsSlotReserved={onIsSlotReserved}
      />
    </div>
  )
}
