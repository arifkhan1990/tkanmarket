import type { FabricCompositionItem } from '@/types/fabric'

export interface ElitePromptFabricData {
  titleEn?: string | null
  titleRu?: string | null
  fabricType?: string | null
  gsm?: number | null
  color?: string | null
  colorEn?: string | null
  composition?: FabricCompositionItem[] | null
  usageRu?: string | null
  usageEn?: string | null
  descriptionRu?: string | null
  descriptionEn?: string | null
  tags?: string[] | null
}

export interface ElitePromptConfig {
  type: string
  label: string
  prompt: string
  count: number
}

type DesignCategory = 'EMBELLISHED' | 'LUXURY' | 'UTILITY'

interface DesignInference {
  category: DesignCategory
  detail: string
}

const ANTI_ARTIFACT_PROTOCOL =
  ' STRICT REJECTION PROTOCOL — ANTI-ARTIFACTS: ABSOLUTELY NO human anatomy (hands, fingers, skin), scissors, safety pins, plastic clips, barcode tags, measuring tapes, workspace clutter, or handwritten paper notes. Backgrounds must be sterile, seamless corporate studio environments (10% neutral gray or cyclorama soft white).'

const EMBELLISHED_KEYWORDS = [
  'пайетк', 'sequin', 'блестк', 'glitter', 'вышивк', 'embroid', 'люрекс', 'lurex', 'принт', 'print',
  'узор', 'pattern', 'жаккард', 'jacquard', 'brocade', 'парча', 'металлик', 'metallic', 'foil', 'фольг'
]

const LUXURY_KEYWORDS = [
  'бархат', 'velvet', 'шелк', 'шёлк', 'silk', 'атлас', 'satin', 'шифон', 'chiffon', 'органза', 'organza',
  'тафта', 'taffeta', 'grosgrain', 'moire', 'муар', 'шелковист', 'silky', 'гламур', 'glamour', 'люкс', 'luxury'
]

const UTILITY_KEYWORDS = [
  'костюмн', 'suit', 'джинс', 'denim', 'трикотаж', 'knit', 'jersey', 'хлопок', 'cotton', 'лен', 'linen',
  'canvas', 'холст', 'твид', 'tweed', 'twil', 'саржа', 'габардин', 'gabardine', 'twill', 'poplin', 'поплин'
]

const COLOR_UPGRADES: Array<{ keys: string[]; name: string }> = [
  { keys: ['blue', 'navy', 'azure', 'indigo', 'cyan', 'teal', 'синий', 'голубой'], name: 'Deep Royal Sapphire Blue' },
  { keys: ['black', 'obsidian', 'charcoal', 'ebony', 'черный', 'чёрный'], name: 'Classic Onyx Black' },
  { keys: ['white', 'ivory', 'cream', 'ecru', 'off-white', 'белый', 'крем'], name: 'Pantone Arctic Pearl White' },
  { keys: ['red', 'crimson', 'scarlet', 'burgundy', 'bordeaux', 'maroon', 'красный', 'бордо'], name: 'Pantone Crimson Royal Red' },
  { keys: ['pink', 'rose', 'blush', 'salmon', 'розовый'], name: 'Pantone Muted Rose Quartz' },
  { keys: ['green', 'emerald', 'olive', 'sage', 'forest', 'mint', 'зеленый', 'зелёный'], name: 'Pantone Emerald Forest Green' },
  { keys: ['yellow', 'gold', 'mustard', 'amber', 'желтый', 'жёлтый'], name: 'Antique Champagne Gold' },
  { keys: ['purple', 'violet', 'lilac', 'lavender', 'plum', 'фиолетовый', 'сиреневый'], name: 'Pantone Royal Amethyst' },
  { keys: ['brown', 'beige', 'tan', 'khaki', 'camel', 'taupe', 'коричневый', 'бежевый'], name: 'Warm Camel Beige' },
  { keys: ['grey', 'gray', 'graphite', 'silver', 'ash', 'серый'], name: 'Pantone Silver Graphite' },
  { keys: ['orange', 'coral', 'terracotta', 'apricot', 'оранжевый'], name: 'Pantone Burnt Terracotta Orange' }
]

