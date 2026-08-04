import { pgEnum, pgTable, text, integer, timestamp, index, numeric } from 'drizzle-orm/pg-core'

import { suppliers } from './suppliers.schema'

export const logisticsCarrierHealthEnum = pgEnum('logistics_carrier_health', [
  'OPERATIONAL',
  'DELAYED',
  'MAINTENANCE'
])

export const logisticsCarrierServiceTypeEnum = pgEnum('logistics_carrier_service_type', [
  'EXPRESS',
  'ECONOMY',
  'FREIGHT'
])

export const logisticsCarriers = pgTable(
  'logistics_carriers',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    name: text('name').notNull(),
    carrierCode: text('carrier_code').notNull().unique(), // e.g. 'DHL', 'FEDEX'
    logoUrl: text('logo_url'),

    regionTag: text('region_tag'), // e.g. 'EU', 'APAC', 'GLOBAL'
    serviceType: logisticsCarrierServiceTypeEnum('service_type').notNull().default('EXPRESS'),
    health: logisticsCarrierHealthEnum('health').notNull().default('OPERATIONAL'),

    reliabilityPercent: numeric('reliability_percent', { precision: 5, scale: 2 }).notNull().default('0'),
    avgTransitDays: numeric('avg_transit_days', { precision: 5, scale: 2 }).notNull().default('0'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    logisticsCarriersHealthIdx: index('logistics_carriers_health_idx').on(table.health),
    logisticsCarriersServiceTypeIdx: index('logistics_carriers_service_type_idx').on(table.serviceType),
    logisticsCarriersDeletedAtIdx: index('logistics_carriers_deleted_at_idx').on(table.deletedAt)
  })
)

export const logisticsShipmentStatusEnum = pgEnum('logistics_shipment_status', [
  'IN_TRANSIT',
  'DELAYED',
  'CUSTOMS_HOLD',
  'DELIVERED'
])

export const logisticsCourierModeEnum = pgEnum('logistics_courier_mode', ['AIR', 'ROAD', 'SEA', 'RAIL'])

export const logisticsShipments = pgTable(
  'logistics_shipments',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    trackingCode: text('tracking_code').notNull().unique(),

    originCity: text('origin_city').notNull(),
    originCountry: text('origin_country').notNull(),

    supplierName: text('supplier_name').notNull(),
    supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),

    courierName: text('courier_name').notNull(),
    courierMode: logisticsCourierModeEnum('courier_mode').notNull().default('AIR'),

    estimatedDeliveryAt: timestamp('estimated_delivery_at', { withTimezone: true }),
    deliveryStatusNote: text('delivery_status_note'),

    status: logisticsShipmentStatusEnum('status').notNull().default('IN_TRANSIT'),

    corridorLabel: text('corridor_label'),
    activeCorridorTrucks: integer('active_corridor_trucks'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    logisticsShipmentsSupplierIdIdx: index('logistics_shipments_supplier_id_idx').on(table.supplierId),
    logisticsShipmentsStatusIdx: index('logistics_shipments_status_idx').on(table.status),
    logisticsShipmentsDeletedAtIdx: index('logistics_shipments_deleted_at_idx').on(table.deletedAt)
  })
)

export const logisticsCarrierLanes = pgTable(
  'logistics_carrier_lanes',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    carrierId: integer('carrier_id')
      .notNull()
      .references(() => logisticsCarriers.id, { onDelete: 'restrict' }),

    laneCode: text('lane_code').notNull(), // e.g. 'EU-East', 'US-West'
    avgTransitDays: numeric('avg_transit_days', { precision: 5, scale: 2 }).notNull().default('0'),
    reliabilityPercent: numeric('reliability_percent', { precision: 5, scale: 2 }).notNull().default('0'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    logisticsCarrierLanesCarrierIdIdx: index('logistics_carrier_lanes_carrier_id_idx').on(table.carrierId),
    logisticsCarrierLanesLaneCodeIdx: index('logistics_carrier_lanes_lane_code_idx').on(table.laneCode),
    logisticsCarrierLanesDeletedAtIdx: index('logistics_carrier_lanes_deleted_at_idx').on(table.deletedAt)
  })
)

