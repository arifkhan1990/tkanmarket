import { eq } from 'drizzle-orm'

import { getDb } from './index'
import { fabrics } from './schema/fabrics.schema'
import type { FabricCompositionItem } from '../types/fabric'

/** Images and copy aligned with stitch/homepage/code.html (popular fabrics + category heroes). */
const SHOWCASE_FABRICS: ReadonlyArray<{
  sku: string
  titleRu: string
  priceUsd: string
  gsm: number
  widthCm: number
  moq: number
  fabricType: string
  tags: string[]
  imageUrl: string
  socialScore: number
  viewsCount: number
  composition: FabricCompositionItem[]
}> = [
  {
    sku: 'TM-40291-NV',
    titleRu: 'Габардин Премиум Нави',
    priceUsd: '4.50',
    gsm: 280,
    widthCm: 150,
    moq: 100,
    fabricType: 'woven',
    tags: ['Хлопок'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmFUTIR1NLFetGOUeZGho9g_sy7WFwdd0U42A8UwXUfbZ5I3gN5ryc0OXFGAujU91L5UoYBRmISeYzctkAkjuEhIJgPFAJ9Th4LibJplUS-C0NCMXS5m16tZVDUISvOzvUZ_6wSfFu2IqpQhCijZmPLmBOzaWV2PnZ0rD34uNFHYugzD0_All4IXtEXHltzgBNookdSdpXkaAkb9AAKPz40IMkS6eUo2s6mhcVS45l8pYOA0ID_B7fCXg4H4OhZR0fYzIfa4DaXOM',
    socialScore: 49,
    viewsCount: 1820,
    composition: [{ material: 'cotton', percentage: 100 }]
  },
  {
    sku: 'TM-10222-PK',
    titleRu: 'Шифон Розовый Кварц',
    priceUsd: '2.80',
    gsm: 65,
    widthCm: 145,
    moq: 80,
    fabricType: 'woven',
    tags: ['Полиэстер', 'Шёлк'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATBUWQ8Kyy2aB43V4MxNfEe6xEP3gCRtQfBIViQril_P5eKdyIEmHv6Tg1usvBTYhVAR8HhAi88Ddwq3iBj3gbZ_T_iksjoB-OrlFF7SLFzZrJILIucpgu2chR9_NiHGbTFKzXtA1zIG8Z4M3fc-iR9WGuJnY1d1gf3LQo1wKC6Snh_xj-4qN2lwJ7VHt7z0vByxIcZeqRtWOAAzOkANXTbueGZ-R8iPSKwo63z2kX9lC1g86e-twpGaVh1o-Q1_rYGWZ8hlDAMik',
    socialScore: 50,
    viewsCount: 2400,
    composition: [
      { material: 'polyester', percentage: 95 },
      { material: 'spandex', percentage: 5 }
    ]
  },
  {
    sku: 'TM-88210-DN',
    titleRu: 'Деним Индиго 14oz',
    priceUsd: '7.20',
    gsm: 480,
    widthCm: 160,
    moq: 120,
    fabricType: 'woven',
    tags: ['Хлопок'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB8bIZEcXMHnbRmUEFhK-709U9MuYrmmsmN4DwPHgl5YTVGrqbDercuA4jlhPkM92jnd4djVeTsWyhTu1TNsfhK-sXgJG6nTp62X0IcsRZP-e-vv3wSwMoB4Zx2ZgVuhdDL3QTERlscUxOeegYN8DyVPmlOwnQyhJdQ5fejCNN01Y35vHbxDVzf26Z-Ta2mgezoljguLH2te1YvhyakitMNCy_QObLma-hUvDh8mmep1VKLColghwmEdt-x4bKQbpjYmH8To8yDYBs',
    socialScore: 48,
    viewsCount: 980,
    composition: [{ material: 'cotton', percentage: 98 }, { material: 'spandex', percentage: 2 }]
  },
  {
    sku: 'TM-55032-BG',
    titleRu: 'Шерстяная Фланель',
    priceUsd: '12.50',
    gsm: 320,
    widthCm: 155,
    moq: 60,
    fabricType: 'woven',
    tags: ['Шерсть'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDxVAfVtKiN_iNspu11y0DRUD1ZDe418nHUH0XgocfcFsH50eK9jwjWqmOVzDC4iFPFs6K-Q7OAuSeG90f1mWYVDyy5Duqzy0V6kBuLld4I-sncHux6NjpiyezGAhXtf7HnX6BufA_EZ1_OvZrxcc0doBvDBYoKXfj4FfaCY6jRYuFVfXAsQKkm-X3skHlMOl8p7AKVUJEjFs84P0q44I-Zv2_MKaMR4Ffu0GpJ4e3UvfsWeANrkncsvaOmhlkpRFDBWOKXEtkr2hM',
    socialScore: 47,
    viewsCount: 760,
    composition: [{ material: 'wool', percentage: 100 }]
  },
  {
    sku: 'TM-20100-LN',
    titleRu: 'Льняная рубашечная плотная',
    priceUsd: '5.40',
    gsm: 210,
    widthCm: 150,
    moq: 90,
    fabricType: 'woven',
    tags: ['Лён'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUzAsM5bMO9gSoXmr3EHLQF6qR8IwkeN8ExGWPCImPL5XNF6iautMR_2wV8Wy_jibGgDtDK9eaiPVP-262qZVv20HwSx5S_IM_LLhsCI9w1bOWCP-ZK2Bps3R3Fnoq6UgxwRoBp_LDOcaozvxB57q9MK9KtSZgeR1q4NgdST8LI7n9sCvmKw1F5CYTQIjtDB-gIzQ4r9ODFNC6SFoEhNee70rEm5eo_Be4BzxCYXm2ZGmv3Jhwndzq05yaa8jkVWs9ctj86CuvXHQ',
    socialScore: 46,
    viewsCount: 540,
    composition: [{ material: 'linen', percentage: 100 }]
  },
  {
    sku: 'TM-30100-SK',
    titleRu: 'Шёлк атлас премиум',
    priceUsd: '8.90',
    gsm: 85,
    widthCm: 140,
    moq: 40,
    fabricType: 'woven',
    tags: ['Шёлк'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAVPfHWCYTuTqezqER8BV78QJlkHMiOKXTal0spliCIXT3CN3lOb4_rMyUD0Cj9N7PUQkfEqGjAh-pi4pqOaiRU7hTOgSqyv9TMIcLivP8u-9WYrROfVrJ2-H-nThQnoaobjKuew5A3EKtxdt98YJD7Qf_eTwyEe28K_14zDyW6-VxwilZFew03561slsfgp3a9quVwUI-9QbME_U1J71RttvNY6NDPhmbrBwyUTdsiohtuRcXMqpwRYus71FgmWLCjRvZLMytuiUk',
    socialScore: 48,
    viewsCount: 1120,
    composition: [{ material: 'silk', percentage: 100 }]
  },
  {
    sku: 'TM-40100-PE',
    titleRu: 'Полиэстер мемори',
    priceUsd: '3.60',
    gsm: 120,
    widthCm: 155,
    moq: 200,
    fabricType: 'woven',
    tags: ['Полиэстер'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEIaMcj-rAubq6B_B6CWbIvpMbJxYnqb4hoCI80ov7kQTIuhOf71WfFQYpRLgXgSYDXo2YNyGq7Fg-KZUHSlQ4PTT8t51A4Xx8afW25Yv6MDAUwKw3niY3EBMRjsPtve9IQMqSQIbP3esrOGO-mzGGU67_O_m35tIWtHxTHRsyDUWzLkMybttvDLVMOK9s2DnKtwAPQyTbWUXFlOoZVocJhRWgV6cAD-XTcGk2TjZK9myD_HRGnClk_hcSbyoMf1Q9REa1s6MQvDg',
    socialScore: 45,
    viewsCount: 890,
    composition: [{ material: 'polyester', percentage: 100 }]
  },
  {
    sku: 'TM-50100-KN',
    titleRu: 'Трикотаж интерлок 200 GSM',
    priceUsd: '3.20',
    gsm: 200,
    widthCm: 165,
    moq: 150,
    fabricType: 'knit',
    tags: ['Трикотаж'],
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAb-8Dip9ZVkJQmNZPPbZlft4ilaLwU8kBCLAGNhLeiyyfIC9gb9Kf5P-DKfdt5M6a8fdhWP_mdEd1fDVz4-MZRrAF95AEQTPFuZtPF5yqifMoGpuoxZ6eJl8GpG0Jhl4iXukGKTZJD72iHaoI69IaBsL1Vt56Tf9rwD-z6sZClQ48K10X-HPB9UBPRvC93hj_BcNrqy310WiCl4AOkTTp548b6uJAXfdfQL5uF5BERHH8Dew9RP-CGStlDlGgilwzM_S-MYu90iVY',
    socialScore: 44,
    viewsCount: 1340,
    composition: [
      { material: 'cotton', percentage: 92 },
      { material: 'spandex', percentage: 8 }
    ]
  }
]

function showcaseSlug(sku: string): string {
  const safe = sku.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  return `showcase-${safe}`
}

/**
 * Upserts fixed showcase fabrics so the home “Popular fabrics” section has stitch-aligned data.
 */
export async function syncShowcaseFabrics(supplierIds: number[]): Promise<void> {
  if (supplierIds.length === 0) return
  const db = getDb()
  const now = new Date()

  let index = 0
  for (const row of SHOWCASE_FABRICS) {
    const supplierId = supplierIds[index % supplierIds.length]!
    index += 1
    const slug = showcaseSlug(row.sku)

    const existing = await db.select({ id: fabrics.id }).from(fabrics).where(eq(fabrics.slug, slug)).limit(1)

    /** Same shape as `seed.ts` fabric insert so it works on DBs without newer SEO/alt columns. */
    const payload = {
      supplierId,
      slug,
      sku: row.sku,
      status: 'approved' as const,
      titleRu: row.titleRu,
      titleEn: null,
      descriptionRu: 'Демонстрационная позиция для главной страницы (макет stitch/homepage).',
      descriptionEn: null,
      metaTitleRu: null,
      metaDescriptionRu: null,
      fabricType: row.fabricType,
      gsm: row.gsm,
      widthCm: row.widthCm,
      priceUsd: row.priceUsd,
      moq: row.moq,
      composition: row.composition,
      tags: row.tags,
      images: [row.imageUrl],
      sourceUrl: null,
      rawTitle: null,
      rawDescription: null,
      aiConfidenceScore: null,
      aiProcessedAt: null,
      isFeatured: true,
      socialScore: row.socialScore,
      viewsCount: row.viewsCount,
      updatedAt: now,
      deletedAt: null
    }

    const id = existing[0]?.id
    if (id !== undefined) {
      await db.update(fabrics).set(payload).where(eq(fabrics.id, id))
    } else {
      await db.insert(fabrics).values(payload)
    }
  }
}
