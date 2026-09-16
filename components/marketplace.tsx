'use client'

import { useMemo, useState } from 'react'
import { Check, MapPin, Phone, X } from 'lucide-react'
import { useLanguage } from '@/lib/language'
import { crops } from '@/lib/crops'
import { locations } from '@/lib/locations'

export type MarketplaceView = 'marketplace' | 'offers'

type Listing = {
  id: string
  crop: string
  icon: string
  farmer: string
  location: string
  quantity: number
  price: number
  date: string
  quality: string
}

type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

// DB enum values are lowercase; badges still show the capitalized
// word to the user.
const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  completed: 'Completed',
}

export type QualityGrade = 'A' | 'B' | 'C'

export type Offer = {
  id: string
  buyer: string
  crop: string
  quantity: number
  price: number
  expected: number
  location: string
  status: OfferStatus
  // set when the farmer has sent a counter-price back to the buyer
  counterPrice?: number
  // set by the buyer on the dedicated grading screen, after accept
  grade?: QualityGrade
  finalPrice?: number
}

const listings: Listing[] = [
  {
    id: 'ramesh-onion',
    crop: 'Onion',
    icon: '🧅',
    farmer: 'Ramesh Patil',
    location: 'Nashik, Maharashtra',
    quantity: 20,
    price: 2650,
    date: '5 Sept 2026',
    quality: 'Grade A',
  },
  {
    id: 'onion-35',
    crop: 'Onion',
    icon: '🧅',
    farmer: 'Suresh Jadhav',
    location: 'Nashik',
    quantity: 35,
    price: 2600,
    date: '6 Sept 2026',
    quality: 'Grade A',
  },
  {
    id: 'tomato-15',
    crop: 'Tomato',
    icon: '🍅',
    farmer: 'Meena Shinde',
    location: 'Pune',
    quantity: 15,
    price: 2200,
    date: '5 Sept 2026',
    quality: 'Grade A',
  },
  {
    id: 'soybean-30',
    crop: 'Soybean',
    icon: '🌱',
    farmer: 'Vilas Pawar',
    location: 'Ahilyanagar',
    quantity: 30,
    price: 4700,
    date: '7 Sept 2026',
    quality: 'Grade A',
  },
]

const buyers = [
  { name: 'ABC Foods', location: 'Nashik', crops: 'Onion, Tomato', quantity: '10–100 quintals' },
  { name: 'FreshMart', location: 'Pune', crops: 'Onion, Potato', quantity: '20–80 quintals' },
  { name: 'AgroTrade', location: 'Nashik', crops: 'Onion, Soybean', quantity: '15–60 quintals' },
]

const money = (value: number) =>
  `₹${Math.round(value).toLocaleString('en-IN')}`

