'use client'
/* eslint-disable @next/next/no-img-element -- small previews of merchant-uploaded Cloudinary images; next/image has no remote patterns configured in the admin */

import { useEffect, useRef, useState, useTransition } from 'react'
import { Storefront } from 'switch-icons'
import { Button } from '@bitvora/ui/src/Button'
import { Label } from '@bitvora/ui/src/Label'
import { Input } from '@bitvora/ui/src/Input'
import { ImageField } from './ImageField'
import { IconChevronLeft, IconChevronRight, IconEye, IconPencil } from '@tabler/icons-react'

import {
  saveBrandColor, saveHeroSection, saveBannerGridSection, saveCtaBannerSection,
  saveTypography, saveLogo, saveGridDensity,
  saveAboutSection, saveSocialLinks, toggleSectionVisibility, reorderSection,
} from './actions'
import { FONT_PAIRINGS, SCALES } from '../../../../lib/font-pairings'

type Tile = { heading: string; image_url: string; cta_text: string }

const PRESETS = [
  { name: 'Ink', value: '#171717' },
  { name: 'Indigo', value: '#2A3B8F' },
  { name: 'Marigold', value: '#E8A33D' },
  { name: 'Palm', value: '#3F7D5C' },
  { name: 'Pepper', value: '#C1443B' },
  { name: 'Rose', value: '#B5495B' },
  { name: 'Ocean', value: '#1D6C8C' },
]

const TABS = ['brand', 'design', 'hero', 'about', 'collections', 'banner', 'sections', 'social'] as const
type Tab = typeof TABS[number]
// 'sections' saves each change as it's made, so it never has unsaved edits.
type EditableTab = Exclude<Tab, 'sections'>

const TAB_LABELS: Record<Tab, string> = {
  brand: 'Brand', design: 'Design', hero: 'Hero', about: 'About',
  collections: 'Collections', banner: 'Banner', sections: 'Sections', social: 'Social',
}

