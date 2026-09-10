"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Truck,
} from "lucide-react"

import { getLogisticsOptions } from "@/lib/logistics"
import { useLanguage } from "@/lib/language"

const money = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`

type LogisticsOption = ReturnType<typeof getLogisticsOptions>[number]

type Props = {
  quantity: number
  unit: string
  cropName: string
  marketName: string
  distanceKm: number
  farmLocation: string
  grossRevenue: number
  otherCosts: number
  existingTransportCost: number
  onBack: () => void
  onTransportSelected?: (cost: number) => void
}

export function Logistics({
  quantity,
  unit,
  cropName,
  marketName,
  distanceKm,
  farmLocation,
  grossRevenue,
  otherCosts,
  existingTransportCost,
  onBack,
  onTransportSelected,
}: Props) {
  const { t } = useLanguage()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pickupScheduled, setPickupScheduled] = useState(false)
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [driverContact, setDriverContact] = useState("")

  const quantityInQuintals =
    unit === "kg" ? quantity / 100 : quantity

  const options = useMemo(
    () => getLogisticsOptions(quantityInQuintals, distanceKm),
    [quantityInQuintals, distanceKm]
  )

  const selected = options.find(
    (option) => option.id === selectedId
  )

  const selectedTransportCost =
    selected?.totalCost ?? existingTransportCost

  const updatedNetReturn =
    grossRevenue -
    selectedTransportCost -
    otherCosts

  const isValidContact =
    /^\d{10}$/.test(driverContact)

  const canSchedule =
    Boolean(selected && pickupDate && pickupTime && isValidContact)

  function selectTransport(option: LogisticsOption) {
    setSelectedId(option.id)
    setPickupScheduled(false)
    onTransportSelected?.(option.totalCost)
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-border p-2"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div>
          <p className="text-sm font-semibold text-primary">
            {t.logisticsTag}
          </p>

          <h1 className="font-serif text-3xl font-bold">
            {t.moveProduce}
          </h1>
        </div>
      </div>

      {/* Produce + route summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Produce
            </p>

            <p className="mt-1 font-bold">
              {cropName} · {quantityInQuintals} quintals
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Route
            </p>

            <p className="mt-1 flex items-center gap-1 font-bold">
              <MapPin className="size-4 text-primary" />
              {farmLocation} → {marketName} ({distanceKm} km)
            </p>
          </div>
        </div>
      </div>

      {/* Transport options */}
      <section>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t.transportOptionsTag}
          </p>

          <h2 className="mt-1 font-serif text-2xl font-bold">
            {t.chooseTransport}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {options.map((option) => {
            const isSelected = selectedId === option.id

            return (
              <button
                key={option.id}
                onClick={() => selectTransport(option)}
                className={`rounded-2xl border p-5 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">
                    {option.icon}
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="size-5 text-primary" />
                  )}
                </div>

                <h3 className="mt-4 font-bold">
                  {option.name}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Capacity: {option.capacityQuintals} q/trip
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Rate
                    </span>
                    <strong>₹{option.ratePerKm}/km</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Required trips
                    </span>
                    <strong>{option.trips}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Estimated cost
                    </span>
                    <strong>{money(option.totalCost)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Cost / quintal
                    </span>
                    <strong>
                      {money(option.costPerQuintal)}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ETA
                    </span>
                    <strong>{option.eta}</strong>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Updated return */}
      {selected && (
        <>
          <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Truck className="size-5" />

              <p className="font-bold">
                Logistics-adjusted return
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-primary-foreground/70">
                  Gross Revenue
                </p>

                <p className="mt-1 text-xl font-bold">
                  {money(grossRevenue)}
                </p>
              </div>

              <div>
                <p className="text-xs text-primary-foreground/70">
                  Transport
                </p>

                <p className="mt-1 text-xl font-bold">
                  − {money(selectedTransportCost)}
                </p>
              </div>

              <div>
                <p className="text-xs text-primary-foreground/70">
                  Net Return
                </p>

                <p className="mt-1 font-serif text-2xl font-bold text-accent">
                  {money(updatedNetReturn)}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm text-primary-foreground/80">
              Selected transport replaces the previous transport
              estimate. Cost is not deducted twice.
            </p>
          </section>

          {/* Pickup */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />

              <h2 className="font-serif text-xl font-bold">
                {t.schedulePickupTitle}
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold">
                  {t.pickupDateLabel}
                </span>

                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) =>
                    setPickupDate(e.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-input bg-background px-3"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold">
                  {t.pickupTimeLabel}
                </span>

                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) =>
                    setPickupTime(e.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-input bg-background px-3"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold">
                  Driver contact number
                </span>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={driverContact}
                    onChange={(e) =>
                      setDriverContact(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="10-digit mobile number"
                    className="h-12 w-full rounded-xl border border-input bg-background pl-9 pr-3"
                  />
                </div>

                {driverContact.length > 0 && !isValidContact && (
                  <span className="text-xs text-destructive">
                    Enter a valid 10-digit number
                  </span>
                )}
              </label>
            </div>

            <button
              disabled={!canSchedule}
              onClick={() => setPickupScheduled(true)}
              className="mt-5 flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Clock3 className="size-4" />
              {t.schedulePickupBtn}
            </button>
          </section>

          {/* Scheduled state */}
          {pickupScheduled && (
            <section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-6 text-primary" />

                <div>
                  <p className="font-bold text-primary">
                    Pickup Scheduled
                  </p>

                  <p className="mt-1 text-sm">
                    {selected.name} · {quantityInQuintals} quintals
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {farmLocation} → {marketName} · {pickupDate} at {pickupTime}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Driver contact: {driverContact}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-muted-foreground">
                    Prototype Simulation — no real vehicle has
                    been booked.
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}