function Badge({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'muted' | 'green' | 'amber' | 'red'
}) {
  const colors = {
    muted: 'bg-muted text-muted-foreground',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-900',
    red: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${colors[tone]}`}
    >
      {children}
    </span>
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

/* -------------------------------------------------------------------------- */
/* Offer modal (buyer makes an offer)                                        */
/* -------------------------------------------------------------------------- */

function OfferModal({
  listing,
  close,
  submit,
}: {
  listing: Listing
  close: () => void
  submit: (offer: Offer) => void
}) {
  const [buyerName, setBuyerName] = useState('ABC Foods')
  const [price, setPrice] = useState(2700)
  const [quantity, setQuantity] = useState(listing.quantity)
  const [message, setMessage] = useState(
    'Interested in purchasing the full quantity.',
  )
  const [error, setError] = useState('')

  const onSubmit = () => {
    if (price <= 0) {
      return setError('Offer price must be greater than 0.')
    }

    if (quantity <= 0) {
      return setError('Quantity must be greater than 0.')
    }

    if (quantity > listing.quantity) {
      return setError(
        `Offer quantity cannot exceed ${listing.quantity} quintals.`,
      )
    }

    submit({
      id: `offer-${Date.now()}`,
      buyer: buyerName,
      crop: listing.crop,
      quantity,
      price,
      expected: listing.price,
      location: listing.location,
      status: 'pending',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <Badge>Prototype Offer</Badge>
            <h2 className="mt-3 font-serif text-2xl font-bold">
              Make an offer
            </h2>
          </div>

          <button
            onClick={close}
            aria-label="Close offer dialog"
            className="rounded-full p-2 hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-muted p-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Produce</p>
            <p className="mt-1 font-bold">
              {listing.icon} {listing.crop}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="mt-1 font-bold">
              {listing.quantity} quintals
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Farmer expected
            </p>
            <p className="mt-1 font-bold">
              {money(listing.price)}/q
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-semibold">
            Buyer / company name
            <select
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            >
              {buyers.map((buyer) => (
                <option key={buyer.name} value={buyer.name}>
                  {buyer.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Offer price
            <input
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3"
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Quantity (quintals)
            <input
              className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3"
              type="number"
              min="1"
              max={listing.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>

          <label className="block text-sm font-semibold">
            Message
            <textarea
              className="mt-2 min-h-20 w-full rounded-xl border border-input bg-background p-3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={onSubmit}
            className="min-h-12 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground"
          >
            Submit Offer
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Listing card                                                              */
/* -------------------------------------------------------------------------- */

function ListingCard({
  listing,
  open,
}: {
  listing: Listing
  open: (listing: Listing) => void
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl">{listing.icon}</p>
          <h3 className="mt-2 font-serif text-xl font-bold">
            {listing.crop}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {listing.farmer}
          </p>
        </div>

        <Badge tone="green">{listing.quality}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="mt-1 font-semibold">{listing.location}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Quantity</p>
          <p className="mt-1 font-semibold">
            {listing.quantity} quintals
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Expected price
          </p>
          <p className="mt-1 font-bold text-primary">
            {money(listing.price)}/q
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Available</p>
          <p className="mt-1 font-semibold">{listing.date}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => open(listing)}
          className="min-h-11 flex-1 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground"
        >
          Make Offer
        </button>

        <button
          onClick={() => open(listing)}
          className="min-h-11 rounded-xl border border-border px-3 text-sm font-bold text-primary"
        >
          View Listing
        </button>
      </div>
    </article>
  )
}

function BuyerCards() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-primary">
          Prototype buyers
        </p>

        <h2 className="mt-1 font-serif text-2xl font-bold">
          Trusted by transparency
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {buyers.map((buyer) => (
          <article
            key={buyer.name}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-lg font-bold">
                {buyer.name}
              </h3>

              <Badge>Prototype Buyer</Badge>
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              {buyer.location}
            </p>

            <p className="mt-4 text-xs text-muted-foreground">
              Interested in
            </p>
            <p className="mt-1 text-sm font-semibold">
              {buyer.crops}
            </p>

            <p className="mt-3 text-xs text-muted-foreground">
              Typical quantity
            </p>
            <p className="mt-1 text-sm font-semibold">
              {buyer.quantity}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Buyer marketplace                                                          */
/* -------------------------------------------------------------------------- */

export function BuyerMarketplace({
  offers,
  context,
  setOffers,
  goToGrading,
  goToLogistics,
}: {
  offers: Offer[]
  context: {
    crop: string
    quantity: number
    location: string
    market: string
    marketPrice: number
    netReturn: number
  }
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>
  goToGrading: (offerId: string) => void
  goToLogistics: () => void
}) {
  const { t } = useLanguage()

  const [cropFilter, setCropFilter] = useState('All crops')
  const [locationFilter, setLocationFilter] = useState('All locations')
  const [minPrice, setMinPrice] = useState('')
  const [selected, setSelected] = useState<Listing | null>(null)
  const [submitted, setSubmitted] = useState<Offer | null>(null)
  const [showMyOffers, setShowMyOffers] = useState(false)

  const filtered = useMemo(
    () =>
      listings.filter(
        (item) =>
          (cropFilter === 'All crops' || item.crop === cropFilter) &&
          (locationFilter === 'All locations' ||
            item.location === locationFilter) &&
          (!minPrice || item.price >= Number(minPrice)),
      ),
    [cropFilter, locationFilter, minPrice],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            {t.buyerMarketplaceTag}
          </p>

          <h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
            {t.findBuyers}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {t.findBuyersSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowMyOffers((v) => !v)}
          className="min-h-11 rounded-xl border border-primary px-4 text-sm font-bold text-primary"
        >
          {showMyOffers ? t.findBuyers : t.myOffers}
        </button>
      </div>

      {showMyOffers ? (
        <BuyerOfferStatusList
          offers={offers}
          setOffers={setOffers}
          goToGrading={goToGrading}
          goToLogistics={goToLogistics}
        />
      ) : (
        <>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold text-muted-foreground">
            {t.filterCrop}
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option>All crops</option>
              {crops.map((crop) => (
                <option key={crop.name}>{crop.name}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-muted-foreground">
            {t.filterLocation}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
            >
              <option>All locations</option>
              {locations.map((location) => (
                <option key={location.id}>{location.name}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-muted-foreground">
            {t.minPrice}
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="₹ / quintal"
              type="number"
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>
      </section>

      {submitted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 size-5" />

            <div>
              <h2 className="font-serif text-xl font-bold">
                {t.offerSubmittedTitle}
              </h2>

              <p className="mt-1 text-sm">
                {submitted.buyer} · {money(submitted.price)}/q ·{' '}
                {submitted.quantity} quintals
              </p>

              <p className="mt-2 text-sm font-semibold">
                {t.pendingFarmerResponse}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            open={setSelected}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No listings match this crop/location combination yet in the
          prototype dataset.
        </p>
      )}

      <BuyerCards />

      <section className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
        <p className="font-bold text-foreground">Transparent offers</p>

        <p className="mt-1">
          You can always see the buyer name, offer price, quantity,
          location, and status. All listings and buyers are sample
          data for this prototype.
        </p>
      </section>
        </>
      )}

      {selected && (
        <OfferModal
          listing={selected}
          close={() => setSelected(null)}
          submit={(offer) => {
            // Buyer offer now joins the SAME shared offers list the
            // farmer sees — no longer a dead-end banner. It renders
            // through the exact same OfferCard as any other offer.
            setOffers((current) => [...current, offer])
            setSubmitted(offer)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Buyer's own offer status list (read-only — no accept/reject/negotiate)    */
/* -------------------------------------------------------------------------- */

function BuyerOfferStatusList({
  offers,
  setOffers,
  goToGrading,
  goToLogistics,
}: {
  offers: Offer[]
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>
  goToGrading: (offerId: string) => void
  goToLogistics: () => void
}) {
  const { t } = useLanguage()

  const gradeLabels: Record<QualityGrade, string> = {
    A: t.gradeALabel,
    B: t.gradeBLabel,
    C: t.gradeCLabel,
  }

  const acceptCounter = (offer: Offer) =>
    setOffers((current) =>
      current.map((item) =>
        item.id === offer.id
          ? { ...item, price: offer.counterPrice ?? item.price, status: 'accepted' }
          : item,
      ),
    )

  const rejectCounter = (offerId: string) =>
    setOffers((current) =>
      current.map((item) =>
        item.id === offerId ? { ...item, status: 'rejected' } : item,
      ),
    )

  if (offers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        You haven't submitted any offers yet in this prototype
        session.
      </p>
    )
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {offers.map((offer) => {
        const hasCounter =
          offer.counterPrice != null && offer.status === 'pending'

        return (
          <div
            key={offer.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                {offer.crop}
              </h3>

              <Badge
                tone={
                  offer.status === 'accepted'
                    ? 'green'
                    : offer.status === 'rejected'
                      ? 'red'
                      : offer.status === 'completed'
                        ? 'muted'
                        : 'amber'
                }
              >
                {OFFER_STATUS_LABEL[offer.status]}
              </Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {offer.quantity} quintals · {money(offer.price)}/q
            </p>

            {hasCounter && (
              <div className="mt-3 space-y-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold">
                  Farmer countered: {money(offer.counterPrice as number)}/q
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => acceptCounter(offer)}
                    className="min-h-9 flex-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
                  >
                    Accept Counter
                  </button>

                  <button
                    onClick={() => rejectCounter(offer.id)}
                    className="min-h-9 flex-1 rounded-lg border border-destructive px-3 text-xs font-bold text-destructive"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {offer.status === 'accepted' && !offer.grade && (
              <div className="mt-3 space-y-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
                <p className="font-bold">
                  Accepted — grade the produce and set the final
                  price.
                </p>

                <button
                  onClick={() => goToGrading(offer.id)}
                  className="min-h-9 w-full rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
                >
                  {t.gradeSetPriceBtn}
                </button>
              </div>
            )}

            {offer.status === 'accepted' && offer.grade && (
              <div className="mt-3 space-y-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
                <p className="font-bold">
                  Graded {gradeLabels[offer.grade]} · Final price{' '}
                  {money(offer.finalPrice ?? offer.price)}/q
                </p>

                <button
                  onClick={goToLogistics}
                  className="min-h-9 w-full rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
                >
                  {t.planTransportBtn}
                </button>
              </div>
            )}

            {offer.status === 'rejected' && (
              <p className="mt-3 text-xs font-semibold text-red-700">
                This offer was rejected.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Negotiate modal (farmer counters buyer's price)                           */
/* -------------------------------------------------------------------------- */

function NegotiateModal({
  offer,
  close,
  sendCounter,
}: {
  offer: Offer
  close: () => void
  sendCounter: (counterPrice: number) => void
}) {
  const [counterPrice, setCounterPrice] = useState(
    Math.round((offer.price + offer.expected) / 2),
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <Badge tone="amber">Negotiate</Badge>
            <h2 className="mt-3 font-serif text-2xl font-bold">
              Send a counter-offer
            </h2>
          </div>

          <button
            onClick={close}
            aria-label="Close negotiate dialog"
            className="rounded-full p-2 hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-muted p-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Buyer offer</p>
            <p className="mt-1 font-bold">{money(offer.price)}/q</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Your expected price
            </p>
            <p className="mt-1 font-bold">{money(offer.expected)}/q</p>
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold">
          Your counter price (₹/quintal)
          <input
            className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3"
            type="number"
            min="1"
            value={counterPrice}
            onChange={(e) => setCounterPrice(Number(e.target.value))}
          />
        </label>

        <button
          onClick={() => sendCounter(counterPrice)}
          className="mt-5 min-h-12 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground"
        >
          Send Counter-Offer
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Grading screen (buyer grades quality + sets final price, post-accept)     */
/* -------------------------------------------------------------------------- */

export function GradingScreen({
  offer,
  back,
  submit,
}: {
  offer: Offer
  back: () => void
  submit: (grade: QualityGrade, finalPrice: number) => void
}) {
  const { t } = useLanguage()
  const [grade, setGrade] = useState<QualityGrade>('A')
  const [finalPrice, setFinalPrice] = useState(offer.price)
  const [error, setError] = useState('')

  const gradeLabels: Record<QualityGrade, { label: string; note: string }> = {
    A: { label: t.gradeALabel, note: t.gradeANote },
    B: { label: t.gradeBLabel, note: t.gradeBNote },
    C: { label: t.gradeCLabel, note: t.gradeCNote },
  }

  const onSubmit = () => {
    if (finalPrice <= 0) {
      return setError('Final price must be greater than 0.')
    }

    submit(grade, finalPrice)
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <button
          onClick={back}
          className="rounded-xl border border-border p-2"
          aria-label="Back"
        >
          <X className="size-5" />
        </button>

        <div>
          <p className="text-sm font-semibold text-primary">
            {t.gradingTag}
          </p>

          <h1 className="font-serif text-3xl font-bold">
            {t.gradeThisProduce}
          </h1>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Buyer" value={offer.buyer} />
          <Info label="Crop" value={offer.crop} />
          <Info
            label="Quantity"
            value={`${offer.quantity} quintals`}
          />
          <Info
            label="Accepted price"
            value={`${money(offer.price)}/q`}
          />
        </div>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t.assignGrade}
        </p>

        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {(Object.keys(gradeLabels) as QualityGrade[]).map((key) => {
            const isSelected = grade === key

            return (
              <button
                key={key}
                onClick={() => setGrade(key)}
                className={`rounded-2xl border p-5 text-left transition ${isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40'
                  }`}
              >
                <h3 className="font-bold">{gradeLabels[key].label}</h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  {gradeLabels[key].note}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <label className="block text-sm font-semibold">
          {t.finalPriceLabel}
          <input
            className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3"
            type="number"
            min="1"
            value={finalPrice}
            onChange={(e) => setFinalPrice(Number(e.target.value))}
          />
        </label>

        <p className="mt-2 text-sm text-muted-foreground">
          {t.totalAtPricePrefix} {money(finalPrice * offer.quantity)}
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={onSubmit}
          className="mt-5 min-h-12 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground"
        >
          {t.finalizeGradingBtn}
        </button>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Buyer contact                                                             */
/* -------------------------------------------------------------------------- */

type BuyerContact = {
  phone: string
  email: string
  address: string
}

const BUYER_CONTACTS: Record<string, BuyerContact> = {
  'ABC Foods': {
    phone: '+91 98200 11223',
    email: 'procurement@abcfoods.example',
    address: 'Plot 14, MIDC, Nashik, Maharashtra',
  },
  FreshMart: {
    phone: '+91 90210 44556',
    email: 'buying@freshmart.example',
    address: 'Warehouse 7, Market Yard, Pune, Maharashtra',
  },
  AgroTrade: {
    phone: '+91 87650 99887',
    email: 'sourcing@agrotrade.example',
    address: 'Gate 2, APMC Complex, Sambhajinagar, Maharashtra',
  },
}

const DEFAULT_BUYER_CONTACT: BuyerContact = {
  phone: '+91 90000 00000',
  email: 'contact@buyer.example',
  address: 'Registered on KrishiSetu marketplace',
}

function getBuyerContact(buyerName: string): BuyerContact {
  return BUYER_CONTACTS[buyerName] ?? DEFAULT_BUYER_CONTACT
}

export function ContactBuyer({
  offer,
  back,
  goToLogistics,
}: {
  offer: Offer
  back: () => void
  goToLogistics: () => void
}) {
  const contact = getBuyerContact(offer.buyer)

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <button
          onClick={back}
          className="rounded-xl border border-border p-2"
          aria-label="Back"
        >
          <X className="size-5" />
        </button>

        <div>
          <p className="text-sm font-semibold text-primary">
            Buyer contact
          </p>

          <h1 className="font-serif text-3xl font-bold">
            {offer.buyer}
          </h1>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Crop" value={offer.crop} />
          <Info
            label="Quantity"
            value={`${offer.quantity} quintals`}
          />
          <Info
            label="Agreed price"
            value={`${money(offer.finalPrice ?? offer.price)}/q`}
          />
          <Info
            label="Total value"
            value={money(
              (offer.finalPrice ?? offer.price) * offer.quantity,
            )}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Contact details
        </p>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="size-5 text-primary" />
            <span className="font-bold">{contact.phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex size-5 items-center justify-center text-primary">
              @
            </span>
            <span>{contact.email}</span>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="size-5 text-primary" />
            <span>{contact.address}</span>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          Prototype contact details — no real buyer is reachable at
          this number.
        </p>
      </section>

      <button
        onClick={goToLogistics}
        className="min-h-12 w-full rounded-xl bg-primary px-5 font-bold text-primary-foreground sm:w-auto"
      >
        Plan Transport
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Offer card                                                                */
/* -------------------------------------------------------------------------- */

function OfferCard({
  offer,
  accept,
  reject,
  openNegotiate,
  goToLogistics,
  goToGrading,
  goToContact,
}: {
  offer: Offer
  accept: () => void
  reject: () => void
  openNegotiate: () => void
  goToLogistics: () => void
  goToGrading: () => void
  goToContact: () => void
}) {
  const { t } = useLanguage()

  const gradeLabels: Record<QualityGrade, string> = {
    A: t.gradeALabel,
    B: t.gradeBLabel,
    C: t.gradeCLabel,
  }
  const tone =
    offer.status === 'accepted'
      ? 'green'
      : offer.status === 'rejected'
        ? 'red'
        : offer.status === 'completed'
          ? 'muted'
          : 'amber'

  const diff = offer.price - offer.expected

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold">
            {offer.buyer}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Prototype Buyer · {offer.location}
          </p>
        </div>

        <Badge tone={tone}>{OFFER_STATUS_LABEL[offer.status]}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
        <Info label="Crop" value={offer.crop} />
        <Info
          label="Quantity"
          value={`${offer.quantity} quintals`}
        />
        <Info label="Offer" value={`${money(offer.price)}/q`} />
        <Info
          label="Expected"
          value={`${money(offer.expected)}/q`}
        />
        <Info
          label="Difference"
          value={`${diff >= 0 ? '+' : '-'}${money(
            Math.abs(diff),
          )}/q`}
        />
        <Info
          label="Total offer value"
          value={money(offer.price * offer.quantity)}
        />
      </div>

      {offer.counterPrice != null && offer.status === 'pending' && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">
            Counter-offer sent: {money(offer.counterPrice)}/q
          </p>

          <p className="mt-1">
            Waiting for the buyer to respond. This is a prototype —
            no real message is sent to a buyer.
          </p>
        </div>
      )}

      {offer.status === 'accepted' && !offer.grade && (
        <div className="mt-4 space-y-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <div>
            <p className="font-bold">{t.offerAcceptedTitle}</p>

            <p className="mt-1">
              {t.offerAcceptedGradeNote}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={goToGrading}
              className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              {t.gradeSetPriceBtn}
            </button>

            <button
              onClick={goToContact}
              className="min-h-11 flex-1 rounded-xl border border-primary px-4 text-sm font-bold text-primary"
            >
              Contact Buyer
            </button>
          </div>
        </div>
      )}

      {offer.status === 'accepted' && offer.grade && (
        <div className="mt-4 space-y-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="flex items-center justify-between">
            <p className="font-bold">
              {gradeLabels[offer.grade]}
            </p>

            <p className="font-bold">
              {money(offer.finalPrice ?? offer.price)}/q
            </p>
          </div>

          <p>
            {t.gradedByBuyerNote}
          </p>

          <div className="flex gap-2">
            <button
              onClick={goToLogistics}
              className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              {t.planTransportBtn}
            </button>

            <button
              onClick={goToContact}
              className="min-h-11 flex-1 rounded-xl border border-primary px-4 text-sm font-bold text-primary"
            >
              Contact Buyer
            </button>
          </div>
        </div>
      )}

      {offer.status === 'rejected' && (
        <p className="mt-4 text-sm font-semibold text-red-700">
          Offer rejected. You can continue viewing other offers.
        </p>
      )}

      {offer.status === 'completed' && (
        <p className="mt-4 text-sm font-semibold text-muted-foreground">
          Sale completed — transport confirmed and pickup arranged.
        </p>
      )}

      {offer.status === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={accept}
            className="min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Accept
          </button>

          <button
            onClick={openNegotiate}
            className="min-h-11 flex-1 rounded-xl border border-accent px-4 text-sm font-bold text-accent-foreground"
          >
            Negotiate
          </button>

          <button
            onClick={reject}
            className="min-h-11 flex-1 rounded-xl border border-destructive px-4 text-sm font-bold text-destructive"
          >
            Reject
          </button>
        </div>
      )}
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Farmer offers                                                             */
/* -------------------------------------------------------------------------- */

export function FarmerOffers({
  offers,
  setOffers,
  openMarketplace,
  context,
  goToLogistics,
  goToGrading,
  goToContact,
}: {
  offers: Offer[]
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>
  openMarketplace: () => void
  context: {
    crop: string
    quantity: number
    location: string
    market: string
    marketPrice: number
    netReturn: number
  }
  goToLogistics: (offerId: string) => void
  goToGrading: (offerId: string) => void
  goToContact: (offerId: string) => void
}) {
  const { t } = useLanguage()

  // Demo buyers shown until real offers come in from BuyerMarketplace.
  // Each gets its own OfferCard (accept/negotiate/reject) — not just a
  // read-only comparison row — so any of the three can be acted on.
  const defaultOffers: Offer[] = [
    {
      id: 'demo-abc-foods',
      buyer: 'ABC Foods',
      crop: context.crop,
      quantity: context.quantity,
      price: 2700,
      expected: context.marketPrice,
      location: context.location,
      status: 'pending',
    },
    {
      id: 'demo-freshmart',
      buyer: 'FreshMart',
      crop: context.crop,
      quantity: context.quantity,
      price: 2650,
      expected: context.marketPrice,
      location: context.location,
      status: 'pending',
    },
    {
      id: 'demo-agrotrade',
      buyer: 'AgroTrade',
      crop: context.crop,
      quantity: 15,
      price: 2750,
      expected: context.marketPrice,
      location: context.location,
      status: 'pending',
    },
  ]

  // Buyer-submitted offers (from BuyerMarketplace) and the demo
  // fallback both render through the exact same OfferCard.
  const shown = offers.length ? offers : defaultOffers

  const [negotiatingId, setNegotiatingId] = useState<string | null>(
    null,
  )

  // Seed the FULL demo set on first action, not just the one offer
  // acted on — otherwise accepting/negotiating one demo buyer would
  // wipe the other two off the screen.
  const update = (id: string, status: OfferStatus) =>
    setOffers((current) =>
      (current.length ? current : defaultOffers).map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    )

  const sendCounter = (id: string, counterPrice: number) =>
    setOffers((current) =>
      (current.length ? current : defaultOffers).map((item) =>
        item.id === id ? { ...item, counterPrice } : item,
      ),
    )

  const negotiatingOffer = shown.find(
    (offer) => offer.id === negotiatingId,
  )

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            {t.farmerDecisionsTag}
          </p>

          <h1 className="mt-2 font-serif text-3xl font-bold">
            {t.buyerOffersTitle}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {t.buyerOffersSubtitle}
          </p>
        </div>

        <button
          onClick={openMarketplace}
          className="min-h-11 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"
        >
          {t.findMoreBuyers}
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-bold">{t.currentContextTitle}</p>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
          <Info label="Crop" value={context.crop} />
          <Info
            label="Quantity"
            value={`${context.quantity} quintals`}
          />
          <Info label="Best market" value={context.market} />
          <Info
            label="Market price"
            value={`${money(context.marketPrice)}/q`}
          />
          <Info
            label="Expected net return"
            value={money(context.netReturn)}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {shown.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            accept={() => update(offer.id, 'accepted')}
            reject={() => update(offer.id, 'rejected')}
            openNegotiate={() => setNegotiatingId(offer.id)}
            goToLogistics={() => goToLogistics(offer.id)}
            goToGrading={() => goToGrading(offer.id)}
            goToContact={() => goToContact(offer.id)}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-serif text-xl font-bold">
          {t.offerComparisonTitle}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { buyer: 'ABC Foods', price: 2700, quantity: context.quantity },
            { buyer: 'FreshMart', price: 2650, quantity: context.quantity },
            { buyer: 'AgroTrade', price: 2750, quantity: 15 },
          ].map((item, index) => (
            <div
              key={item.buyer}
              className={`rounded-xl p-4 ${index === 0 ? 'bg-accent/20 ring-1 ring-accent' : 'bg-muted'
                }`}
            >
              <div className="flex justify-between gap-2">
                <p className="font-bold">{item.buyer}</p>
                {index === 0 && <Badge>Best offer</Badge>}
              </div>

              <p className="mt-3 font-serif text-xl font-bold text-primary">
                {money(item.price)}/q
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.quantity} q ·{' '}
                {money(item.price * item.quantity)} total
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Price is only one factor. Consider quantity, location,
          buyer information, and status before deciding.
        </p>
      </section>

      {negotiatingOffer && (
        <NegotiateModal
          offer={negotiatingOffer}
          close={() => setNegotiatingId(null)}
          sendCounter={(counterPrice) => {
            sendCounter(negotiatingOffer.id, counterPrice)
            setNegotiatingId(null)
          }}
        />
      )}
    </div>
  )
}

export function useMarketplaceOffers() {
  return useState<Offer[]>([])
}

export { listings }