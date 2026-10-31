'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { IconBuildingStore, IconCash, IconCheck, IconPlus, IconTrash, IconTruckDelivery } from '@tabler/icons-react'
import { Card } from '@bitvora/ui/src/Card'
import { Button } from '@bitvora/ui/src/Button'
import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { Textarea } from '@bitvora/ui/src/Textarea'
import { saveDeliverySettings, type DeliverySettingsInput } from './actions'

type ZoneRow = { key: number; area: string; fee: string }

let nextKey = 0
const withKeys = (zones: { area: string; fee: string }[]): ZoneRow[] =>
  zones.map((z) => ({ ...z, key: nextKey++ }))

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
  icon: React.ComponentType<{ className?: string; stroke?: number }>
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-ink/50" stroke={1.75} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-ink/50 mt-0.5">{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-600 ${
          checked ? 'bg-indigo-600' : 'bg-sand-200 dark:bg-sand-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </label>
  )
}

export function DeliverySettingsForm({
  storeId,
  hasBankDetails,
  initial,
}: {
  storeId: string
  hasBankDetails: boolean
  initial: Omit<DeliverySettingsInput, 'zones'> & { zones: { area: string; fee: string }[] }
}) {
  const [pickupEnabled, setPickupEnabled] = useState(initial.pickupEnabled)
  const [pickupAddress, setPickupAddress] = useState(initial.pickupAddress)
  const [deliveryNote, setDeliveryNote] = useState(initial.deliveryNote)
  const [freeDeliveryMin, setFreeDeliveryMin] = useState(initial.freeDeliveryMin)
  const [payOnDeliveryEnabled, setPayOnDeliveryEnabled] = useState(initial.payOnDeliveryEnabled)
  const [zones, setZones] = useState<ZoneRow[]>(() => withKeys(initial.zones))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function markDirty() {
    setSaved(false)
    setError(null)
  }

  function updateZone(key: number, patch: Partial<ZoneRow>) {
    markDirty()
    setZones((prev) => prev.map((z) => (z.key === key ? { ...z, ...patch } : z)))
  }

  function addZone() {
    markDirty()
    setZones((prev) => [...prev, { key: nextKey++, area: '', fee: '' }])
  }

  function removeZone(key: number) {
    markDirty()
    setZones((prev) => prev.filter((z) => z.key !== key))
  }

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const result = await saveDeliverySettings(storeId, {
          pickupEnabled,
          pickupAddress,
          deliveryNote,
          freeDeliveryMin,
          payOnDeliveryEnabled,
          zones: zones.map(({ area, fee }) => ({ area, fee })),
        })
        if (result?.error) setError(result.error)
        else setSaved(true)
      } catch {
        setError('Could not save. Check your connection and try again.')
      }
    })
  }

  const filledZones = zones.filter((z) => z.area.trim()).length
  const noCheckoutOption = !pickupEnabled && filledZones === 0
  const noPaymentOption = !hasBankDetails && !payOnDeliveryEnabled

  return (
    <div className="space-y-4">
      {/* Delivery areas */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <IconTruckDelivery className="w-5 h-5 mt-0.5 shrink-0 text-ink/50" stroke={1.75} />
          <div>
            <p className="text-sm font-medium">Delivery areas</p>
            <p className="text-xs text-ink/50 mt-0.5">
              Customers pick one of these at checkout and pay its fee. Use any names that make sense
              for you — a neighbourhood, a city, or a state. Leave the list empty if you don&apos;t deliver.
            </p>
          </div>
        </div>

        {zones.length > 0 && (
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[1fr_140px_36px] gap-2 text-xs font-medium text-ink/50">
              <span>Area</span>
              <span>Fee (₦)</span>
              <span className="sr-only">Remove</span>
            </div>
            {zones.map((z, i) => (
              <div key={z.key} className="grid grid-cols-[1fr_110px_36px] sm:grid-cols-[1fr_140px_36px] gap-2 items-center">
                <Input
                  value={z.area}
                  onChange={(e) => updateZone(z.key, { area: e.target.value })}
                  placeholder={i === 0 ? 'e.g. Lekki Phase 1' : 'Area name'}
                  aria-label={`Delivery area ${i + 1} name`}
                  maxLength={80}
                />
                <Input
                  value={z.fee}
                  onChange={(e) => updateZone(z.key, { fee: e.target.value })}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="50"
                  placeholder="0"
                  aria-label={`Delivery fee for ${z.area || `area ${i + 1}`}`}
                  className="font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeZone(z.key)}
                  aria-label={`Remove ${z.area || `area ${i + 1}`}`}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-ink/40 hover:text-pepper-600 hover:bg-pepper-50 transition-colors"
                >
                  <IconTrash className="w-4 h-4" stroke={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addZone}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <IconPlus className="w-4 h-4" stroke={2} /> Add delivery area
        </button>

        <div className="mt-5 pt-4 border-t border-sand-200 grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="free-delivery-min">Free delivery on orders over (₦)</Label>
            <Input
              id="free-delivery-min"
              type="number"
              inputMode="decimal"
              min="0"
              value={freeDeliveryMin}
              onChange={(e) => {
                markDirty()
                setFreeDeliveryMin(e.target.value)
              }}
              placeholder="Leave blank for no free delivery"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="delivery-note">Note shown at checkout</Label>
            <Input
              id="delivery-note"
              value={deliveryNote}
              onChange={(e) => {
                markDirty()
                setDeliveryNote(e.target.value)
              }}
              maxLength={300}
              placeholder="e.g. Delivery takes 1–3 working days"
            />
          </div>
        </div>
      </Card>

      {/* Pickup */}
      <Card>
        <Toggle
          icon={IconBuildingStore}
          checked={pickupEnabled}
          onChange={(v) => {
            markDirty()
            setPickupEnabled(v)
          }}
          label="Allow pickup"
          description="Customers collect their order from you, with no delivery fee."
        />
        {pickupEnabled && (
          <div className="mt-4 sm:pl-8">
            <Label htmlFor="pickup-address">Pickup address & instructions</Label>
            <Textarea
              id="pickup-address"
              rows={2}
              value={pickupAddress}
              onChange={(e) => {
                markDirty()
                setPickupAddress(e.target.value)
              }}
              maxLength={300}
              placeholder="e.g. 14 Admiralty Way, Lekki. Mon–Sat, 10am–6pm. Call on arrival."
            />
            <p className="text-xs text-ink/50 mt-1">Shown to customers when they choose pickup.</p>
          </div>
        )}
      </Card>

      {/* Payment */}
      <Card>
        <Toggle
          icon={IconCash}
          checked={payOnDeliveryEnabled}
          onChange={(v) => {
            markDirty()
            setPayOnDeliveryEnabled(v)
          }}
          label="Accept pay on delivery"
          description="Customers pay cash or transfer when the order arrives. Turn off if you only want prepaid orders."
        />
        <p className="text-xs text-ink/50 mt-3 sm:pl-8">
          Bank transfer is {hasBankDetails ? 'on — customers see your account at checkout' : 'off until you add your bank details'}.{' '}
          <Link href={`/stores/${storeId}/delivery#bank`} className="text-indigo-600 hover:underline">
            {hasBankDetails ? 'Edit bank details' : 'Add bank details'}
          </Link>
        </p>
      </Card>

      {(noCheckoutOption || noPaymentOption) && (
        <div role="alert" className="rounded-lg bg-marigold-50 text-ink/80 text-sm px-4 py-3">
          {noCheckoutOption
            ? 'Customers can’t check out: turn on pickup or add a delivery area.'
            : 'Customers can’t pay: add bank details or turn on pay on delivery.'}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-pepper-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={isPending} className="min-w-36">
          {isPending ? 'Saving…' : saved ? <span className="inline-flex items-center gap-1">Saved <IconCheck className="w-4 h-4" /></span> : 'Save changes'}
        </Button>
        {saved && <span className="text-sm text-palm-600" aria-live="polite">Your checkout is updated.</span>}
      </div>
    </div>
  )
}