const LIGHT_COLOR_FALLBACKS = ['Pantone Bleached Sand Cream, dye-lot consistent', 'Pantone Muted Rose Quartz, dye-lot consistent']
const HEAVY_COLOR_FALLBACKS = ['Pantone Silver Graphite, dye-lot consistent', 'Classic Onyx Black, dye-lot consistent']

const GARMENT_PATTERNS: Array<{ keys: string[]; garment: string }> = [
  { keys: ['evening', 'gown', 'вечерн', 'бальное'], garment: 'elegant floor-length evening gown' },
  { keys: ['trench', 'overcoat', 'coat', 'пальто', 'плащ'], garment: 'structured trench coat' },
  { keys: ['blazer', 'suit', 'пиджак', 'костюм'], garment: 'sharp tailored blazer' },
  { keys: ['jacket', 'куртка'], garment: 'high-end structured jacket' },
  { keys: ['trousers', 'pants', 'брюки'], garment: 'tailored flat-front trousers' },
  { keys: ['dress', 'платье'], garment: 'refined tailored dress' },
  { keys: ['shirt', 'blouse', 'рубашк', 'блузк'], garment: 'crisp tailored dress shirt' },
  { keys: ['skirt', 'юбк'], garment: 'sharp pencil skirt' }
]

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase()
}

function formatComposition(composition: FabricCompositionItem[] | null | undefined): string {
  if (!composition || composition.length === 0) return 'premium textile'
  return composition
    .map((c) => (c.percentage != null ? `${c.percentage}% ${c.material}` : c.material))
    .filter(Boolean)
    .join(', ')
}

function detectColor(fabric: ElitePromptFabricData): string | null {
  const haystack = [
    fabric.color,
    fabric.colorEn,
    fabric.titleEn,
    fabric.titleRu,
    fabric.fabricType,
    ...(fabric.tags ?? [])
  ]
    .filter((v): v is string => Boolean(v))
    .join(' ')
    .toLowerCase()

  for (const upgrade of COLOR_UPGRADES) {
    if (upgrade.keys.some((k) => haystack.includes(k))) return upgrade.name
  }
  return null
}

function resolveFinalColor(fabric: ElitePromptFabricData): string {
  const detected = detectColor(fabric)
  if (detected) return detected

  const gsm = fabric.gsm ?? null
  if (gsm !== null && gsm < 180) {
    return LIGHT_COLOR_FALLBACKS[gsm % LIGHT_COLOR_FALLBACKS.length] as string
  }
  if (gsm !== null) {
    return HEAVY_COLOR_FALLBACKS[gsm % HEAVY_COLOR_FALLBACKS.length] as string
  }
  return 'Pantone Bleached Sand Cream, dye-lot consistent'
}

function inferDesign(fabric: ElitePromptFabricData): DesignInference {
  const ft = normalize(fabric.fabricType)
  const title = normalize(`${fabric.titleEn} ${fabric.titleRu}`)
  const comp = formatComposition(fabric.composition).toLowerCase()
  const tags = normalize((fabric.tags ?? []).join(' '))
  const haystack = `${ft} ${title} ${comp} ${tags}`

  if (EMBELLISHED_KEYWORDS.some((k) => haystack.includes(k))) {
    return {
      category: 'EMBELLISHED',
      detail: 'intricate texture replication, sharp specular highlights on each individual embellishment, crisp definition of the pattern repeats, and multi-directional light interactions with the metallic/glossy elements'
    }
  }
  if (LUXURY_KEYWORDS.some((k) => haystack.includes(k))) {
    return {
      category: 'LUXURY',
      detail: 'luxurious pile depth, multi-directional light catching sheen, deep micro-shadows within the folds, and realistic surface specularity'
    }
  }
  return {
    category: 'UTILITY',
    detail: 'high-density interlocking warp and weft weave, matte finish, uniform thread-count, subtle micro-fuzz, and structural weight distribution'
  }
}

