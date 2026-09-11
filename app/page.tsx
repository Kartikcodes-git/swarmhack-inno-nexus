'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Home,
  MapPin,
  Menu,
  Minus,
  Package,
  Phone,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Truck,
  Users,
  WifiOff,
  X,
} from 'lucide-react'

import {
  getForecast,
  getPotentialRevenue,
  getTrendStats,
  historicalSeries,
  type ForecastDecision,
} from '@/lib/forecast'

import {
  getMultidayForecast,
  getBestSellDay,
  getSpoilagePercent,
} from '@/lib/spoilage'

import type { Market } from '@/lib/markets'
import { getMarketsForLocation } from '@/lib/markets'
import {
  getMarketRecommendations,
  type MarketRecommendation,
} from '@/lib/market-recommendation'
import {
  locations as allLocations,
  defaultLocation,
  getLocationById,
  getLocationLabel,
} from '@/lib/locations'

import {
  fetchLivePrices,
  pickDistrictModalPrice,
} from '@/lib/live-prices'

import { useLanguage, type Labels, type Language } from '@/lib/language'

import {
  BuyerMarketplace,
  ContactBuyer,
  FarmerOffers,
  GradingScreen,
  type MarketplaceView,
  type Offer,
  type QualityGrade,
} from '@/components/marketplace'

import { Logistics } from '@/components/logistics'
import { Phase4QuickAccess } from '@/components/phase4'

import { crops, type Crop } from '@/lib/crops'

type View =
  | 'dashboard'
  | 'comparison'
  | 'recommendation'
  | 'calculation'
  | 'trends'
  | 'forecast'
  | 'logistics'
  | 'transport-confirmed'
  | 'grading'
  | 'contact'
  | MarketplaceView

const money = (value: number) =>
  `₹${Math.round(value).toLocaleString('en-IN')}`

/* -------------------------------------------------------------------------- */
/* Shared UI                                                                  */
/* -------------------------------------------------------------------------- */

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Sprout className="size-5" />
      </div>

      <div>
        <p className="font-serif text-lg font-bold leading-none text-primary">
          KrishiSetu
        </p>

        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Sahi bhav. Sahi bazaar.
        </p>
      </div>
    </div>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}

