import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Instrument {
  name: string
  os?: string
  group?: string
  ip?: string
}

interface InstrumentSchedulingDialogProps {
  instrument: Instrument
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  timeSlots: string[]
  reservationsByInstrument: Record<string, Record<string, string>>
  currentDisplayName: string
  onToggleSlot: (instrumentName: string, slot: string) => void
  onIsSlotReserved: (instrumentName: string, slot: string) => boolean
}

export function InstrumentSchedulingDialog({
  instrument,
  isOpen,
  onOpenChange,
  timeSlots,
  reservationsByInstrument,
  currentDisplayName,
  onToggleSlot,
  onIsSlotReserved,
}: InstrumentSchedulingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <div
        className="absolute left-0 right-0 bottom-0 px-2 py-2 rounded-b-xl bg-gradient-to-t from-slate-900/20 to-transparent"
        onClick={() => onOpenChange(true)}
        role="button"
        aria-label="Open scheduling for instrument"
        title="View and select time slots"
      >
        <div className="flex w-full items-end gap-1 justify-center lg:justify-start">
          {timeSlots.map((slot) => {
            const reserved = onIsSlotReserved(instrument.name, slot)
            const reserver = reservationsByInstrument[instrument.name]?.[slot]
            return (
              <Tooltip key={slot}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-7 w-2.5 sm:h-8 sm:w-3 md:h-10 md:w-3.5 rounded-full transition-transform ${reserved ? 'bg-red-500' : 'bg-emerald-500'} hover:scale-110`}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onToggleSlot(instrument.name, slot)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        onToggleSlot(instrument.name, slot)
                      }
                    }}
                    aria-label={reserved ? `${slot} — Reserved${reserver ? ` by ${reserver}` : ''}` : `${slot} — Free`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <span className="font-medium">{slot}</span>
                  <span className="ml-2 opacity-80">{reserved ? (reserver ? `Reserved by ${reserver}` : 'Reserved') : 'Free'}</span>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {instrument.name} — Select Time Slots
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
            <span className="tabular-nums">7:30 AM</span>
            <span className="tabular-nums">12:00 PM</span>
            <span className="tabular-nums">5:00 PM</span>
          </div>
          <div className="relative w-full">
            {/* Track */}
            <div className="h-10 rounded-lg bg-slate-900/60 border border-slate-700 shadow-inner" />
            {/* Hour grid lines */}
            <div className="pointer-events-none absolute inset-0 flex">
              {timeSlots.map((_, idx) => (
                <div key={idx} className="flex-1 relative">
                  {(idx % 2 === 0) && (
                    <div className="absolute inset-y-1 -right-px w-px bg-slate-700/60" />
                  )}
                </div>
              ))}
            </div>
            {/* Interactive segments */}
            <div className="absolute inset-0 flex gap-[1px] p-1">
              {timeSlots.map((slot) => {
                const selected = Boolean(reservationsByInstrument[instrument.name]?.[slot])
                const reserver = reservationsByInstrument[instrument.name]?.[slot]
                const isMine = reserver && reserver === currentDisplayName
                return (
                  <Tooltip key={slot}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onToggleSlot(instrument.name, slot)}
                        className={`flex-1 relative rounded-md outline-none transition-[transform,box-shadow] focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                        aria-label={`Toggle ${slot}${reserver ? ` (reserved by ${reserver})` : ''}`}
                      >
                        <span
                          className={`absolute inset-0 rounded-md ${selected ? (isMine ? 'bg-cyan-500/90' : 'bg-rose-500/80') : 'bg-slate-800/0 hover:bg-slate-700/40'} shadow ${selected ? 'shadow-cyan-500/10' : 'shadow-none'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <span className="font-medium">{slot}</span>
                      <span className="ml-2 opacity-80">{selected ? (reserver ? (isMine ? 'Reserved by you' : `Reserved by ${reserver}`) : 'Reserved') : 'Free'}</span>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500/90 inline-block" />
                Yours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/80 inline-block" />
                Reserved
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-700/40 ring-1 ring-inset ring-slate-600/60 inline-block rounded" />
                Free
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">Click segments to toggle</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