function inferTargetGarment(fabric: ElitePromptFabricData): string {
  const use = normalize(`${fabric.usageEn} ${fabric.usageRu} ${fabric.descriptionEn} ${fabric.descriptionRu}`)
  const ft = normalize(fabric.fabricType)
  const gsm = fabric.gsm ?? null

  for (const pattern of GARMENT_PATTERNS) {
    if (pattern.keys.some((k) => use.includes(k))) return pattern.garment
  }

  if (ft.includes('knit')) return 'sharp tailored blazer'
  if (ft.includes('lace') || ft.includes('silk') || ft.includes('satin')) return 'elegant floor-length evening gown'
  if (ft.includes('denim') || ft.includes('canvas') || (gsm !== null && gsm >= 250)) return 'structured trench coat'
  return 'sharp tailored blazer'
}

function buildPrompt(
  template: string,
  ctx: {
    productName: string
    finalColor: string
    gsm: string
    composition: string
    targetGarment: string
    design: DesignInference
  }
): string {
  const body = template
    .replaceAll('{{PRODUCT_NAME}}', ctx.productName)
    .replaceAll('{{FINAL_COLOR}}', ctx.finalColor)
    .replaceAll('{{WEIGHT}}', ctx.gsm)
    .replaceAll('{{COMPOSITION}}', ctx.composition)
    .replaceAll('{{TARGET_GARMENT}}', ctx.targetGarment)
    .replaceAll('{{DESIGN_DETAIL}}', ctx.design.detail)
  return body + ANTI_ARTIFACT_PROTOCOL
}

export class EliteImagePromptService {
  /**
   * True when the raw fabric data carries 2+ physical fabric sheets (raw photos,
   * ignoring AI `/generated/` images). When this is the case the prompt engine
   * adds an "open multi-sheet" group shot that shows every sheet together.
   */
  static hasMultipleFabricSheets(imageUrls: string[] | null): boolean {
    const rawImages = (imageUrls ?? []).filter((url) => !url.includes('/generated/'))
    return rawImages.length >= 2
  }

  /** Open multi-sheet group shot — shows every fabric sheet from the raw data spread open together. */
  static openSheetsConfig(fabric: ElitePromptFabricData): ElitePromptConfig {
    const productName = fabric.titleEn ?? fabric.titleRu ?? 'Fabric'
    const finalColor = resolveFinalColor(fabric)
    const design = inferDesign(fabric)
    const gsm = fabric.gsm != null ? String(fabric.gsm) : 'premium-weight'
    const composition = formatComposition(fabric.composition)

    const ctx = {
      productName,
      finalColor,
      gsm,
      composition,
      targetGarment: '',
      design
    }

    return {
      type: 'openSheets',
      label: 'Open Multi-Sheet Shot',
      prompt: buildPrompt(
        'Open fabric sheet showcase: multiple full-width sheets of {{PRODUCT_NAME}} fabric in {{FINAL_COLOR}} spread open flat, side by side, on a seamless studio surface. If the reference raw image contains a stack or arrangement of multiple color cut swatches or multiple fabric sheets, the open sheets MUST be arranged in the exact same color and content sequence as the raw reference, with every sheet keeping its own exact shade and finish. High-fidelity capture of the exact {{WEIGHT}} g/m² texture structure and fiber density, perfectly rendering the unique surface details, weaves, or embellishments of each sheet — {{DESIGN_DETAIL}}. Shot with a Hasselblad H6D-100c, 100mm macro lens, f/8 aperture for deep field of view. Studio cyclorama background, crisp diffused lighting that eliminates glare on every sheet, photorealistic, 8k resolution, immaculate detail.',
        ctx
      ),
      count: 1
    }
  }

