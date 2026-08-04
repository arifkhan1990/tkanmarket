import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { bulkOrders } from '@/db/schema/bulk-orders.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { NotFoundError } from '@/lib/errors'
import type {
  PublicOrderTrackingResponse,
  PublicOrderTrackingTimelineStep
} from '@/types/public-order-tracking.types'

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildTimeline(params: {
  status: 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED' | 'ON_HOLD'
  orderedAt: Date
}): PublicOrderTrackingTimelineStep[] {
  const { status, orderedAt } = params
  const placed: PublicOrderTrackingTimelineStep = {
    id: 'placed',
    title: 'Order placed',
    description: 'Your bulk order is confirmed with the supplier.',
    dateLabel: formatDate(orderedAt),
    state: 'done',
    progressPercent: null
  }

  if (status === 'ON_HOLD') {
    return [
      placed,
      {
        id: 'hold',
        title: 'On hold',
        description: 'This order is paused pending buyer or logistics confirmation.',
        dateLabel: null,
        state: 'current',
        progressPercent: null
      },
      {
        id: 'transit',
        title: 'In transit',
        description: 'Shipment will appear here once the batch leaves the mill.',
        dateLabel: null,
        state: 'pending',
        progressPercent: null
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Final delivery to your warehouse.',
        dateLabel: null,
        state: 'pending',
        progressPercent: null
      }
    ]
  }

  const processingDone = status !== 'PROCESSING'
  const transitCurrent = status === 'IN_TRANSIT'
  const deliveredDone = status === 'DELIVERED'

  const processing: PublicOrderTrackingTimelineStep = {
    id: 'processing',
    title: 'Fulfillment',
    description: processingDone
      ? 'Production and quality checks are moving forward with your supplier.'
      : 'Your order is being prepared and scheduled for production.',
    dateLabel: processingDone ? formatDate(orderedAt) : null,
    state: status === 'PROCESSING' ? 'current' : 'done',
    progressPercent: status === 'PROCESSING' ? 44 : null
  }

  const transit: PublicOrderTrackingTimelineStep = {
    id: 'transit',
    title: 'In transit',
    description: transitCurrent
      ? 'Fabric batch is on the way to the export hub.'
      : deliveredDone
        ? 'International freight completed for this batch.'
        : 'Awaiting dispatch from the supplier facility.',
    dateLabel: transitCurrent || deliveredDone ? formatDate(orderedAt) : null,
    state: transitCurrent ? 'current' : deliveredDone ? 'done' : 'pending',
    progressPercent: null
  }

  const delivered: PublicOrderTrackingTimelineStep = {
    id: 'delivered',
    title: 'Delivered',
    description: deliveredDone
      ? 'Delivery confirmed against this order reference.'
      : 'Estimated arrival after customs and last-mile handling.',
    dateLabel: deliveredDone ? formatDate(orderedAt) : 'Pending',
    state: deliveredDone ? 'done' : 'pending',
    progressPercent: null
  }

  return [placed, processing, transit, delivered]
}

export class PublicOrderTrackingService {
  public static async getByOrderReference(orderReference: string): Promise<PublicOrderTrackingResponse> {
    const db = getDb()
    const ref = orderReference.trim()
    if (ref.length < 3) throw new NotFoundError('Order not found')

    const rows = await db
      .select({
        orderReference: bulkOrders.orderReference,
        buyerCompanyName: bulkOrders.buyerCompanyName,
        status: bulkOrders.status,
        totalMeters: bulkOrders.totalMeters,
        estimatedValueUsd: bulkOrders.estimatedValueUsd,
        orderedAt: bulkOrders.orderedAt,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        supplierCity: suppliers.city,
        supplierCountry: suppliers.country,
        supplierLogo: suppliers.logoUrl
      })
      .from(bulkOrders)
      .innerJoin(suppliers, eq(bulkOrders.supplierId, suppliers.id))
      .where(and(eq(bulkOrders.orderReference, ref), isNull(bulkOrders.deletedAt), isNull(suppliers.deletedAt)))
      .limit(1)

    const row = rows[0]
    if (!row) throw new NotFoundError('Order not found')

    const totalMeters = Number(row.totalMeters)
    const estimated = row.estimatedValueUsd === null ? null : Number(row.estimatedValueUsd)

    const timeline = buildTimeline({ status: row.status, orderedAt: row.orderedAt })

    const valueLabel =
      estimated !== null && Number.isFinite(estimated)
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimated)
        : '—'

    return {
      order_reference: row.orderReference,
      buyer_company_name: row.buyerCompanyName,
      status: row.status,
      total_meters: Number.isFinite(totalMeters) ? totalMeters : 0,
      estimated_value_usd: estimated,
      ordered_at: row.orderedAt.toISOString(),
      supplier: {
        id: row.supplierId,
        name: row.supplierName,
        slug: row.supplierSlug,
        city: row.supplierCity,
        country: row.supplierCountry,
        logo_url: row.supplierLogo
      },
      timeline,
      manifest_lines: [
        {
          sku: 'BULK-AGG',
          title: 'Consolidated fabric order',
          subtitle: 'Meterage and value reflect the full PO tied to this reference.',
          quantity_label: `${totalMeters.toLocaleString()} m`,
          unit_price_label: '—',
          line_total_label: valueLabel
        }
      ],
      shipping_summary: {
        label: row.buyerCompanyName,
        carrier_preference: row.status === 'IN_TRANSIT' ? 'Express freight' : 'Assigned at dispatch'
      }
    }
  }
}