function Stat({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 font-serif text-2xl font-bold text-primary">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

function RecommendationBadge({
  label,
}: {
  label: MarketRecommendation['label']
}) {
  const styles =
    label === 'BEST MARKET'
      ? 'bg-emerald-100 text-emerald-800'
      : label === 'GOOD OPTION'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-muted text-muted-foreground'

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles}`}
    >
      {label}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */

function Sidebar({
  view,
  navigate,
  t,
  role,
}: {
  view: View
  navigate: (view: View) => void
  t: Labels
  role: 'farmer' | 'buyer'
}) {
  // Farmer nav never shows Buyer Marketplace — that screen is
  // buyer-facing. Farmers reach buyer offers via "Buyer Offers".
  const farmerLinks: Array<[string, View, typeof Home]> = [
    [t.dashboard, 'dashboard', Home],
    [t.markets, 'comparison', BarChart3],
    [t.recommendation, 'recommendation', TrendingUp],
    [t.logisticsTag, 'logistics', Truck],
    [t.trends, 'trends', TrendingUp],
    [t.offers, 'offers', Package],
  ]

  // Buyer role only gets the marketplace in nav — buyer's own
  // submitted offers live inside that screen ("My Offers" button),
  // not as a separate nav item.
  const buyerLinks: Array<[string, View, typeof Home]> = [
    [t.buyerMarketplaceTag, 'marketplace', Users],
  ]

  const links = role === 'buyer' ? buyerLinks : farmerLinks

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-5 py-7 lg:block">
      <Logo />

      <nav className="mt-12 space-y-2" aria-label="Main navigation">
        {links.map(([label, target, Icon]) => (
          <button
            key={target}
            type="button"
            onClick={() => navigate(target)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${view === target
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
          >
            <Icon className="size-[18px]" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-20 rounded-2xl bg-muted p-4">
        <CircleHelp className="size-5 text-primary" />

        <p className="mt-3 text-sm font-semibold">Need a hand?</p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Your nearest CSC can help you use KrishiSetu.
        </p>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({
  onDemo,
  onMenu,
  language,
  setLanguage,
  offline,
  setOffline,
  locationLabel,
  t,
  role,
}: {
  onDemo: () => void
  onMenu: () => void
  language: Language
  setLanguage: (language: Language) => void
  offline: boolean
  setOffline: (value: boolean) => void
  locationLabel: string
  t: Labels
  role: 'farmer' | 'buyer'
}) {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:px-8">
      <button
        type="button"
        className="lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu className="size-6 text-primary" />
      </button>

      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        <MapPin className="size-4 text-primary" />

        {locationLabel}

        <span className="mx-2 text-border">|</span>

        <button
          type="button"
          onClick={() => setOffline(!offline)}
          className={`flex items-center gap-1.5 font-semibold ${offline ? 'text-red-700' : 'text-emerald-700'
            }`}
        >
          <span
            className={`size-2 rounded-full ${offline ? 'bg-red-500' : 'bg-emerald-500'
              }`}
          />

          {offline ? t.offline : 'Online'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground sm:block">
          {role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
        </span>

        <div className="hidden rounded-lg border border-border bg-card p-1 sm:flex">
          {(['English', 'मराठी', 'हिंदी'] as Language[]).map(
            (item) => (
              <button
                type="button"
                key={item}
                onClick={() => setLanguage(item)}
                className={`rounded-md px-2 py-1 text-[11px] font-bold ${language === item
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
                  }`}
              >
                {item}
              </button>
            ),
          )}
        </div>


      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Demo steps                                                                 */
/* -------------------------------------------------------------------------- */

function DemoSteps({ view }: { view: View }) {
  let current = 5

  if (view === 'dashboard') {
    current = 1
  } else if (
    view === 'comparison' ||
    view === 'calculation'
  ) {
    current = 2
  } else if (
    view === 'recommendation' ||
    view === 'trends' ||
    view === 'forecast'
  ) {
    current = 3
  } else if (
    view === 'marketplace' ||
    view === 'offers'
  ) {
    current = 4
  }

  const steps = [
    'Produce',
    'Market',
    'Decision',
    'Buyer',
    'Access',
  ]

  return (
    <div className="flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
      {steps.map((step, index) => (
        <span
          key={step}
          className={`rounded-full px-3 py-1.5 ${index + 1 <= current
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
            }`}
        >
          {index + 1}. {step}
        </span>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Login (mobile + OTP)                                                      */
/* -------------------------------------------------------------------------- */

function Login({
  role,
  onVerified,
  onFarmerName,
  onBuyerDetails,
}: {
  role: 'farmer' | 'buyer'
  onVerified: (phone: string) => void
  onFarmerName: (name: string) => void
  onBuyerDetails: (name: string, businessName: string) => void
}) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState<string | null>(null)
  const [farmerName, setLocalFarmerName] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [farmerId, setFarmerId] = useState<File | null>(null)
  const [qualityCertificate, setQualityCertificate] = useState<File | null>(null)
  const [error, setError] = useState('')

  const isValidPhone = /^\d{10}$/.test(phone)
  const isValidOtp = /^\d{4}$/.test(otp)

  const isValidFarmerDetails =
    farmerName.trim().length > 0 && farmerId !== null

  const isValidBuyerDetails =
    buyerName.trim().length > 0 && businessName.trim().length > 0

  function sendOtp() {
    if (!isValidPhone) {
      setError('Enter a valid 10-digit mobile number')
      return
    }

    if (role === 'farmer' && !isValidFarmerDetails) {
      if (!farmerName.trim()) {
        setError('Please enter your name')
      } else {
        setError('Please upload your Digital Farmer ID (Kisan Pehchan Patra)')
      }
      return
    }

    if (role === 'buyer' && !isValidBuyerDetails) {
      if (!buyerName.trim()) {
        setError('Please enter your name')
      } else {
        setError('Please enter your business or organization name')
      }
      return
    }

    setError('')

    // Demo OTP — shown on screen for the prototype.
    const generated = String(
      Math.floor(1000 + Math.random() * 9000),
    )

    setSentOtp(generated)
    setOtp('')
  }

  function verifyOtp() {
    if (otp !== sentOtp) {
      setError('Incorrect OTP. Try again.')
      return
    }

    setError('')

    if (role === 'farmer') {
      onFarmerName(farmerName.trim())
    } else {
      onBuyerDetails(buyerName.trim(), businessName.trim())
    }

    onVerified(phone)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold">
              {role === 'farmer' ? 'Farmer Login' : 'Buyer Login'}
            </h1>
          </div>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your details to continue
          </p>

          {!sentOtp ? (
            <>
              {role === 'farmer' ? (
                <label className="mt-6 block space-y-2">
                  <span className="text-sm font-semibold">
                    Farmer name <span className="text-destructive">*</span>
                  </span>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => {
                      setLocalFarmerName(e.target.value)
                      setError('')
                    }}
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-input bg-background px-3"
                  />
                </label>
              ) : (
                <>
                  <label className="mt-6 block space-y-2">
                    <span className="text-sm font-semibold">
                      Buyer name <span className="text-destructive">*</span>
                    </span>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => {
                        setBuyerName(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter your full name"
                      className="h-12 w-full rounded-xl border border-input bg-background px-3"
                    />
                  </label>

                  <label className="mt-5 block space-y-2">
                    <span className="text-sm font-semibold">
                      Business / Organization name{' '}
                      <span className="text-destructive">*</span>
                    </span>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter business or organization name"
                      className="h-12 w-full rounded-xl border border-input bg-background px-3"
                    />
                  </label>
                </>
              )}

              <label className="mt-5 block space-y-2">
                <span className="text-sm font-semibold">
                  Mobile number <span className="text-destructive">*</span>
                </span>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      setError('')
                    }}
                    placeholder="10-digit mobile number"
                    className="h-12 w-full rounded-xl border border-input bg-background pl-9 pr-3"
                  />
                </div>
              </label>

              {role === 'farmer' && (
                <>
                  <label className="mt-5 block space-y-2">
                    <span className="text-sm font-semibold">
                      Upload ID <span className="text-destructive">*</span>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Digital Farmer ID (Kisan Pehchan Patra)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        setFarmerId(e.target.files?.[0] ?? null)
                        setError('')
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-input bg-background p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                    />
                    {farmerId && (
                      <p className="text-xs text-primary">✓ {farmerId.name}</p>
                    )}
                  </label>

                  <label className="mt-5 block space-y-2">
                    <span className="text-sm font-semibold">
                      Quality Certificate
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Approved Quality Certificate of Crops — Optional
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        setQualityCertificate(e.target.files?.[0] ?? null)
                        setError('')
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-input bg-background p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                    />
                    {qualityCertificate && (
                      <p className="text-xs text-primary">
                        ✓ {qualityCertificate.name}
                      </p>
                    )}
                  </label>
                </>
              )}

              {error && (
                <p className="mt-3 text-xs text-destructive">{error}</p>
              )}

              <button
                type="button"
                onClick={sendOtp}
                disabled={
                  !isValidPhone ||
                  (role === 'farmer' ? !isValidFarmerDetails : !isValidBuyerDetails)
                }
                className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send OTP
              </button>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground">
                OTP sent to +91 {phone}.{' '}
                <span className="font-bold text-primary">
                  (demo OTP: {sentOtp})
                </span>
              </p>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold">Enter OTP</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))
                    setError('')
                  }}
                  placeholder="4-digit OTP"
                  className="h-12 w-full rounded-xl border border-input bg-background px-3 text-center text-lg tracking-[0.5em]"
                />
              </label>

              {error && (
                <p className="mt-2 text-xs text-destructive">{error}</p>
              )}

              <button
                type="button"
                disabled={!isValidOtp}
                onClick={verifyOtp}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Verify &amp; Continue
              </button>

              <button
                type="button"
                onClick={() => {
                  setSentOtp(null)
                  setOtp('')
                  setError('')
                }}
                className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground"
              >
                Change details
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Role select                                                                */
/* -------------------------------------------------------------------------- */

function RoleSelect({
  selectRole,
}: {
  selectRole: (role: 'farmer' | 'buyer') => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <Logo />

        <div>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            Welcome to KrishiSetu
          </h1>

          <p className="mt-2 text-muted-foreground">
            Tell us who you are, so we can show you the right screen.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectRole('farmer')}
            className="group rounded-3xl border-2 border-border bg-card p-7 text-left shadow-sm transition hover:border-primary"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              🌾
            </div>

            <h2 className="mt-4 font-serif text-xl font-bold">
              I&apos;m a Farmer
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Compare markets, plan logistics, and review buyer offers
              for your produce.
            </p>

            <p className="mt-4 text-sm font-bold text-primary group-hover:underline">
              Continue as Farmer →
            </p>
          </button>

          <button
            type="button"
            onClick={() => selectRole('buyer')}
            className="group rounded-3xl border-2 border-border bg-card p-7 text-left shadow-sm transition hover:border-primary"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/20 text-2xl">
              🛒
            </div>

            <h2 className="mt-4 font-serif text-xl font-bold">
              I&apos;m a Buyer
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Browse farmer listings and make offers directly on
              KrishiSetu.
            </p>

            <p className="mt-4 text-sm font-bold text-primary group-hover:underline">
              Continue as Buyer →
            </p>
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Prototype Simulation — role selection is not saved beyond
          this session.
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function Dashboard({
  crop,
  quantity,
  unit,
  locationId,
  setCrop,
  setQuantity,
  setUnit,
  setLocationId,
  compare,
  openLogistics,
  topRecommendation,
  farmerName,
  setFarmerName,
  t,
}: {
  crop: Crop
  quantity: number
  unit: string
  locationId: string
  setCrop: (crop: Crop) => void
  setQuantity: (quantity: number) => void
  setUnit: (unit: string) => void
  setLocationId: (locationId: string) => void
  compare: () => void
  openLogistics: () => void
  topRecommendation: MarketRecommendation | null
  farmerName: string
  setFarmerName: (name: string) => void
  t: Labels
}) {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-primary">
          Farmer dashboard
        </p>

        {farmerName ? (
          <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
            Namaste, {farmerName}
          </h1>
        ) : (
          <div className="mt-3 max-w-sm">
            <label className="block text-sm font-semibold">
              What&apos;s your name?

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      const value = (
                        event.target as HTMLInputElement
                      ).value.trim()

                      if (value) {
                        setFarmerName(value)
                      }
                    }
                  }}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 font-semibold outline-none"
                  aria-label="Your name"
                />

                <button
                  type="button"
                  onClick={(event) => {
                    const input =
                      (
                        event.currentTarget
                          .previousElementSibling as HTMLInputElement | null
                      )?.value.trim() ?? ''

                    if (input) {
                      setFarmerName(input)
                    }
                  }}
                  className="min-h-12 shrink-0 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
                >
                  Continue
                </button>
              </div>
            </label>
          </div>
        )}

        <p className="mt-2 text-muted-foreground">
          Let&apos;s find the best market for your produce.
        </p>
      </section>

      <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
              Find best market
            </p>

            <h2 className="mt-2 font-serif text-2xl font-bold">
              Where should you sell?
            </h2>
          </div>

          <span className="rounded-full bg-primary-foreground/10 px-3 py-1 text-xs">
            Demo estimate
          </span>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-primary-foreground/70">
              {t.crop}
            </span>

            <select
              value={crop.name}
              onChange={(event) => {
                const selected =
                  crops.find(
                    (item) => item.name === event.target.value,
                  ) ?? crops[0]

                setCrop(selected)
              }}
              className="h-12 w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 font-semibold outline-none"
            >
              {crops.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                  className="text-foreground"
                >
                  {item.icon} {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-primary-foreground/70">
              {t.quantity}
            </span>

            <div className="flex h-12 overflow-hidden rounded-xl border border-primary-foreground/20 bg-primary-foreground/10">
              <input
                type="number"
                min="0"
                max={unit === 'kg' ? 100000 : 1000}
                value={quantity}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  const capped = Math.min(
                    Number.isFinite(value) ? value : 0,
                    unit === 'kg' ? 100000 : 1000,
                  )
                  setQuantity(capped)
                }}
                className="min-w-0 flex-1 bg-transparent px-3 font-semibold outline-none"
                aria-label="Quantity"
              />

              <select
                value={unit}
                onChange={(event) =>
                  setUnit(event.target.value)
                }
                className="bg-transparent px-2 text-sm font-bold outline-none"
              >
                <option className="text-foreground">
                  quintals
                </option>

                <option className="text-foreground">
                  kg
                </option>
              </select>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-primary-foreground/70">
              {t.location}
            </span>

            <select
              value={locationId}
              onChange={(event) =>
                setLocationId(event.target.value)
              }
              className="h-12 w-full rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 font-semibold outline-none"
            >
              {allLocations.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  className="text-foreground"
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {quantity <= 0 && (
          <p className="mt-3 text-sm font-bold text-accent">
            Enter a quantity greater than 0.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={compare}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 font-bold text-accent-foreground"
          >
            Compare Markets
            <ChevronRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={openLogistics}
            className="flex min-h-12 items-center gap-2 rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-5 font-bold"
          >
            <Truck className="size-4" />
            Logistics
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={`Today's ${crop.name} Price`}
          value={
            topRecommendation
              ? `${money(topRecommendation.revenue.pricePerQuintal)}/q`
              : '—'
          }
          note="Best available market price"
        />

        <Stat
          label="Best Estimated Return"
          value={
            topRecommendation
              ? money(topRecommendation.revenue.netRevenue)
              : '—'
          }
          note="After transport & handling estimate"
        />

        <Stat
          label="Recommended Market"
          value={topRecommendation?.market.name ?? '—'}
          note="Highest net return"
        />
      </div>

      <ImpactBanner t={t} />

      <Transparency />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Impact banner                                                              */
/* -------------------------------------------------------------------------- */

function ImpactBanner({
  t,
}: {
  t: Labels
}) {
  const stats = [
    ['1,240', t.impactFarmersHelped],
    ['8.3%', t.impactReturnLift],
    ['6', t.impactMarketsCompared],
  ]

  return (
    <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-primary">
          {t.impactBannerTag}
        </p>

        <span className="rounded-full bg-accent/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          {t.impactBannerBadge}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-xl bg-card p-4">
            <p className="font-serif text-2xl font-bold text-primary">
              {value}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Transparency                                                               */
/* -------------------------------------------------------------------------- */

function Transparency() {
  const items = [
    [
      'Sample Data',
      'Demonstrates market information.',
    ],
    [
      'Cached Data',
      'Previously synchronized information for offline mode.',
    ],
    [
      'Market Forecast and Design Engine',
      'Illustrative, not guaranteed.',
    ],
    [
      'Prototype Simulation',
      'SMS, USSD and IVR flows are demos.',
    ],
  ]

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-bold text-primary">
        Data &amp; Prototype Transparency
      </p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([title, text]) => (
          <div
            key={title}
            className="rounded-xl bg-muted p-3"
          >
            <p className="font-bold">{title}</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Comparison                                                                 */
/* -------------------------------------------------------------------------- */

function Comparison({
  crop,
  quantity,
  recommendations,
  recommend,
  back,
  offline,
}: {
  crop: Crop
  quantity: number
  recommendations: MarketRecommendation[]
  recommend: (recommendation: MarketRecommendation) => void
  back: () => void
  offline: boolean
}) {
  if (quantity <= 0) {
    return <EmptyState back={back} />
  }

  const topRecommendation = recommendations[0] ?? null

  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={back}
        className="text-sm font-semibold text-primary"
      >
        ← Back to dashboard
      </button>

      <div>
        <p className="text-sm font-semibold text-primary">
          Market comparison
        </p>

        <h1 className="mt-2 font-serif text-3xl font-bold">
          Where should you sell your{' '}
          {crop.name.toLowerCase()}?
        </h1>

        <p className="mt-2 text-muted-foreground">
          Sorted by highest estimated net return for{' '}
          {quantity} quintals.
        </p>
      </div>

      {offline && <OfflineNotice />}

      <div className="grid gap-5 lg:grid-cols-3">
        {recommendations.map((recommendation, index) => (
          <MarketCard
            key={recommendation.market.id}
            recommendation={recommendation}
            recommend={recommend}
            best={index === 0}
          />
        ))}
      </div>

      {topRecommendation && (
        <SpoilageForecast
          crop={crop}
          quantity={quantity}
          topRecommendation={topRecommendation}
        />
      )}

      <p className="text-xs text-muted-foreground">
        Sample / Historical Data · All values are estimates for
        prototype demonstration.
      </p>
    </div>
  )
}

function EmptyState({ back }: { back: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center">
      <p className="font-serif text-2xl font-bold">
        No suitable market found
      </p>

      <p className="mt-2 text-muted-foreground">
        Enter a quantity greater than 0 to compare markets.
      </p>

      <button
        type="button"
        onClick={back}
        className="mt-6 min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
      >
        Try Again
      </button>
    </div>
  )
}

function TransportConfirmed({
  cropName,
  quantity,
  marketName,
  farmLocation,
  grossRevenue,
  otherCosts,
  vehicleName,
  totalCost,
  pickupDate,
  pickupTime,
  driverContact,
  done,
}: {
  cropName: string
  quantity: number
  marketName: string
  farmLocation: string
  grossRevenue: number
  otherCosts: number
  vehicleName: string
  totalCost: number
  pickupDate: string
  pickupTime: string
  driverContact: string
  done: () => void
}) {
  const netReturn = grossRevenue - totalCost - otherCosts

  return (
    <div className="space-y-7">
      <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground">
        <CheckCircle2 className="mx-auto size-10" />

        <h1 className="mt-4 font-serif text-3xl font-bold">
          Transport Confirmed
        </h1>

        <p className="mt-2 text-primary-foreground/80">
          {vehicleName} booked for {cropName} · {quantity} quintals
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Trip details
        </p>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Route" value={`${farmLocation} → ${marketName}`} />
          <Info label="Vehicle" value={vehicleName} />
          <Info label="Pickup date" value={pickupDate} />
          <Info label="Pickup time" value={pickupTime} />
          <Info label="Driver contact" value={driverContact} />
          <Info label="Transport cost" value={money(totalCost)} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Updated return
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Info label="Gross revenue" value={money(grossRevenue)} />
          <Info label="Transport + other costs" value={money(totalCost + otherCosts)} />
          <Info label="Net return" value={money(netReturn)} />
        </div>
      </section>

      <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        Prototype simulation — no real vehicle has been booked.
      </p>

      <button
        onClick={done}
        className="min-h-12 rounded-xl bg-primary px-6 font-bold text-primary-foreground"
      >
        Done
      </button>
    </div>
  )
}

function OfflineNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <WifiOff className="mt-0.5 size-5 shrink-0" />

      <div>
        <p className="font-bold">Cached Data</p>

        <p className="mt-1">
          Last synchronized: 5 Sept 2026, 4:30 PM.
          Reconnect to update market information.
        </p>
      </div>
    </div>
  )
}

function MarketCard({
  recommendation,
  recommend,
  best,
}: {
  recommendation: MarketRecommendation
  recommend: (recommendation: MarketRecommendation) => void
  best: boolean
}) {
  const { market, revenue, label } = recommendation

  return (
    <article
      className={`relative rounded-2xl border bg-card p-5 shadow-sm ${best
        ? 'border-primary ring-2 ring-primary/10'
        : 'border-border'
        }`}
    >
      {best && (
        <div className="absolute -top-3 left-5 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          Best net return
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold">
            {best && '🏆 '}
            {market.name}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {market.distanceKm} km away
          </p>

          <div className="mt-2">
            <RecommendationBadge label={label} />
          </div>
        </div>


      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
        <Info
          label="Price"
          value={`${money(revenue.pricePerQuintal)}/q`}
        />

        <Info
          label="Transport"
          value={money(revenue.transportCost)}
        />

        <Info
          label="Handling"
          value={money(revenue.handlingCost)}
        />

        <Info
          label="Net return"
          value={money(revenue.netRevenue)}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          {market.priceTrend === 'Increasing' ? (
            <TrendingUp className="size-4" />
          ) : (
            <Minus className="size-4" />
          )}

          {market.priceTrend}
        </span>

        <button
          type="button"
          onClick={() => recommend(recommendation)}
          className="text-sm font-bold text-primary"
        >
          View details →
        </button>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Spoilage & multiday forecast                                              */
/* -------------------------------------------------------------------------- */

function SpoilageForecast({
  crop,
  quantity,
  topRecommendation,
}: {
  crop: Crop
  quantity: number
  topRecommendation: MarketRecommendation
}) {
  const forecast = getForecast(crop.name)

  // forecast.ts projects midpoint change over ~7 days;
  // convert to a daily rate for the multiday model.
  const currentPrice = topRecommendation.revenue.pricePerQuintal
  const changePercent =
    currentPrice === 0
      ? 0
      : ((forecast.midpoint - currentPrice) / currentPrice) * 100
  const dailyPriceChangePercent = changePercent / 7

  const multiday = getMultidayForecast(
    crop.name,
    currentPrice,
    quantity,
    dailyPriceChangePercent,
    7,
  )

  const bestDay = getBestSellDay(multiday)
  const todaySpoilage = getSpoilagePercent(crop.name, 1)
  const day7Spoilage = getSpoilagePercent(crop.name, 7)

  const sellTodayRevenue = Math.round(currentPrice * quantity)

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Potential spoilage
          </p>

          <h2 className="mt-1 font-serif text-xl font-bold">
            Should you sell today or wait?
          </h2>
        </div>

        <span className="rounded-full border border-accent bg-accent/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          Prototype estimate
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Info
          label="Spoilage after 1 day"
          value={`${todaySpoilage}%`}
        />

        <Info
          label="Spoilage after 7 days"
          value={`${day7Spoilage}%`}
        />

        <Info
          label="Sell today revenue"
          value={money(sellTodayRevenue)}
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <th className="pb-2">Day</th>
              <th className="pb-2">Projected price/q</th>
              <th className="pb-2">Spoilage</th>
              <th className="pb-2">Sellable qty</th>
              <th className="pb-2">Effective revenue</th>
            </tr>
          </thead>

          <tbody>
            {multiday.map((point) => (
              <tr
                key={point.day}
                className={`border-t border-border ${bestDay?.day === point.day
                    ? 'bg-primary/5 font-bold text-primary'
                    : ''
                  }`}
              >
                <td className="py-2">Day {point.day}</td>
                <td className="py-2">
                  {money(point.projectedPricePerQuintal)}
                </td>
                <td className="py-2">{point.spoilagePercent}%</td>
                <td className="py-2">
                  {point.remainingQuantity} q
                </td>
                <td className="py-2">
                  {money(point.effectiveRevenue)}
                  {bestDay?.day === point.day && ' 🏆'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bestDay && (
        <p className="mt-4 text-sm font-bold text-primary">
          {bestDay.effectiveRevenue > sellTodayRevenue
            ? `Waiting until Day ${bestDay.day} nets ~${money(
                bestDay.effectiveRevenue - sellTodayRevenue,
              )} more, even after spoilage loss.`
            : 'Spoilage outweighs any price gain — selling today is the safer estimate.'}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Spoilage rate and price drift are illustrative model
        estimates, not guaranteed outcomes.
      </p>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Recommendation                                                             */
/* -------------------------------------------------------------------------- */

function Recommendation({
  recommendation,
  quantity,
  transportCost,
  calculation,
  back,
  forecast,
  logistics,
}: {
  recommendation: MarketRecommendation
  quantity: number
  transportCost: number | null
  calculation: () => void
  back: () => void
  forecast: () => void
  logistics: () => void
}) {
  const { market, revenue } = recommendation

  const actualTransport =
    transportCost ?? revenue.transportCost

  const net =
    revenue.grossRevenue -
    actualTransport -
    revenue.handlingCost -
    revenue.otherCosts

  const [priceAdjustPercent, setPriceAdjustPercent] =
    useState(0)

  const [transportAdjustAmount, setTransportAdjustAmount] =
    useState(0)

  const [quantityAdjustAmount, setQuantityAdjustAmount] =
    useState(0)

  const whatIfQuantity = Math.max(
    quantity + quantityAdjustAmount,
    0,
  )

  const whatIfPrice =
    revenue.pricePerQuintal *
    (1 + priceAdjustPercent / 100)

  const whatIfTransport = Math.max(
    actualTransport + transportAdjustAmount,
    0,
  )

  const whatIfNet =
    whatIfPrice * whatIfQuantity -
    whatIfTransport -
    revenue.handlingCost -
    revenue.otherCosts

  const whatIfChanged =
    priceAdjustPercent !== 0 ||
    transportAdjustAmount !== 0 ||
    quantityAdjustAmount !== 0

  const resetWhatIf = () => {
    setPriceAdjustPercent(0)
    setTransportAdjustAmount(0)
    setQuantityAdjustAmount(0)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={back}
        className="text-sm font-semibold text-primary"
      >
        ← Back to comparison
      </button>

      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-lg">
        <div className="bg-primary p-7 text-primary-foreground md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
            KrishiSetu recommendation
          </p>

          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">
            Sell at {market.name} Market
          </h1>

          <p className="mt-2 text-primary-foreground/75">
            Highest estimated net return after transport cost.
          </p>
        </div>

        <div className="space-y-6 p-6 md:p-10">
          <div className="grid gap-5 sm:grid-cols-3">
            <Info
              label="Expected price"
              value={`${money(revenue.pricePerQuintal)} / quintal`}
            />

            <Info
              label="Quantity"
              value={`${quantity} quintals`}
            />

            <Info
              label="Estimated transport"
              value={money(actualTransport)}
            />
          </div>

          <div className="rounded-2xl bg-muted p-5">
            <p className="text-sm font-semibold text-muted-foreground">
              Expected net return
            </p>

            <p className="mt-1 font-serif text-4xl font-bold text-primary">
              {money(net)}
            </p>
          </div>

          <div>
            <p className="font-bold">Why?</p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {recommendation.explanation} The highest price
              does not always mean highest profit.
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-primary">
                  What if things change?
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Move the sliders to see how your net return
                  reacts. Prototype estimate only.
                </p>
              </div>

              {whatIfChanged && (
                <button
                  type="button"
                  onClick={resetWhatIf}
                  className="shrink-0 text-xs font-bold text-primary underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Market price</span>
                  <span className="text-foreground">
                    {priceAdjustPercent > 0 ? '+' : ''}
                    {priceAdjustPercent}%
                  </span>
                </div>

                <input
                  type="range"
                  min={-20}
                  max={20}
                  step={1}
                  value={priceAdjustPercent}
                  onChange={(event) =>
                    setPriceAdjustPercent(
                      Number(event.target.value),
                    )
                  }
                  className="mt-2 w-full accent-primary"
                  aria-label="Adjust market price percentage"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Transport cost</span>
                  <span className="text-foreground">
                    {transportAdjustAmount > 0 ? '+' : ''}
                    {money(transportAdjustAmount)}
                  </span>
                </div>

                <input
                  type="range"
                  min={-2000}
                  max={2000}
                  step={100}
                  value={transportAdjustAmount}
                  onChange={(event) =>
                    setTransportAdjustAmount(
                      Number(event.target.value),
                    )
                  }
                  className="mt-2 w-full accent-primary"
                  aria-label="Adjust transport cost"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Quantity sold</span>
                  <span className="text-foreground">
                    {quantityAdjustAmount > 0 ? '+' : ''}
                    {quantityAdjustAmount} quintals
                  </span>
                </div>

                <input
                  type="range"
                  min={-Math.min(quantity, 50)}
                  max={50}
                  step={1}
                  value={quantityAdjustAmount}
                  onChange={(event) =>
                    setQuantityAdjustAmount(
                      Number(event.target.value),
                    )
                  }
                  className="mt-2 w-full accent-primary"
                  aria-label="Adjust quantity sold"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 rounded-xl bg-card p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Current net return
                </p>

                <p className="mt-1 font-serif text-xl font-bold">
                  {money(net)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  What-if net return
                </p>

                <p
                  className={`mt-1 font-serif text-xl font-bold ${whatIfNet >= net
                    ? 'text-emerald-700'
                    : 'text-red-700'
                    }`}
                >
                  {money(whatIfNet)}
                  {whatIfChanged && (
                    <span className="ml-2 text-xs font-bold">
                      ({whatIfNet >= net ? '+' : ''}
                      {money(whatIfNet - net)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {whatIfChanged && (
              <p className="mt-4 text-sm font-bold text-primary">
                {whatIfNet >= net
                  ? 'Still a good deal — recommendation holds: SELL.'
                  : 'Return would drop under these conditions — worth reconsidering.'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={calculation}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 font-bold text-accent-foreground"
            >
              View Calculation
              <ChevronRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={logistics}
              className="flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              <Truck className="size-4" />
              Plan Transport
            </button>

            <button
              type="button"
              onClick={forecast}
              className="min-h-12 rounded-xl border border-primary px-5 text-sm font-bold text-primary"
            >
              When should I sell?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Calculation                                                                */
/* -------------------------------------------------------------------------- */

function Calculation({
  recommendation,
  quantity,
  transportCost,
  back,
}: {
  recommendation: MarketRecommendation
  quantity: number
  transportCost: number | null
  back: () => void
}) {
  const { revenue } = recommendation

  const transport =
    transportCost ?? revenue.transportCost

  const gross = revenue.grossRevenue
  const handling = revenue.handlingCost
  const otherCosts = revenue.otherCosts
  const net = gross - transport - handling - otherCosts

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={back}
        className="text-sm font-semibold text-primary"
      >
        ← Back to recommendation
      </button>

      <div>
        <p className="text-sm font-semibold text-primary">
          Transparent calculation
        </p>

        <h1 className="mt-2 font-serif text-3xl font-bold">
          How we reached your estimate
        </h1>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-9">
        <div className="space-y-5 text-lg">
          <div className="flex justify-between gap-4">
            <span>
              {quantity} quintals × {money(revenue.pricePerQuintal)}
            </span>

            <span className="font-bold">
              = {money(gross)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Gross Revenue
          </p>

          <div className="flex justify-between border-t border-border pt-5">
            <span>− {money(transport)}</span>

            <span className="font-bold">
              Transport
            </span>
          </div>

          <div className="flex justify-between">
            <span>− {money(handling)}</span>

            <span className="font-bold">
              Handling
            </span>
          </div>

          <div className="flex justify-between">
            <span>− {money(otherCosts)}</span>

            <span className="font-bold">
              Other Estimated Costs
            </span>
          </div>

          <div className="flex justify-between border-t-2 border-primary pt-5 text-primary">
            <span className="font-bold">
              Expected Net Return
            </span>

            <span className="font-serif text-2xl font-bold">
              = {money(net)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-accent/20 p-4 text-sm text-accent-foreground">
        <strong>Note:</strong> All values shown are estimates
        for prototype demonstration.
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Trends                                                                     */
/* -------------------------------------------------------------------------- */

function Trends({
  openForecast,
  locationId,
}: {
  openForecast: () => void
  locationId: string
}) {
  const [trendCrop, setTrendCrop] =
    useState<keyof typeof historicalSeries>('Onion')

  const [trendRange, setTrendRange] =
    useState<'7 Days' | '30 Days' | '6 Months'>('7 Days')

  const [livePrice, setLivePrice] =
    useState<number | null>(null)

  const [liveStatus, setLiveStatus] =
    useState<'loading' | 'live' | 'static'>('loading')

  // Refetch whenever the crop or city changes. Falls back to the
  // static markets.ts anchor (liveStatus 'static') if the API has
  // no row for this district/commodity, or the request fails —
  // getTrendStats handles that fallback itself via locationId.
  useEffect(() => {
    let cancelled = false
    setLiveStatus('loading')

    const district = getLocationById(locationId).district

    fetchLivePrices(trendCrop, 'Maharashtra')
      .then((records) => {
        if (cancelled) return

        const price = pickDistrictModalPrice(records, district)
        setLivePrice(price)
        setLiveStatus(price != null ? 'live' : 'static')
      })
      .catch(() => {
        if (cancelled) return
        setLivePrice(null)
        setLiveStatus('static')
      })

    return () => {
      cancelled = true
    }
  }, [trendCrop, locationId])

  const stats = getTrendStats(
    trendCrop,
    trendRange,
    locationId,
    liveStatus === 'loading' ? undefined : livePrice,
  )

  const chartMin = Math.min(...stats.values)
  const chartMax = Math.max(...stats.values)
  const chartRange = Math.max(
    chartMax - chartMin,
    1,
  )

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-primary">
          Market insight
        </p>

        <h1 className="mt-2 font-serif text-3xl font-bold">
          {trendCrop} price trends
        </h1>

        <p className="mt-2 text-muted-foreground">
          Use the trend to plan when and where to sell.
        </p>
      </div>

      <div className="flex w-full gap-2 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
        {(
          Object.keys(historicalSeries) as Array<
            keyof typeof historicalSeries
          >
        ).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTrendCrop(item)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold ${trendCrop === item
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground'
              }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {trendCrop} · current price
            </p>

            <p className="mt-2 font-serif text-3xl font-bold text-primary">
              {money(stats.current)}/q
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                stats.trend === 'Increasing'
                  ? 'bg-emerald-100 text-emerald-800'
                  : stats.trend === 'Decreasing'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {stats.trend === 'Increasing'
                ? '↑ Increasing'
                : stats.trend === 'Decreasing'
                  ? '↓ Decreasing'
                  : '→ Stable'}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                liveStatus === 'live'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {liveStatus === 'loading'
                ? 'Checking live price…'
                : liveStatus === 'live'
                  ? '● Live mandi price'
                  : 'Estimated (no live data)'}
            </span>
          </div>
        </div>

        <div className="mt-8 flex h-52 items-end gap-2 border-b border-l border-border px-3 pt-4">
          {stats.values.map((value, index) => {
            const height =
              20 +
              ((value - chartMin) / chartRange) * 80

            return (
              <div
                key={`${value}-${index}`}
                className="flex h-full flex-1 items-end"
              >
                <div
                  className="w-full rounded-t-md bg-primary/70"
                  style={{
                    height: `${Math.min(
                      100,
                      Math.max(20, height),
                    )}%`,
                  }}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          <span>Earlier</span>
          <span>Today</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <Info
            label="Average"
            value={`${money(stats.average)}/q`}
          />

          <Info
            label="Highest"
            value={`${money(stats.highest)}/q`}
          />

          <Info
            label="Lowest"
            value={`${money(stats.lowest)}/q`}
          />

          <Info
            label="Trend"
            value={stats.trend}
          />
        </div>

        <div className="mt-6 flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          <TrendingUp className="size-4 shrink-0 text-primary" />

          <span>
            <strong className="text-foreground">
              Sample / Historical Data.
            </strong>{' '}
            This is not live market data.
          </span>
        </div>
      </div>

      <div className="flex w-full gap-2 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
        {(['7 Days', '30 Days', '6 Months'] as const).map(
          (item) => (
            <button
              type="button"
              key={item}
              onClick={() => setTrendRange(item)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold ${trendRange === item
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground'
                }`}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={openForecast}
        className="min-h-12 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
      >
        Open Market Forecast and Design Engine
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Forecast                                                                   */
/* -------------------------------------------------------------------------- */

function DecisionPill({
  decision,
}: {
  decision: ForecastDecision
}) {
  const styles =
    decision === 'WAIT'
      ? 'bg-amber-100 text-amber-900'
      : decision === 'SELL NOW'
        ? 'bg-emerald-100 text-emerald-900'
        : 'bg-sky-100 text-sky-900'

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles}`}
    >
      {decision}
    </span>
  )
}

function Forecast({
  crop,
  quantity,
  openTrends,
  farmerName,
  locationLabel,
}: {
  crop: Crop
  quantity: number
  openTrends: () => void
  farmerName: string
  locationLabel: string
}) {
  const forecast = getForecast(crop.name)

  const impact = getPotentialRevenue(
    forecast,
    quantity,
  )

  const [showWhy, setShowWhy] = useState(false)

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            Decision support
          </p>

          <h1 className="mt-2 font-serif text-3xl font-bold">
            Price decision
          </h1>

          <p className="mt-2 text-muted-foreground">
            {crop.name} ·{' '}
            {farmerName || 'Farmer'} · {locationLabel}
          </p>
        </div>

        <span className="rounded-full border border-accent bg-accent/20 px-3 py-1 text-xs font-bold text-accent-foreground">
          Market Forecast and Design Engine
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Stat
          label="Current Price"
          value={`${money(forecast.currentPrice)}/q`}
          note="Sample current price"
        />

        <Stat
          label="Estimated 7-Day Range"
          value={`${money(
            forecast.range[0],
          )}–${money(forecast.range[1])}`}
          note="Illustrative range"
        />

        <Stat
          label="Decision"
          value={forecast.decision}
          note="Not a guarantee"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">
              Sell Now or Wait?
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Compare current price with the prototype forecast.
            </p>
          </div>

          <DecisionPill decision={forecast.decision} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Info
            label="Current quantity"
            value={`${quantity} quintals`}
          />

          <Info
            label="Potential revenue impact"
            value={money(impact.difference)}
          />

          <Info
            label="Trend"
            value={forecast.trend}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowWhy((value) => !value)}
          className="mt-6 text-sm font-bold text-primary"
        >
          {showWhy
            ? 'Hide explanation'
            : 'Why this decision?'}
        </button>

        {showWhy && (
          <p className="mt-3 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
            {forecast.reason} This prototype forecast is
            illustrative and should not be treated as a
            guaranteed future price.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={openTrends}
        className="min-h-11 rounded-xl border border-primary px-5 text-sm font-bold text-primary"
      >
        Back to Price Trends
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Evaluator                                                                  */
/* -------------------------------------------------------------------------- */

function EvaluatorSections() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-primary p-6 text-primary-foreground md:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-primary-foreground/70">
          Product value
        </p>

        <h2 className="mt-2 font-serif text-3xl font-bold">
          One Decision, Not Just One Price
        </h2>

        <p className="mt-3 max-w-2xl leading-7 text-primary-foreground/80">
          KrishiSetu combines price, distance, transport,
          demand, trend, and buyer offers so farmers can make
          a more informed selling decision.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            'Price',
            'Distance',
            'Transport',
            'Demand',
            'Trend',
            'Buyer Offers',
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-primary-foreground/10 px-3 py-2 text-xs font-bold"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl font-bold">
          What Makes KrishiSetu Different?
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-muted p-5">
            <p className="font-bold">
              Traditional Price Information
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Market price only
            </p>
          </div>

          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
            <p className="font-bold text-primary">
              KrishiSetu
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Market price + transport cost + distance +
              demand + price trend + buyer offers + multiple
              access channels
            </p>
          </div>
        </div>

        <p className="mt-5 font-serif text-xl font-bold text-primary">
          Highest price does not always mean highest profit.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl font-bold">
          Evaluator Questions
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            [
              'What if there is no smartphone?',
              'SMS, USSD, IVR and FPO/CSC assisted access.',
            ],
            [
              'What if there is no internet?',
              'Previously synchronized information remains available as cached data.',
            ],
            [
              'Why not only show mandi prices?',
              'The highest price may not produce the highest net return after transport.',
            ],
            [
              'How is the recommendation calculated?',
              'Expected net return = gross revenue − transport cost − handling cost − other estimated costs.',
            ],
            [
              'Is the forecast guaranteed?',
              'No. It is an illustrative prototype forecast, not a promise.',
            ],
          ].map(([question, answer]) => (
            <div
              key={question}
              className="rounded-2xl border border-border p-4"
            >
              <p className="font-bold">{question}</p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl font-bold">
          KrishiSetu Architecture
        </h2>

        <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-bold">Frontend</p>

            <p className="mt-1 text-muted-foreground">
              React / Next.js
            </p>
          </div>

          <div className="rounded-2xl bg-muted p-4">
            <p className="font-bold">
              Decision Engine
            </p>

            <p className="mt-1 text-muted-foreground">
              Market comparison → net return → recommendation
            </p>
          </div>

          <div className="rounded-2xl bg-muted p-4">
            <p className="font-bold">Data Layer</p>

            <p className="mt-1 text-muted-foreground">
              Local mock market data
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-primary/40 p-4">
            <p className="font-bold text-primary">
              Future Production Integration
            </p>

            <p className="mt-1 text-muted-foreground">
              Market APIs, ML forecast, SMS/USSD, IVR, buyer
              services
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Mobile navigation                                                          */
/* -------------------------------------------------------------------------- */

function MobileNav({
  view,
  navigate,
  t,
  role,
}: {
  view: View
  navigate: (view: View) => void
  t: Labels
  role: 'farmer' | 'buyer'
}) {
  const allItems: Array<
    [string, View, typeof Home]
  > = [
      [t.dashboard, 'dashboard', Home],
      [t.markets, 'comparison', BarChart3],
      [t.logisticsTag, 'logistics', Truck],
      [t.buyerMarketplaceTag, 'marketplace', Users],
      [t.offers, 'offers', Package],
      [t.trends, 'trends', TrendingUp],
    ]

  const items =
    role === 'buyer'
      ? allItems.filter(([, target]) => target === 'marketplace')
      : allItems.filter(([, target]) => target !== 'marketplace')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-card/95 px-2 py-3 backdrop-blur lg:hidden">
      {items.map(([label, target, Icon]) => (
        <button
          type="button"
          key={target}
          onClick={() => navigate(target)}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${view === target
            ? 'text-primary'
            : 'text-muted-foreground'
            }`}
        >
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Page() {
  const [phone, setPhone] =
    useState<string | null>(null)

  const [role, setRole] =
    useState<'farmer' | 'buyer' | null>(null)

  const [view, setView] =
    useState<View>('dashboard')

  const [mobileMenu, setMobileMenu] =
    useState(false)

  const [farmerName, setFarmerName] =
    useState('')

  const [buyerName, setBuyerName] =
    useState('')

  const [buyerBusinessName, setBuyerBusinessName] =
    useState('')

  const [crop, setCrop] =
    useState<Crop>(crops[0])

  const [quantity, setQuantity] =
    useState(20)

  const [unit, setUnit] =
    useState('quintals')

  const [locationId, setLocationId] =
    useState(defaultLocation.id)

  const [selectedMarket, setSelectedMarket] =
    useState<MarketRecommendation | null>(null)

  const [offers, setOffers] =
    useState<Offer[]>([])

  const [offline, setOffline] =
    useState(false)

  const [transportCost, setTransportCost] =
    useState<number | null>(null)

  const [gradingOfferId, setGradingOfferId] =
    useState<string | null>(null)

  const [contactOfferId, setContactOfferId] =
    useState<string | null>(null)

  const [transportConfirmation, setTransportConfirmation] =
    useState<{
      vehicleName: string
      totalCost: number
      pickupDate: string
      pickupTime: string
      driverContact: string
    } | null>(null)

  const { language, setLanguage, t } = useLanguage()

  const quantityInQuintals =
    unit === 'kg'
      ? quantity / 100
      : quantity

  const recommendations = useMemo(() => {
    const localMarkets = getMarketsForLocation(locationId)

    return getMarketRecommendations(
      localMarkets,
      crop.name,
      quantityInQuintals,
    )
  }, [crop, quantityInQuintals, locationId])

  const topRecommendation = recommendations[0] ?? null

  const activeMarket = selectedMarket ?? topRecommendation

  const navigate = (next: View) => {
    // Buyers should only access buyer marketplace, grading and logistics.
    // Farmers keep the market-analysis and buyer-offer workflow.
    const buyerAllowed: View[] = ['marketplace', 'grading', 'logistics', 'transport-confirmed']
    if (role === 'buyer' && !buyerAllowed.includes(next)) {
      setView('marketplace')
    } else {
      setView(next)
    }
    setMobileMenu(false)
  }

  const demo = () => {
    setRole('farmer')
    setView('dashboard')
    setPhone('demo')
    setFarmerName('')
    setBuyerName('')
    setBuyerBusinessName('')
    setCrop(crops[0])
    setQuantity(20)
    setUnit('quintals')
    setLocationId(defaultLocation.id)
    setSelectedMarket(null)
    setOffers([])
    setLanguage('English')
    setOffline(false)
    setTransportCost(null)
    setGradingOfferId(null)
    setContactOfferId(null)
    setTransportConfirmation(null)
  }

  const goToGrading = (offerId: string) => {
    setGradingOfferId(offerId)
    setView('grading')
  }

  const gradingOffer = offers.find(
    (offer) => offer.id === gradingOfferId,
  )

  const goToContact = (offerId: string) => {
    setContactOfferId(offerId)
    setView('contact')
  }

  const contactOffer = offers.find(
    (offer) => offer.id === contactOfferId,
  )

  const submitGrading = (grade: QualityGrade, finalPrice: number) => {
    if (!gradingOfferId) {
      return
    }

    setOffers((current) =>
      current.map((offer) =>
        offer.id === gradingOfferId
          ? { ...offer, grade, finalPrice }
          : offer,
      ),
    )

    setGradingOfferId(null)
    setView('logistics')
  }

  const compare = () => {
    if (
      !Number.isFinite(quantityInQuintals) ||
      quantityInQuintals <= 0
    ) {
      return
    }

    if (!topRecommendation) {
      return
    }

    setSelectedMarket(topRecommendation)
    setTransportCost(null)
    setView('comparison')
  }

  const selectedTransport =
    transportCost ??
    activeMarket?.revenue.transportCost ??
    0

  const netReturn = activeMarket
    ? activeMarket.revenue.grossRevenue -
    selectedTransport -
    activeMarket.revenue.handlingCost -
    activeMarket.revenue.otherCosts
    : 0

  const context = {
    crop: crop.name,
    quantity: quantityInQuintals,
    location: getLocationLabel(locationId),
    market: activeMarket?.market.name ?? '',
    marketPrice: activeMarket?.revenue.pricePerQuintal ?? 0,
    netReturn,
  }

  if (!role) {
    return (
      <RoleSelect
        selectRole={(selected) => {
          setRole(selected)
        }}
      />
    )
  }

  if (!phone) {
    return (
      <Login
        role={role}
        onVerified={(verifiedPhone) => {
          setPhone(verifiedPhone)
          setView(role === 'buyer' ? 'marketplace' : 'dashboard')
        }}
        onFarmerName={setFarmerName}
        onBuyerDetails={(name, businessName) => {
          setBuyerName(name)
          setBuyerBusinessName(businessName)
        }}
      />
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        view={view}
        navigate={navigate}
        t={t}
        role={role}
      />

      {mobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setMobileMenu(false)}
        >
          <div
            className="h-full w-72 overflow-y-auto bg-card p-5"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between">
              <Logo />

              <button
                type="button"
                onClick={() =>
                  setMobileMenu(false)
                }
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="mt-10 space-y-2">
              {(role === 'buyer'
                ? [[t.buyerMarketplaceTag, 'marketplace']]
                : [
                    [t.dashboard, 'dashboard'],
                    [t.markets, 'comparison'],
                    [t.recommendation, 'recommendation'],
                    [t.logisticsTag, 'logistics'],
                    [t.trends, 'trends'],
                    [t.offers, 'offers'],
                  ]
              ).map(([label, target]) => (
                <button
                  type="button"
                  key={target}
                  onClick={() =>
                    navigate(target as View)
                  }
                  className={`block w-full rounded-xl p-3 text-left text-sm font-bold ${view === target
                    ? 'bg-primary/10 text-primary'
                    : ''
                    }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onDemo={demo}
          onMenu={() =>
            setMobileMenu(true)
          }
          language={language}
          setLanguage={setLanguage}
          offline={offline}
          setOffline={setOffline}
          locationLabel={getLocationLabel(locationId)}
          t={t}
          role={role}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-6 pb-28 md:px-8 md:py-8">
          <DemoSteps view={view} />

          {view === 'dashboard' && (
            <Dashboard
              crop={crop}
              quantity={quantity}
              unit={unit}
              locationId={locationId}
              setCrop={setCrop}
              setQuantity={setQuantity}
              setUnit={setUnit}
              setLocationId={setLocationId}
              compare={compare}
              openLogistics={() =>
                navigate('logistics')
              }
              topRecommendation={topRecommendation}
              farmerName={farmerName}
              setFarmerName={setFarmerName}
              t={t}
            />
          )}

          {view === 'comparison' && (
            <Comparison
              crop={crop}
              quantity={quantityInQuintals}
              recommendations={recommendations}
              recommend={(recommendation) => {
                setSelectedMarket(recommendation)
                setTransportCost(null)
                setView('recommendation')
              }}
              back={() =>
                setView('dashboard')
              }
              offline={offline}
            />
          )}

          {view === 'recommendation' && activeMarket && (
            <Recommendation
              recommendation={activeMarket}
              quantity={quantityInQuintals}
              transportCost={transportCost}
              calculation={() =>
                setView('calculation')
              }
              back={() =>
                setView('comparison')
              }
              forecast={() =>
                setView('forecast')
              }
              logistics={() =>
                setView('logistics')
              }
            />
          )}

          {view === 'calculation' && activeMarket && (
            <Calculation
              recommendation={activeMarket}
              quantity={quantityInQuintals}
              transportCost={transportCost}
              back={() =>
                setView('recommendation')
              }
            />
          )}

          {view === 'logistics' &&
            (activeMarket ? (
              <Logistics
                quantity={quantityInQuintals}
                unit="quintals"
                cropName={crop.name}
                marketName={activeMarket.market.name}
                distanceKm={activeMarket.market.distanceKm}
                farmLocation={getLocationLabel(locationId)}
                grossRevenue={
                  activeMarket.revenue.grossRevenue
                }
                otherCosts={
                  activeMarket.revenue.handlingCost +
                  activeMarket.revenue.otherCosts
                }
                existingTransportCost={
                  activeMarket.revenue.transportCost
                }
                onBack={() =>
                  setView(role === 'buyer' ? 'marketplace' : 'dashboard')
                }
                onConfirmTransport={(payload) => {
                  setTransportCost(payload.totalCost)
                  setTransportConfirmation(payload)
                  setView('transport-confirmed')
                }}
              />
            ) : (
              <EmptyState
                back={() => setView(role === 'buyer' ? 'marketplace' : 'dashboard')}
              />
            ))}

          {view === 'transport-confirmed' &&
            activeMarket &&
            transportConfirmation && (
              <TransportConfirmed
                cropName={crop.name}
                quantity={quantityInQuintals}
                marketName={activeMarket.market.name}
                farmLocation={getLocationLabel(locationId)}
                grossRevenue={activeMarket.revenue.grossRevenue}
                otherCosts={
                  activeMarket.revenue.handlingCost +
                  activeMarket.revenue.otherCosts
                }
                vehicleName={transportConfirmation.vehicleName}
                totalCost={transportConfirmation.totalCost}
                pickupDate={transportConfirmation.pickupDate}
                pickupTime={transportConfirmation.pickupTime}
                driverContact={transportConfirmation.driverContact}
                done={() => setView(role === 'buyer' ? 'marketplace' : 'dashboard')}
              />
            )}

          {view === 'trends' && (
            <Trends
              locationId={locationId}
              openForecast={() =>
                setView('forecast')
              }
            />
          )}

          {view === 'forecast' && (
            <Forecast
              crop={crop}
              quantity={quantityInQuintals}
              openTrends={() =>
                setView('trends')
              }
              farmerName={farmerName}
              locationLabel={getLocationLabel(locationId)}
            />
          )}

          {view === 'marketplace' && (
            <BuyerMarketplace
              offers={offers}
              context={context}
              setOffers={setOffers}
              goToGrading={goToGrading}
              goToLogistics={() => setView('logistics')}
            />
          )}

          {view === 'offers' && (
            <FarmerOffers
              offers={offers}
              setOffers={setOffers}
              openMarketplace={() =>
                setView('marketplace')
              }
              context={context}
              goToLogistics={() =>
                setView('logistics')
              }
              goToContact={goToContact}
            />
          )}

          {view === 'contact' &&
            (contactOffer ? (
              <ContactBuyer
                offer={contactOffer}
                back={() => setView('offers')}
                goToLogistics={() => setView('logistics')}
              />
            ) : (
              <EmptyState
                back={() => setView('offers')}
              />
            ))}

          {view === 'grading' &&
            (gradingOffer ? (
              <GradingScreen
                offer={gradingOffer}
                back={() => setView(role === 'buyer' ? 'marketplace' : 'offers')}
                submit={submitGrading}
              />
            ) : (
              <EmptyState
                back={() => setView('offers')}
              />
            ))}

          {view === 'dashboard' && <EvaluatorSections />}
        </main>

        <MobileNav
          view={view}
          navigate={navigate}
          t={t}
          role={role}
        />
      </div>

      <Phase4QuickAccess />
    </div>
  )
}