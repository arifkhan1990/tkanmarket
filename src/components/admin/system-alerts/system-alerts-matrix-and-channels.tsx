'use client'

import { Bug, Database, Mail, MessageSquare, ShoppingBag, Smartphone, Wallet, Webhook } from 'lucide-react'

import { DeliveryRow, RangeRow, TriggerCard } from '@/components/admin/system-alerts/system-alerts-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Messages } from '@/lib/i18n/get-messages'
import type { SystemAlertsConfig } from '@/types/system-alerts.types'

type SystemAlertsPage = Messages['admin']['systemAlertsPage']
type NotificationSettingsPage = Messages['admin']['notificationSettingsPage']

export function SystemAlertsMatrixAndChannels({
  p,
  ns,
  draft,
  badgeText,
  update
}: {
  p: SystemAlertsPage
  ns: NotificationSettingsPage
  draft: SystemAlertsConfig
  badgeText: string
  update: (fn: (d: SystemAlertsConfig) => SystemAlertsConfig) => void
}) {
  const d = draft

  return (
    <section className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-on-surface">{p.matrixTitle}</h2>
          <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
            {badgeText}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TriggerCard
            title={ns.alertCrawlerTitle}
            description={ns.alertCrawlerDesc}
            borderClass="border-l-4 border-destructive"
            iconWrapperClassName="bg-error-container text-red-900 dark:text-red-200"
            icon={<Bug className="h-5 w-5" />}
            enabled={d.triggers.crawlerErrorRate.enabled}
            onEnabledChange={(v) =>
              update((x) => ({
                ...x,
                triggers: { ...x.triggers, crawlerErrorRate: { ...x.triggers.crawlerErrorRate, enabled: v } }
              }))
            }
            footer={
              <RangeRow
                label={p.threshold}
                value={d.triggers.crawlerErrorRate.thresholdPer5m}
                min={100}
                max={2000}
                format={(n) => String(n)}
                onChange={(n) =>
                  update((x) => ({
                    ...x,
                    triggers: { ...x.triggers, crawlerErrorRate: { ...x.triggers.crawlerErrorRate, thresholdPer5m: n } }
                  }))
                }
                hint={p.unitErrors5m}
              />
            }
          />

          <TriggerCard
            title={ns.alertBulkTitle}
            description={ns.alertBulkDesc}
            borderClass="border-l-4 border-tertiary"
            iconWrapperClassName="bg-tertiary-fixed text-on-tertiary-fixed-variant"
            icon={<ShoppingBag className="h-5 w-5" />}
            enabled={d.triggers.largeBulkOrder.enabled}
            onEnabledChange={(v) =>
              update((x) => ({
                ...x,
                triggers: { ...x.triggers, largeBulkOrder: { ...x.triggers.largeBulkOrder, enabled: v } }
              }))
            }
            footer={
              <RangeRow
                label={ns.sensitivity}
                value={d.triggers.largeBulkOrder.minAmountUsd}
                min={1000}
                max={50000}
                format={(n) => `$${n.toLocaleString()}`}
                onChange={(n) =>
                  update((x) => ({
                    ...x,
                    triggers: { ...x.triggers, largeBulkOrder: { ...x.triggers.largeBulkOrder, minAmountUsd: n } }
                  }))
                }
                hint={p.unitUsd}
              />
            }
          />

          <TriggerCard
            title={ns.alertPayoutTitle}
            description={ns.alertPayoutDesc}
            borderClass="border-l-4 border-primary"
            iconWrapperClassName="bg-primary-fixed text-on-primary-fixed-variant"
            icon={<Wallet className="h-5 w-5" />}
            enabled={d.triggers.failedPayout.enabled}
            onEnabledChange={(v) =>
              update((x) => ({ ...x, triggers: { ...x.triggers, failedPayout: { enabled: v } } }))
            }
            footer={
              <p className="text-[11px] text-on-surface-variant">
                <span className="font-bold text-on-surface">{p.retryPolicy}:</span> {p.retryPolicyValue}
              </p>
            }
          />

          <TriggerCard
            title={ns.alertDbTitle}
            description={ns.alertDbDesc}
            borderClass="border-l-4 border-secondary"
            iconWrapperClassName="bg-secondary-container text-on-secondary-container"
            icon={<Database className="h-5 w-5" />}
            enabled={d.triggers.databaseLatency.enabled}
            onEnabledChange={(v) =>
              update((x) => ({
                ...x,
                triggers: { ...x.triggers, databaseLatency: { ...x.triggers.databaseLatency, enabled: v } }
              }))
            }
            footer={
              <RangeRow
                label={ns.latency}
                value={d.triggers.databaseLatency.maxP99Ms}
                min={50}
                max={1000}
                format={(n) => `${n} ms`}
                onChange={(n) =>
                  update((x) => ({
                    ...x,
                    triggers: { ...x.triggers, databaseLatency: { ...x.triggers.databaseLatency, maxP99Ms: n } }
                  }))
                }
                hint={p.unitMs}
              />
            }
          />
        </div>
      </div>

      <div className="space-y-4 lg:col-span-4">
        <h2 className="font-heading text-xl font-bold text-on-surface">{p.channelsTitle}</h2>
        <div className="space-y-4 rounded-2xl border border-outline/10 bg-surface-container-low p-6">
          <DeliveryRow
            icon={<MessageSquare className="h-5 w-5 text-primary" aria-hidden />}
            title={ns.slackTitle}
            subtitle={ns.slackHint}
            enabled={d.delivery.slackWebhook.enabled}
            onEnabledChange={(v) =>
              update((x) => ({
                ...x,
                delivery: { ...x.delivery, slackWebhook: { ...x.delivery.slackWebhook, enabled: v } }
              }))
            }
            extra={
              <div className="mt-2 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-outline">{p.channelLabel}</span>
                <Input
                  value={d.delivery.slackWebhook.channelLabel ?? ''}
                  onChange={(e) =>
                    update((x) => ({
                      ...x,
                      delivery: { ...x.delivery, slackWebhook: { ...x.delivery.slackWebhook, channelLabel: e.target.value || null } }
                    }))
                  }
                  className="rounded-lg font-mono text-sm"
                  placeholder="#ops-alerts"
                />
              </div>
            }
          />
          <DeliveryRow
            icon={<Mail className="h-5 w-5 text-primary" aria-hidden />}
            title={ns.emailDigestTitle}
            subtitle={ns.emailDigestHint}
            enabled={d.delivery.adminDigestEmail.enabled}
            onEnabledChange={(v) =>
              update((x) => ({ ...x, delivery: { ...x.delivery, adminDigestEmail: { enabled: v } } }))
            }
          />
          <DeliveryRow
            icon={<Smartphone className="h-5 w-5 text-primary" aria-hidden />}
            title={ns.smsTitle}
            subtitle={ns.smsHint}
            enabled={d.delivery.smsCritical.enabled}
            onEnabledChange={(v) =>
              update((x) => ({ ...x, delivery: { ...x.delivery, smsCritical: { enabled: v } } }))
            }
          />
          <DeliveryRow
            icon={<Webhook className="h-5 w-5 text-primary" aria-hidden />}
            title={p.deliveryWebhook}
            subtitle={p.deliveryWebhookHint}
            enabled={d.delivery.customWebhook.enabled}
            onEnabledChange={(v) =>
              update((x) => ({
                ...x,
                delivery: { ...x.delivery, customWebhook: { ...x.delivery.customWebhook, enabled: v } }
              }))
            }
            extra={
              <div className="mt-2 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-outline">{p.webhookUrlFieldLabel}</span>
                <Input
                  value={d.delivery.customWebhook.endpointUrl ?? ''}
                  onChange={(e) =>
                    update((x) => ({
                      ...x,
                      delivery: { ...x.delivery, customWebhook: { ...x.delivery.customWebhook, endpointUrl: e.target.value || null } }
                    }))
                  }
                  className="rounded-lg font-mono text-sm"
                  placeholder="https://"
                />
              </div>
            }
          />
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-2 border-dashed border-primary/25 py-6 text-xs font-bold text-primary hover:bg-primary/5"
            disabled
          >
            {p.addChannelSoon}
          </Button>
        </div>
      </div>
    </section>
  )
}
