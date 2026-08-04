import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { eq, isNull, and } from 'drizzle-orm'

const slug = 'костюмно-плательная-ткань-нейлон-рома-ms888z1h-0'

async function test() {
  try {
    const db = getDb()
    console.log('DB connected')
    const rows = await db
      .select()
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.slug, slug), eq(fabrics.status, 'approved')))
      .limit(1)
    
    console.log('Rows found:', rows.length)
    console.log('Row:', JSON.stringify(rows[0], null, 2))
  } catch (e) {
    console.error('Error:', e)
  }
}

test()
