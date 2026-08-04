import { and, count, eq, isNull } from 'drizzle-orm'

import { getDb } from './index'
import { fabricPromptRules } from './schema'
import { logger } from '../lib/logger'

const DEFAULT_RULES = [
  {
    name: 'Default — All Fabrics',
    description: 'Fallback rule for any fabric that does not match a more specific rule. Empty conditions so it always matches at lowest priority.',
    priority: 999,
    isActive: true,
    conditions: [],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Fabric Flat Lay',
        prompt: 'Professional e-commerce product photo of {color} {fabricType} fabric {title} based strictly on the user-provided reference image. Preserve the exact texture, pattern, and color tone from the user uploaded fabric image. Top-down flat lay view showing full texture and color accuracy. Studio softbox lighting, high resolution, sharp focus across the frame.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Fabric Roll & Cut Swatch Set',
        prompt: 'If the reference image shows multiple small fabric cuts or swatches, generate full individual commercial fabric rolls for each cut, precisely matching the color tone, weave structure, and material pattern of that specific cut swatch. Show both the full fabric roll and detailed fabric drape for each color swatch present in the input reference image.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Texture Close-up',
        prompt: 'Ultra close-up macro shot matching the exact fiber weave and color of the user-provided fabric image. Maximum sharpness, high contrast lighting, fine textile details visible at thread level. Square 1:1 format for product thumbnail, clean background.',
        count: 1
      }
    ],
    videoPrompt: 'Smooth slow pan across {color} {fabricType} fabric {title} generated based on the user uploaded reference image, matching its exact color swatch and texture. Soft studio lighting, professional B2B product showcase style. Fabric gently rippling to show drape and movement.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Premium Silk, Satin & Lightweight Fabrics',
    description: 'High-end image prompts for silk, satin, chiffon, organza and all lightweight drapey fabrics. Highlights sheen, luster, and fluid movement.',
    priority: 100,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'in', value: ['woven', 'lining'] },
      { field: 'gsm', operator: 'lte', value: 120 }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Sheen & Drape Shot',
        prompt: 'Luxury product photograph of {color} silk fabric {title} artfully draped to showcase natural sheen and fluid drape. Soft directional window lighting creating glowing highlights across the fabric surface. The fabric appears to flow and cascade, shot on a marble surface. High-end e-commerce editorial style, warm color tones.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Luxury Fashion Context',
        prompt: 'Elegant editorial photograph of {color} lightweight fabric {title} being made into an evening gown or bridal piece. A fashion designer draping the fabric on a dress form with delicate lace trims nearby. Soft golden hour window light filters through the translucent fabric creating an ethereal glow. Luxury atelier setting, romantic and aspirational mood.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Fiber Sheen Macro',
        prompt: 'Macro photograph of {color} silk fabric {title} fibers catching and refracting light. The weave pattern is sharply defined with individual filaments visible. Soft shimmer effect across the frame, rich color saturation. Square 1:1 format, clean dark background for contrast, product thumbnail quality.',
        count: 1
      }
    ],
    videoPrompt: 'Luxurious 5-second reel of {color} silk fabric {title} flowing and cascading in slow motion. Camera follows the fabric movement as it drapes and catches light. Warm golden highlights shimmer across the surface. Elegant, smooth cinematography with shallow depth of field. High-end textile showcase.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Denim, Canvas & Heavy Woven',
    description: 'Image-optimized prompts for denim, canvas, twill, and heavy woven fabrics above 250 GSM. Focus on durability, thickness, and weave texture.',
    priority: 100,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'equals', value: 'woven' },
      { field: 'gsm', operator: 'gte', value: 250 }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Heavy Fabric Texture',
        prompt: 'Professional product shot of {color} heavy woven fabric {title} on a neutral studio background. Fabric folded to clearly show thickness, weight, and the rugged twill or canvas weave. Industrial-style hard lighting casting subtle shadows to emphasize the raised yarn texture. E-commerce catalog photo with accurate color reproduction.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Workwear Application',
        prompt: 'Lifestyle photograph of {color} durable fabric {title} being used in workwear or outerwear production. A tailor cutting the thick fabric with heavy shears, showing the material density and durability. Workshop environment with natural light from large windows. Rustic industrial aesthetic, authentic and grounded mood.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Twill Weave Macro',
        prompt: 'Extreme close-up macro shot of {color} heavy woven fabric {title} diagonal twill weave pattern. High-contrast raking light emphasizes every raised yarn and depression. Rugged texture visible with thread-level detail. Square 1:1 product thumbnail format, neutral gray background.',
        count: 1
      }
    ],
    videoPrompt: 'Bold 5-second video of {color} heavy woven fabric {title}. Camera slowly pans across the diagonal twill weave with dramatic side lighting that reveals every texture detail. Fabric is folded and bent to demonstrate stiffness and durability. Industrial aesthetic, sharp and crisp cinematography.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Knit, Jersey & Stretch Fabrics',
    description: 'Image-focused prompts for knit fabrics, jersey, interlock, rib knit, and all stretch textiles. Emphasizes flexibility, softness, and stitch definition.',
    priority: 100,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'equals', value: 'knit' }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Knit Stretch Shot',
        prompt: 'Studio product photo of {color} knit fabric {title} gently stretched to reveal the knit loop structure and stretch properties. Soft diffused lighting, the fabric is held by hands showing its flexibility and recovery. Clean white background, casual lifestyle catalog aesthetic. High resolution, color-accurate lighting.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Comfort Apparel Context',
        prompt: 'Warm lifestyle photograph of {color} knit fabric {title} being used to create cozy casual apparel. A seamstress working with the stretchy material on a sewing machine, soft natural window light. Comfortable homely atmosphere, the fabric looks soft and inviting. Authentic artisan workshop setting, warm color palette.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Knit Loop Macro',
        prompt: 'Macro close-up of {color} knit fabric {title} loop structure with fabric slightly stretched to separate the stitches. Each yarn twist and fiber is visible in sharp focus. Soft natural lighting, warm tones. Square 1:1 product thumbnail format, light background.',
        count: 1
      }
    ],
    videoPrompt: 'Casual 5-second product video of {color} knit fabric {title}. Fabric is gently stretched and released to demonstrate elasticity and recovery. Close-up of the knit loop structure moving and flexing. Soft natural lighting, warm and approachable mood. Fabric drapes and folds naturally throughout the shot.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Lace, Embroidery & Sheer',
    description: 'Specialized image prompts for delicate lace, embroidered, tulle, organza, and sheer fabrics highlighting intricate patterns, transparency, and craftsmanship.',
    priority: 100,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'equals', value: 'lace' }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Lace Detail Spread',
        prompt: 'Professional macro product photograph of {color} lace fabric {title} spread flat on a dark mannequin or surface. Intricate floral patterns, openwork, and scalloped edges are clearly visible. High-contrast backlighting illuminates the transparency and thread detail. Studio quality e-commerce catalog shot with dramatic shadows.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Bridal & Evening Context',
        prompt: 'Romantic editorial photograph of {color} lace fabric {title} used in bridal or evening wear. Soft diffused golden light creates a dreamy atmosphere as the lace overlay catches light. The fabric appears delicate and luxurious, flowing naturally. Wedding or red-carpet aesthetic, shallow depth of field, warm ethereal mood.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Lace Pattern Macro',
        prompt: 'Extreme close-up of {color} lace fabric {title} showing individual threadwork and motif details. Dark background creates dramatic contrast making the delicate pattern pop. Every thread and loop is in perfect sharp focus. Square 1:1 product thumbnail format.',
        count: 1
      }
    ],
    videoPrompt: 'Elegant 5-second slow-motion reel of {color} lace fabric {title}. Close-up details of lace patterns and openwork with soft backlight creating a glowing effect. The fabric moves gently, revealing its transparency and intricate design. Romantic cinematography with shallow depth of field. Luxury bridal textile showcase.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Technical, Performance & Sport',
    description: 'Video-optimized prompts for technical textiles, sportswear fabrics, and performance materials. Focus on water resistance, breathability, and functionality.',
    priority: 100,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'equals', value: 'technical' }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Tech Fabric Close-up',
        prompt: 'Sharp clinical studio photograph of {color} technical fabric {title} on a dark gradient background. Precise weave structure and any coating or membrane are clearly visible. Water droplets bead up on the surface demonstrating water resistance. High-tech aesthetic with cool color temperature, scientific precision lighting.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Performance Action',
        prompt: 'Dynamic action-oriented lifestyle photo of {color} technical fabric {title} used in outdoor sportswear or gear. Athletic movement context with dramatic lighting. Water beading and rolling off the surface. Active lifestyle aesthetic, motion blur suggesting action, outdoor environment with natural elements.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Tech Weave Macro',
        prompt: 'Macro close-up of {color} technical fabric {title} precision weave and functional coating. Technical industrial aesthetic with sharp contrast and cool lighting. Microscopic detail of fibers and membrane structure visible. Square 1:1 product thumbnail on a dark high-contrast background.',
        count: 1
      }
    ],
    videoPrompt: 'Fast-paced 5-second product showcase of {color} technical fabric {title}. Water resistance test in action — water beads up and rolls off the surface. Dynamic camera movement around the fabric with dramatic side lighting. Close-up of the precision weave. Performance textile testing aesthetic, energetic editing.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Nonwoven & Industrial Materials',
    description: 'Video-optimized prompts for nonwoven fabrics, felts, interfacing, and industrial textile materials. Focus on structure, application, and functionality.',
    priority: 100,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'equals', value: 'nonwoven' }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Nonwoven Structure',
        prompt: 'Technical product photograph of {color} nonwoven fabric {title} showing the fiber web structure. Clean studio lighting reveals the random fiber orientation and material density. Fabric edge cut cleanly to show thickness. Industrial catalog style, neutral background with accurate color and texture reproduction.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Industrial Application',
        prompt: 'Applied context photograph of {color} nonwoven fabric {title} being used in an industrial or manufacturing setting. The material is shown in a practical application like filtration, packaging, or construction. Factory or warehouse environment with functional lighting. Technical B2B aesthetic showing real-world utility.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Fiber Web Macro',
        prompt: 'Macro shot of {color} nonwoven fabric {title} fiber entanglement and web structure. Sharp focus on the random fiber matrix with depth showing the material thickness. Neutral industrial lighting. Square 1:1 product thumbnail format on light background.',
        count: 1
      }
    ],
    videoPrompt: 'Technical 5-second video of {color} nonwoven fabric {title}. Slow pan across the material revealing the fiber web structure. Fabric is shown being cut, folded, or handled to demonstrate its unique properties. Clean industrial lighting, B2B technical product showcase. Professional manufacturing aesthetic.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'B2B Product Reel — All Fabrics',
    description: 'Short-form video-optimized rule producing punchy 5-second product reels for any fabric. Best for social media and quick product showcases.',
    priority: 200,
    isActive: true,
    conditions: [],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Quick Catalog Shot',
        prompt: 'Clean product photo of {color} {fabricType} fabric {title} on white background. Studio softbox lighting, accurate color and texture reproduction. E-commerce catalog quality, top-down flat lay view.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Application Shot',
        prompt: 'Lifestyle photo showing {color} {fabricType} fabric {title} in a real-world garment or product application. Soft natural lighting, authentic context showing the fabric in use. Professional B2B catalog style.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Quick Texture Close-up',
        prompt: 'Close-up of {color} {fabricType} fabric {title} texture and weave. Sharp focus, clean lighting, square format thumbnail style.',
        count: 1
      }
    ],
    videoPrompt: 'Fast-paced 5-second B2B product reel of {color} {fabricType} fabric {title}. Quick cuts showing the fabric from multiple angles — flat lay, draped, and texture close-up. Clean background, professional studio lighting throughout. Dynamic but professional, ends with a clear product reveal. Textile showcase for wholesale buyers.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  },

  {
    name: 'Luxury & Designer Reel',
    description: 'Video-first rule producing cinematic 5-second reels for high-end lining, premium woven, and specialty designer fabrics.',
    priority: 90,
    isActive: true,
    conditions: [
      { field: 'fabricType', operator: 'in', value: ['lining', 'lace'] }
    ],
    imagePrompts: [
      {
        type: 'fabricBest',
        label: 'Designer Fabric Shot',
        prompt: 'High-end editorial product photo of {color} designer fabric {title} styled in an elegant composition. Soft dramatic lighting, the fabric is artfully draped to show both color and texture. Luxury fashion catalog aesthetic, museum-quality presentation. Rich color depth and premium feel.',
        count: 2
      },
      {
        type: 'usageProduct',
        label: 'Designer Atelier',
        prompt: 'Behind-the-scenes photograph of {color} designer fabric {title} in a high-fashion atelier. A designer sketches or drapes the luxurious material on a dress form. Warm ambient light, creative studio environment with fabric swatches and design tools. Exclusive fashion house atmosphere.',
        count: 2
      },
      {
        type: 'thumbnail',
        label: 'Designer Detail',
        prompt: 'Artistic macro shot of {color} designer fabric {title} detail. Elegant composition highlighting the premium quality and craftsmanship. Shallow depth of field with soft bokeh. Square format for thumbnail, warm-toned lighting.',
        count: 1
      }
    ],
    videoPrompt: 'Cinematic 5-second reel of {color} designer fabric {title}. The fabric cascades and flows in slow motion with dramatic directional lighting creating deep shadows and bright highlights. Camera orbits around the fabric showing it from every angle. Luxury high-fashion cinematography with rich color grading. Premium textile showcase for designer buyers.',
    videoPromptEnabled: true,
    videoDurationSeconds: 5,
    videoAspectRatio: '9:16'
  }
]

