import { Input } from '@bitvora/ui/src/Input'
import { Label } from '@bitvora/ui/src/Label'
import { NIGERIAN_BANKS } from '../lib/nigerian-banks'

// The payout account customers transfer to. Uncontrolled, so it works in
// both the create-store form and the bank details card.
export function BankFields({
  defaults = {},
}: {
  defaults?: { bank_name?: string; account_number?: string; account_name?: string }
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bank_name">Bank name</Label>
        <Input id="bank_name" name="bank_name" type="text" list="nigerian-banks" autoComplete="off" placeholder="Start typing, e.g. GTBank" defaultValue={defaults.bank_name} required maxLength={100} />
        <datalist id="nigerian-banks">
          {NIGERIAN_BANKS.map((b) => <option key={b} value={b} />)}
        </datalist>
      </div>
      <div>
        <Label htmlFor="account_number">Account number</Label>
        <Input id="account_number" name="account_number" type="text" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10 digits" defaultValue={defaults.account_number} required className="font-mono" title="Your 10-digit NUBAN account number" />
      </div>
      <div>
        <Label htmlFor="account_name">Account name</Label>
        <Input id="account_name" name="account_name" type="text" placeholder="As it appears on the account" defaultValue={defaults.account_name} required maxLength={100} />
      </div>
    </div>
  )
}