  static generatePrompts(fabric: ElitePromptFabricData, options?: { hasMultipleSheets?: boolean }): ElitePromptConfig[] {
    const productName = fabric.titleEn ?? fabric.titleRu ?? 'Fabric'
    const finalColor = resolveFinalColor(fabric)
    const design = inferDesign(fabric)
    const targetGarment = inferTargetGarment(fabric)
    const gsm = fabric.gsm != null ? String(fabric.gsm) : 'premium-weight'
    const composition = formatComposition(fabric.composition)

    const ctx = {
      productName,
      finalColor,
      gsm,
      composition,
      targetGarment,
      design
    }

    const prompts: ElitePromptConfig[] = [
      {
        type: 'fabricRoll',
        label: 'Fabric Roll Shot',
        prompt: buildPrompt(
          'Commercial product catalog photography of luxury textile bolts of {{PRODUCT_NAME}}, standing vertically in a high-end photographic studio. If the reference raw image contains a stack or arrangement of different color cut swatches, the fabric rolls MUST be arranged in the exact same color and content sequence as the raw swatch stack (featuring {{FINAL_COLOR}}). High-fidelity close-up capturing the exact {{WEIGHT}} g/m² texture structure and fiber density, perfectly rendering the unique surface details, weaves, or embellishments — {{DESIGN_DETAIL}}. Shot with a Hasselblad H6D-100c, 100mm macro lens, f/8 aperture for deep field of view. Studio cyclorama background, crisp lighting with a soft bounce card to accentuate the natural material finish, photorealistic, 8k resolution, immaculate detail.',
          ctx
        ),
        count: 1
      },
      {
        type: 'foldedStack',
        label: 'Folded Stack Shot',
        prompt: buildPrompt(
          'Industrial textile showcase of {{PRODUCT_NAME}} in pristine {{FINAL_COLOR}}. A neat, laser-cut stack of fabric squares folded with mathematical precision, showcasing perfectly aligned geometric edges. Macro photography emphasizing the detailed thread structure, complex surface patterns, or intricate embellishments — {{DESIGN_DETAIL}}. Rim lighting setup combined with clean overhead diffused softbox to highlight the unique material sheen and surface specularity. Shot on 50mm anamorphic lens, hyper-sharp focus, commercial print-ready quality.',
          ctx
        ),
        count: 1
      },
      {
        type: 'elegantDrape',
        label: 'Elegant Drape Shot',
        prompt: buildPrompt(
          'A majestic high-fashion display of premium {{PRODUCT_NAME}} in luxurious {{FINAL_COLOR}}. The fabric is elegantly draped and suspended, cascading into deep fluid volumetric folds and graceful organic sweeps, illustrating the material\'s specific drape profile, structural weight, and the precise way light and shadow interact with its unique finish (whether matte weave or shimmering embellishments) — {{DESIGN_DETAIL}}. Soft cinematic three-point lighting creating subtle tonal gradients in the shadows. Shot from a high-angle 3/4 perspective, sharp micro-textures visible, rendering style mimicking Octane Render realism, commercial marketplace standard.',
          ctx
        ),
        count: 1
      },
      {
        type: 'flatLay',
        label: 'Flat Lay Open Shot',
        prompt: buildPrompt(
          'A top-down ultra-sharp flat lay photograph of a completely flat, tensioned, unrolled sheet of {{PRODUCT_NAME}} fabric in a rich {{FINAL_COLOR}}. The textile is spread seamlessly across a modern minimalist concrete styling table, beautifully showcasing the full repeat of the pattern, weave consistency, or embroidery dispersion across the entire width — {{DESIGN_DETAIL}}. Perfect edge-to-edge sharpness, balanced dual-softbox lighting setup eliminating all center hot-spots, lookbook catalog aesthetic, professional e-commerce grid layout.',
          ctx
        ),
        count: 1
      },
      {
        type: 'tailoredGarment',
        label: 'Tailored Garment Shot',
        prompt: buildPrompt(
          'High-end commercial fashion lookbook photography of a premium {{TARGET_GARMENT}}, meticulously tailored and constructed from this exact {{FINAL_COLOR}} {{PRODUCT_NAME}} fabric ({{COMPOSITION}}). Displayed on an invisible minimalist ghost mannequin against a solid soft warm gray background. Sharp focus on the double-needle stitched seams, clean edges, and how the texture/embellishment shapes the final outfit — {{DESIGN_DETAIL}}. Editorial studio lighting, crisp specular reflections on the material details, commercial fashion grade.',
          ctx
        ),
        count: 1
      }
    ]

    if (options?.hasMultipleSheets) {
      prompts.push(this.openSheetsConfig(fabric))
    }

    return prompts
  }
}