export function CustomizeWorkspace({
  storeId,
  storeName,
  initialColor,
  initialHero,
  initialTiles,
  initialCta,
  initialLogo,
  initialTypography,
  initialGridDensity,
  initialAbout,
  initialSocial,
  sectionsMeta,
}: {
  storeId: string
  storeName: string
  initialColor: string
  initialHero: { heading: string; subheading: string; image_url: string; cta_text: string }
  initialTiles: Tile[]
  initialCta: { heading: string; image_url: string; cta_text: string }
  initialLogo: string
  initialTypography: { pairing: string; scale: string }
  initialGridDensity: number
  initialAbout: { heading: string; body: string }
  initialSocial: { whatsapp?: string; instagram?: string; facebook?: string; tiktok?: string }
  sectionsMeta: { type: string; label: string; is_visible: boolean; position: number }[]
}) {
  const [logo, setLogo] = useState(initialLogo)
  const [typography, setTypography] = useState(initialTypography)
  const [gridDensity, setGridDensity] = useState(initialGridDensity)
  const [about, setAbout] = useState(initialAbout)
  const [social, setSocial] = useState(initialSocial)
  const [sections, setSections] = useState(sectionsMeta)
  const [tab, setTab] = useState<Tab>('brand')
  const [color, setColor] = useState(initialColor)
  const [hero, setHero] = useState(initialHero)
  const [tiles, setTiles] = useState<Tile[]>([0, 1, 2].map((i) => initialTiles[i] || { heading: '', image_url: '', cta_text: '' }))
  const [cta, setCta] = useState(initialCta)
  const [isPending, startTransition] = useTransition()
  const [justSaved, setJustSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Each tab's current values, serialized, compared with what was last saved:
  // that's what tells us which tabs have unsaved edits.
  const current: Record<EditableTab, string> = {
    brand: JSON.stringify(color),
    design: JSON.stringify({ typography, logo, gridDensity }),
    hero: JSON.stringify(hero),
    about: JSON.stringify(about),
    collections: JSON.stringify(tiles),
    banner: JSON.stringify(cta),
    social: JSON.stringify(social),
  }
  const [saved, setSaved] = useState(current)
  const dirtyTabs = (Object.keys(current) as EditableTab[]).filter((t) => current[t] !== saved[t])
  const hasUnsaved = dirtyTabs.length > 0

  // Warn before a reload or closing the tab would throw edits away.
  useEffect(() => {
    if (!hasUnsaved) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsaved])

  // Mobile-only: which pane is showing. Desktop always shows both.
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')

  // Tab bar scroll affordance — edge fades + arrows appear only when there's
  // actually more to scroll to in that direction.
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  function updateFades() {
    const el = tabsScrollRef.current
    if (!el) return
    setShowLeftFade(el.scrollLeft > 4)
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateFades()
    window.addEventListener('resize', updateFades)
    return () => window.removeEventListener('resize', updateFades)
  }, [])

  function scrollTabs(dir: 'left' | 'right') {
    tabsScrollRef.current?.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  // Saves every tab with unsaved edits, not just the one that's open, so
  // switching tabs before saving never loses work.
  function save() {
    if (!hasUnsaved) return
    setJustSaved(false)
    setSaveError(null)
    const toSave = dirtyTabs
    const snapshot = current
    startTransition(async () => {
      const savers: Record<EditableTab, () => Promise<({ error?: string } | void)[]>> = {
        brand: async () => [await saveBrandColor(storeId, color)],
        design: async () => [
          await saveTypography(storeId, typography.pairing, typography.scale),
          await saveLogo(storeId, logo),
          await saveGridDensity(storeId, gridDensity),
        ],
        hero: async () => [await saveHeroSection(storeId, hero)],
        about: async () => [await saveAboutSection(storeId, about.heading, about.body)],
        collections: async () => [await saveBannerGridSection(storeId, tiles)],
        banner: async () => [await saveCtaBannerSection(storeId, cta)],
        social: async () => [await saveSocialLinks(storeId, social)],
      }
      const succeeded: EditableTab[] = []
      let firstError: string | null = null
      for (const t of toSave) {
        try {
          const failed = (await savers[t]()).find((r) => r && r.error)
          if (failed && failed.error) firstError ??= `${TAB_LABELS[t]}: ${failed.error}`
          else succeeded.push(t)
        } catch {
          firstError ??= 'Could not save. Check your connection and try again.'
        }
      }
      // Tabs that saved stop counting as unsaved even if another tab failed.
      setSaved((prev) => {
        const next = { ...prev }
        for (const t of succeeded) next[t] = snapshot[t]
        return next
      })
      if (firstError) {
        setSaveError(firstError)
        return
      }
      setJustSaved(true)
    })
  }

  const saveLabel = isPending
    ? 'Saving...'
    : hasUnsaved
      ? dirtyTabs.length > 1 ? `Save changes (${dirtyTabs.length} tabs)` : 'Save changes'
      : justSaved ? 'Saved ✓' : 'No unsaved changes'

  async function handleToggleVisibility(sectionType: string, visible: boolean) {
    setSections((prev) => prev.map((s) => (s.type === sectionType ? { ...s, is_visible: visible } : s)))
    await toggleSectionVisibility(storeId, sectionType, visible)
  }

  async function handleReorder(sectionType: string, direction: 'up' | 'down') {
    const prev = sections
    const idx = prev.findIndex((s) => s.type === sectionType)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return

    // Swap list order and positions locally so the list moves straight away.
    const next = [...prev]
    next[idx] = { ...prev[swapIdx], position: prev[idx].position }
    next[swapIdx] = { ...prev[idx], position: prev[swapIdx].position }
    setSections(next)
    setSaveError(null)

    const result = await reorderSection(storeId, sectionType, direction)
    if (result?.error) {
      setSections(prev)
      setSaveError(result.error)
    }
  }

  function updateTile(i: number, patch: Partial<Tile>) {
    setTiles((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-4 lg:gap-6">
      {/* Left: tabbed settings panel — hidden on mobile while previewing */}
      <div className={`min-w-0 ${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
        <div className="relative mb-4">
          <div
            ref={tabsScrollRef}
            onScroll={updateFades}
            className="flex gap-1 border-b border-sand-200 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 snap-start whitespace-nowrap px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
                  tab === t ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-ink/50 hover:text-ink'
                }`}
              >
                {TAB_LABELS[t]}
                {t !== 'sections' && dirtyTabs.includes(t) && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-marigold-500 align-middle" aria-label="unsaved changes" />
                )}
              </button>
            ))}
          </div>

          {showLeftFade && (
            <>
              {/* from-white assumes a white page bg — dark:from-paper matches
                  the actual dark page background instead */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-paper to-transparent" />
              <button
                onClick={() => scrollTabs('left')}
                aria-label="Scroll tabs left"
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-sand-100 border border-sand-200 shadow-sm text-ink/50 hover:text-indigo-600"
              >
                <IconChevronLeft className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {showRightFade && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-paper to-transparent" />
              <button
                onClick={() => scrollTabs('right')}
                aria-label="Scroll tabs right"
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-sand-100 border border-sand-200 shadow-sm text-ink/50 hover:text-indigo-600"
              >
                <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {tab === 'brand' && (
          <div className="space-y-3">
            <Label>Brand color</Label>
            <p className="text-xs text-ink/50 -mt-2">This accent color appears on buttons, highlights, and links across your storefront.</p>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={color === preset.value}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    color === preset.value ? 'border-ink scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <label className="relative w-9 h-9 rounded-full border-2 border-dashed border-sand-200 flex items-center justify-center cursor-pointer overflow-hidden">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-xs text-ink/40">+</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border border-sand-200" style={{ backgroundColor: color }} />
              <span className="text-xs font-mono text-ink/50">{color}</span>
            </div>
          </div>
        )}

        {tab === 'hero' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="heading">Heading</Label>
              <Input id="heading" value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} placeholder="e.g. Fresh drops every Friday" maxLength={80} />
            </div>
            <div>
              <Label htmlFor="subheading">Subheading</Label>
              <Input id="subheading" value={hero.subheading} onChange={(e) => setHero({ ...hero, subheading: e.target.value })} placeholder="e.g. Handmade jewelry, made in Lagos" maxLength={120} />
            </div>
            <div>
              <Label htmlFor="cta_text">Button text</Label>
              <Input id="cta_text" value={hero.cta_text} onChange={(e) => setHero({ ...hero, cta_text: e.target.value })} maxLength={30} />
            </div>
            <div>
              <Label>Hero image</Label>
              <ImageField value={hero.image_url} onChange={(url) => setHero({ ...hero, image_url: url })} />
            </div>
          </div>
        )}

        {tab === 'collections' && (
          <div className="space-y-5">
            {tiles.map((tile, i) => (
              <div key={i} className="border border-sand-200 rounded-lg p-3 space-y-2.5">
                <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">Tile {i + 1}</p>
                <div>
                  <Label>Heading</Label>
                  <Input value={tile.heading} onChange={(e) => updateTile(i, { heading: e.target.value })} placeholder="e.g. Fresh Drops" maxLength={60} />
                </div>
                <div>
                  <Label>Button text</Label>
                  <Input value={tile.cta_text} onChange={(e) => updateTile(i, { cta_text: e.target.value })} placeholder="Shop now" maxLength={24} />
                </div>
                <div>
                  <Label>Image</Label>
                  <ImageField value={tile.image_url} onChange={(url) => updateTile(i, { image_url: url })} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'banner' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="cta_heading">Heading</Label>
              <Input id="cta_heading" value={cta.heading} onChange={(e) => setCta({ ...cta, heading: e.target.value })} placeholder="e.g. Build your style with confidence" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="cta_button_text">Button text</Label>
              <Input id="cta_button_text" value={cta.cta_text} onChange={(e) => setCta({ ...cta, cta_text: e.target.value })} maxLength={30} />
            </div>
            <div>
              <Label>Banner image</Label>
              <ImageField value={cta.image_url} onChange={(url) => setCta({ ...cta, image_url: url })} />
            </div>
          </div>
        )}

        {tab === 'design' && (
          <div className="space-y-5">
            <div>
              <Label>Store logo</Label>
              <ImageField value={logo} onChange={setLogo} />
            </div>
            <div>
              <Label>Font pairing</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {FONT_PAIRINGS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setTypography({ ...typography, pairing: p.id })}
                    className={`border rounded-lg p-2.5 text-left ${
                      typography.pairing === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-sand-200'
                    }`}
                  >
                    <p className="text-lg" style={{ fontFamily: p.display }}>{p.preview}</p>
                    <p className="text-xs text-ink/60 mt-0.5">{p.name}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Heading size</Label>
              <div className="flex gap-2 mt-1.5">
                {SCALES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTypography({ ...typography, scale: s.id })}
                    className={`flex-1 border rounded-lg py-2 text-sm ${
                      typography.scale === s.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-medium' : 'border-sand-200 text-ink/60'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Product grid</Label>
              <div className="flex gap-2 mt-1.5">
                {[2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGridDensity(n)}
                    className={`flex-1 border rounded-lg py-2 text-sm ${
                      gridDensity === n ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-medium' : 'border-sand-200 text-ink/60'
                    }`}
                  >
                    {n} columns
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="about_heading">Heading</Label>
              <Input id="about_heading" value={about.heading} onChange={(e) => setAbout({ ...about, heading: e.target.value })} placeholder="e.g. Our story" maxLength={60} />
            </div>
            <div>
              <Label htmlFor="about_body">Body text</Label>
              <textarea
                id="about_body"
                value={about.body}
                onChange={(e) => setAbout({ ...about, body: e.target.value })}
                rows={5}
                placeholder="Tell customers about your brand..."
                className="w-full rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-2.5 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              />
            </div>
          </div>
        )}

        {tab === 'sections' && (
          <div className="space-y-2">
            <p className="text-xs text-ink/50 mb-2">Show, hide, or reorder homepage sections.</p>
            {sections.map((s, i) => (
              <div key={s.type} className="flex items-center justify-between border border-sand-200 rounded-lg px-3 py-2.5">
                <span className="text-sm">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleReorder(s.type, 'up')} disabled={i === 0} aria-label={`Move ${s.type.replace('_', ' ')} up`} className="text-xs text-ink/40 disabled:opacity-30 px-1.5">↑</button>
                  <button onClick={() => handleReorder(s.type, 'down')} disabled={i === sections.length - 1} aria-label={`Move ${s.type.replace('_', ' ')} down`} className="text-xs text-ink/40 disabled:opacity-30 px-1.5">↓</button>
                  <button
                    onClick={() => handleToggleVisibility(s.type, !s.is_visible)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${s.is_visible ? 'bg-indigo-600' : 'bg-sand-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-sand-400 transition-all ${s.is_visible ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'social' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input id="whatsapp" value={social.whatsapp || ''} onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })} placeholder="+234..." />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={social.instagram || ''} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} placeholder="@yourstore" />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={social.facebook || ''} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} placeholder="facebook.com/yourstore" />
            </div>
            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input id="tiktok" value={social.tiktok || ''} onChange={(e) => setSocial({ ...social, tiktok: e.target.value })} placeholder="@yourstore" />
            </div>
          </div>
        )}

        {saveError && (
          <p role="alert" className="text-sm text-red-600 mt-4">{saveError}</p>
        )}

        {/* Desktop save button — mobile uses the sticky bar below instead */}
        <Button onClick={save} disabled={isPending || !hasUnsaved} className="hidden lg:inline-flex w-full mt-5">
          {saveLabel}
        </Button>

        {/* Room for the fixed mobile bar so content isn't hidden behind it */}
        <div className="h-20 lg:hidden" />
      </div>

      {/* Right: live preview — hidden on mobile while editing */}
      <div className={`lg:sticky lg:top-6 self-start ${mobileView === 'edit' ? 'hidden lg:block' : ''}`}>
        <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Live preview</p>
        <div className="border border-sand-200 rounded-2xl overflow-hidden bg-white dark:bg-sand-100">
          <div className="border-b border-sand-100 px-4 py-2.5 flex items-center gap-1.5">
            <Storefront className="w-3.5 h-3.5" style={{ color }} />
            <span className="text-xs font-medium">{storeName}</span>
          </div>

          <div className="p-3 space-y-3">
            <div className="relative h-40 rounded-xl overflow-hidden">
              {hero.image_url ? (
                <img src={hero.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ backgroundColor: color }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-center px-4 max-w-[70%]">
                <p className="text-white font-semibold text-lg leading-tight mb-1">
                  {hero.heading || storeName}
                </p>
                {hero.subheading && <p className="text-white/80 text-[11px] mb-2">{hero.subheading}</p>}
                <span className="inline-block w-fit rounded-full px-3 py-1 text-[10px] font-medium text-white" style={{ backgroundColor: color }}>
                  {hero.cta_text || 'Shop now'}
                </span>
              </div>
            </div>

            {tiles.some((t) => t.heading) && (
              <div className="grid grid-cols-3 gap-1.5">
                {tiles.map((tile, i) => (
                  <div key={i} className="relative h-16 rounded-lg overflow-hidden">
                    {tile.image_url ? (
                      <img src={tile.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0" style={{ backgroundColor: color, opacity: 0.85 }} />
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <p className="relative text-white text-[9px] font-medium p-1.5 leading-tight">{tile.heading}</p>
                  </div>
                ))}
              </div>
            )}

            <div>
              <p className="text-[10px] text-ink/40 text-center mb-1.5">Shop the collection</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-lg border border-sand-100 overflow-hidden">
                    <div className="aspect-square bg-sand-100" />
                    <div className="p-1.5">
                      <div className="h-1.5 w-8 rounded-full bg-sand-200 mb-1" />
                      <div className="h-1.5 w-5 rounded-full bg-sand-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {cta.heading && (
              <div className="relative h-20 rounded-xl overflow-hidden">
                {cta.image_url ? (
                  <img src={cta.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: color }} />
                )}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-3">
                  <p className="text-white text-[11px] font-medium leading-tight mb-1.5">{cta.heading}</p>
                  <span className="inline-block rounded-full px-2.5 py-1 text-[9px] font-medium text-white" style={{ backgroundColor: color }}>
                    {cta.cta_text || 'Shop now'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only: sticky Edit/Preview toggle + Save, pinned to bottom */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-sand-200 bg-white/95 dark:bg-paper/95 backdrop-blur px-4 py-2.5"
        style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-1 rounded-lg bg-sand-100 p-1">
          <button
            onClick={() => setMobileView('edit')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mobileView === 'edit' ? 'bg-white dark:bg-sand-300 shadow-sm text-indigo-600' : 'text-ink/50'
            }`}
          >
            <IconPencil className="w-3.5 h-3.5" stroke={1.75} /> Edit
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
              mobileView === 'preview' ? 'bg-white dark:bg-sand-300 shadow-sm text-indigo-600' : 'text-ink/50'
            }`}
          >
            <IconEye className="w-3.5 h-3.5" stroke={1.75} /> Preview
          </button>
        </div>
        <Button onClick={save} disabled={isPending || !hasUnsaved} className="shrink-0 px-4">
          {isPending ? 'Saving...' : hasUnsaved ? 'Save' : justSaved ? 'Saved ✓' : 'Saved'}
        </Button>
      </div>
    </div>
  )
}