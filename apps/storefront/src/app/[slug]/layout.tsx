import { readableTextOn } from '../../lib/color'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { IconBrandFacebook, IconBrandInstagram, IconBrandTiktok, IconBrandWhatsapp, IconBuildingStore } from '@tabler/icons-react'
import { CartIcon } from '../../components/CartIcon'
import { getPublishedStore, whatsappLink } from '../../lib/store'
import { cldImage, cldJpeg } from '@bitvora/lib/cloudinary-image'
import { StoreSearch } from '../../components/StoreSearch'
import { VerifiedBadge } from '../../components/VerifiedBadge'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const store = await getPublishedStore(slug)
  if (!store) return { title: 'Store not found' }

  const description = store.industry
    ? `Shop ${store.name}'s ${store.industry} collection online. Order in minutes, pay by transfer or on delivery.`
    : `Shop ${store.name} online. Order in minutes, pay by transfer or on delivery.`
  // JPEG, not f_auto: preview crawlers may not accept WebP/AVIF.
  const image = cldJpeg(store.logo_url, 1200, 630) ?? undefined

  // Shared store links (WhatsApp, Instagram, X) render these as the preview card.
  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description,
    openGraph: {
      title: store.name,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: store.name, description },
  }
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getPublishedStore(slug)
  if (!store) notFound()

  const accent = store.palette?.primary || '#171717'
  const social = store.social_links || {}
  const hasSocial = social.whatsapp || social.instagram || social.facebook || social.tiktok

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#171717]" style={{ '--accent': accent, '--accent-fg': readableTextOn(accent) } as React.CSSProperties}>
      <header className="border-b border-[#e5e5e5] bg-white/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <a href={`/${slug}`} className="flex items-center gap-2 font-semibold text-lg min-w-0" aria-label={`${store.name} home`}>
            {store.logo_url ? (
              // object-contain + auto width: logos come in every aspect ratio
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cldImage(store.logo_url, 320)}
                alt={store.name}
                className="h-8 sm:h-9 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <>
                <IconBuildingStore className="w-5 h-5 shrink-0" style={{ color: accent }} />
                <span className="truncate">{store.name}</span>
              </>
            )}
          </a>
          <div className="hidden md:block flex-1 max-w-md">
            <Suspense>
              <StoreSearch slug={slug} storeName={store.name} />
            </Suspense>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {store.is_verified && <VerifiedBadge />}
            <CartIcon slug={slug} />
          </div>
        </div>
        <div className="md:hidden px-4 pb-3">
          <Suspense>
            <StoreSearch slug={slug} storeName={store.name} />
          </Suspense>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
      <footer className="max-w-5xl mx-auto px-6 py-8 text-center border-t border-[#f0f0f0]">
        {hasSocial && (
          <div className="flex items-center justify-center gap-2 mb-3">
            {social.whatsapp && (
              <a
                href={whatsappLink(social) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.name} on WhatsApp`}
                className="p-2 rounded-full text-[#525252] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
              >
                <IconBrandWhatsapp className="w-4 h-4" />
              </a>
            )}
            {social.instagram && (
              <a
                href={`https://instagram.com/${social.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.name} on Instagram`}
                className="p-2 rounded-full text-[#525252] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
              >
                <IconBrandInstagram className="w-4 h-4" />
              </a>
            )}
            {social.facebook && (
              <a
                href={social.facebook.startsWith('http') ? social.facebook : `https://${social.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.name} on Facebook`}
                className="p-2 rounded-full text-[#525252] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
              >
                <IconBrandFacebook className="w-4 h-4" />
              </a>
            )}
            {social.tiktok && (
              <a
                href={`https://tiktok.com/@${social.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.name} on TikTok`}
                className="p-2 rounded-full text-[#525252] hover:text-[#171717] hover:bg-[#f5f5f5] transition-colors"
              >
                <IconBrandTiktok className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
        {store.is_verified && (
          <div className="mb-2 flex justify-center">
            <VerifiedBadge variant="inline" detail="identity checked by Bitvora" className="text-left" />
          </div>
        )}
        <p className="text-xs text-[#737373]">Powered by Bitvora Stores</p>
      </footer>
    </div>
  )
}
