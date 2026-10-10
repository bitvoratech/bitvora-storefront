'use client'

/* eslint-disable @next/next/no-img-element -- Cloudinary-resized images via cldImage() */
import { useState } from 'react'
import { PackageBox } from 'switch-icons'
import { cldImage } from '../../../../lib/cloudinary-image'

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div>
      <div className="aspect-square rounded-xl overflow-hidden bg-[#fafafa]">
        {current ? (
          <img src={cldImage(current, 1000)} alt={name} fetchPriority="high" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageBox className="w-10 h-10 text-[#d4d4d4]" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-2" role="list" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              role="listitem"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={`aspect-square rounded-lg overflow-hidden bg-[#fafafa] border-2 transition-colors ${
                i === active ? 'border-[#171717]' : 'border-transparent hover:border-[#d4d4d4]'
              }`}
            >
              <img src={cldImage(img, 200)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
