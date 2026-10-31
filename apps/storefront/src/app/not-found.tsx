import { IconBuildingStore } from '@tabler/icons-react'

// Unknown, unpublished or suspended stores land here.
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 text-center text-[#171717]">
      <div className="max-w-sm">
        <IconBuildingStore className="w-8 h-8 mx-auto mb-4 text-[#a3a3a3]" />
        <h1 className="text-xl font-semibold mb-2">Store not available</h1>
        <p className="text-sm text-[#737373]">
          This store doesn&apos;t exist or isn&apos;t open right now. Check the link with the seller.
        </p>
      </div>
    </main>
  )
}