export async function seedPromptRules(): Promise<number> {
  const db = getDb()

  let processed = 0
  for (const rule of DEFAULT_RULES) {
    const existing = await db
      .select({ id: fabricPromptRules.id })
      .from(fabricPromptRules)
      .where(and(eq(fabricPromptRules.name, rule.name), isNull(fabricPromptRules.deletedAt)))
      .limit(1)

    if (existing[0]?.id) {
      await db
        .update(fabricPromptRules)
        .set({
          description: rule.description,
          priority: rule.priority,
          isActive: rule.isActive,
          conditions: rule.conditions as never,
          imagePrompts: rule.imagePrompts as never,
          videoPrompt: rule.videoPrompt,
          videoPromptEnabled: rule.videoPromptEnabled,
          videoDurationSeconds: rule.videoDurationSeconds,
          videoAspectRatio: rule.videoAspectRatio,
          updatedAt: new Date()
        })
        .where(eq(fabricPromptRules.id, existing[0].id))
    } else {
      await db.insert(fabricPromptRules).values({
        name: rule.name,
        description: rule.description,
        priority: rule.priority,
        isActive: rule.isActive,
        conditions: rule.conditions as never,
        imagePrompts: rule.imagePrompts as never,
        videoPrompt: rule.videoPrompt,
        videoPromptEnabled: rule.videoPromptEnabled,
        videoDurationSeconds: rule.videoDurationSeconds,
        videoAspectRatio: rule.videoAspectRatio
      })
    }
    processed++
  }

  logger.info('Prompt rules seeded/upserted safely', { count: processed })
  return processed
}
