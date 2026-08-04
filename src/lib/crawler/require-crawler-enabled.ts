import { ForbiddenError } from '@/lib/errors'
import { SettingsService } from '@/services/admin/settings.service'

export async function requireCrawlerEnabled(): Promise<void> {
  const settings = await SettingsService.getSettings()
  if (!settings.crawlerEnabled) {
    throw new ForbiddenError('Crawler is disabled in system settings. Enable it under Crawler → Settings.')
  }
}
