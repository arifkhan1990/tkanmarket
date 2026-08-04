import type { PageLike } from '@/lib/crawler/browser'

type SetViewport = { setViewportSize(viewport: { width: number; height: number }): Promise<void> }

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
 ] as const

function pick<T>(arr: readonly T[]): T {
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx] as T
}

export function pickUserAgent(): string {
  return pick(USER_AGENTS)
}

export function randomViewport(): { width: number; height: number } {
  const widths = [1280, 1366, 1440, 1536, 1600, 1680, 1920] as const
  const heights = [720, 768, 800, 900, 960, 1080] as const
  return { width: pick(widths), height: pick(heights) }
}

export async function hardenPage(page: PageLike): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    ;(window as unknown as Record<string, unknown>)['__playwright'] = undefined
    ;(window as unknown as Record<string, unknown>)['__pw_manual'] = undefined

    const fakePlugin = (name: string, filename: string, mimeType: string) => {
      const plugin = { name, filename, description: name, length: 1 } as Plugin
      const mime = { type: mimeType, suffixes: '', description: '', enabledPlugin: plugin } as MimeType
      Object.defineProperty(plugin, '0', { get: () => mime })
      return plugin
    }
    const fakePlugins = [
      fakePlugin('Chrome PDF Plugin', 'internal-pdf-viewer', 'application/x-google-chrome-pdf'),
      fakePlugin('Chrome PDF Viewer', 'mhjfbmdgcfjbbpaeojofohoefgiehjai', 'application/pdf'),
      fakePlugin('Native Client', 'internal-nacl-plugin', 'application/x-nacl')
    ]
    Object.defineProperty(navigator, 'plugins', {
      get: () =>
        Object.assign(fakePlugins, {
          length: fakePlugins.length,
          item: (i: number) => fakePlugins[i] ?? null,
          namedItem: (n: string) => fakePlugins.find((p) => p.name === n) ?? null,
          refresh: () => undefined
        })
    })
    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => {
        const mimes = fakePlugins.map((p) => (p as unknown as Record<string, unknown>)['0'] as MimeType)
        return Object.assign(mimes, {
          length: mimes.length,
          item: (i: number) => mimes[i] ?? null,
          namedItem: (t: string) => mimes.find((m) => m.type === t) ?? null
        })
      }
    })

    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en-US', 'en'] })
    Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' })
    Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' })
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })

    ;(window as unknown as Record<string, unknown>)['chrome'] = {
      app: {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
      },
      runtime: {
        OnInstalledReason: {},
        OnRestartRequiredReason: {},
        PlatformArch: {},
        PlatformNaclArch: {},
        PlatformOs: {},
        RequestUpdateCheckStatus: {}
      },
      csi: () => ({ onloadT: Date.now(), startE: Date.now(), pageT: Date.now(), tran: 15 }),
      loadTimes: () => ({
        commitLoadTime: Date.now() / 1000,
        connectionInfo: 'h2',
        finishDocumentLoadTime: 0,
        finishLoadTime: 0,
        firstPaintAfterLoadTime: 0,
        firstPaintTime: 0,
        navigationType: 'Other',
        npnNegotiatedProtocol: 'h2',
        requestTime: Date.now() / 1000,
        startLoadTime: Date.now() / 1000,
        wasAlternateProtocolAvailable: false,
        wasFetchedViaSpdy: true,
        wasNpnNegotiated: true
      })
    }

    const origQuery = navigator.permissions.query.bind(navigator.permissions)
    navigator.permissions.query = (parameters: PermissionDescriptor) =>
      parameters.name === 'notifications'
        ? Promise.resolve({
            state: 'denied',
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            dispatchEvent: () => false
          } as unknown as PermissionStatus)
        : origQuery(parameters)
  })

  await page.setExtraHTTPHeaders({
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7'
  })

  const v = randomViewport()
  const withViewport = page as unknown as Partial<SetViewport>
  if (typeof withViewport.setViewportSize === 'function') {
    await withViewport.setViewportSize(v)
  }
}

