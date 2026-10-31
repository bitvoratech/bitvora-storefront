'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@bitvora/ui/src/Card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './orders/StatusBadge'
import { IconArrowRight, IconReceipt } from '@tabler/icons-react'

type Order = {
  id: string
  customer_name: string
  total: number
  status: string
}

export function RecentOrders({ storeId, orders }: { storeId: string; orders: Order[] }) {
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-semibold">Recent orders</h2>
        <Link href={`/stores/${storeId}/orders`} className="text-xs font-medium text-indigo-600">
          View all <IconArrowRight className="w-3 h-3 inline-block ml-1" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-10">
          <IconReceipt className="w-7 h-7 text-ink/20 mx-auto mb-2" />
          <p className="text-sm text-ink/50">No orders yet.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-sand-100/60 transition-colors"
                  onClick={() => router.push(`/stores/${storeId}/orders/${order.id}`)}
                >
                  <TableCell className="font-medium max-w-[9rem] sm:max-w-none">
                    {/* Real link (not just the row onClick) so it works by keyboard;
                        truncates so long names can't push the table sideways on phones. */}
                    <Link
                      href={`/stores/${storeId}/orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block truncate hover:text-indigo-600"
                    >
                      {order.customer_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    ₦{Number(order.total).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}