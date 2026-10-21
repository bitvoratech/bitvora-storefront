'use client'

import { useState, useTransition } from 'react'
import { IconBuildingBank } from '@tabler/icons-react'
import { Card } from '@bitvora/ui/src/Card'
import { Button } from '@bitvora/ui/src/Button'
import { BankFields } from '../../../../components/BankFields'
import { saveBankDetails } from '../customize/actions'

export function BankDetailsCard({
  storeId,
  initial,
}: {
  storeId: string
  initial: { bank_name: string; account_number: string; account_name: string }
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveBankDetails(
        storeId,
        String(data.get('bank_name') ?? ''),
        String(data.get('account_number') ?? ''),
        String(data.get('account_name') ?? ''),
      )
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <Card id="bank" className="scroll-mt-6">
      <div className="flex items-start gap-3 mb-4">
        <IconBuildingBank className="w-5 h-5 mt-0.5 shrink-0 text-ink/50" stroke={1.75} />
        <div>
          <h2 className="text-sm font-medium">Bank account</h2>
          <p className="text-xs text-ink/50 mt-0.5">Customers who pay by bank transfer send money here. They see it at checkout.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} onChange={() => setSaved(false)} className="space-y-4 sm:pl-8">
        <BankFields defaults={initial} />
        {error && <p role="alert" className="text-sm text-pepper-600">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending} className="min-w-36">
            {isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save bank details'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
