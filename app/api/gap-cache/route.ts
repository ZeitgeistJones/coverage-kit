import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS gap_cache (
      id SERIAL PRIMARY KEY,
      org TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      gaps JSONB NOT NULL,
      scanned_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(org, channel_id)
    )
  `
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const org = searchParams.get('org')
    const channelId = searchParams.get('channelId')
    if (!org || !channelId) return NextResponse.json({ cache: null })

    await ensureTable()
    const result = await sql`
      SELECT gaps, scanned_at FROM gap_cache WHERE org = ${org} AND channel_id = ${channelId}
    `
    if (result.rows.length === 0) return NextResponse.json({ cache: null })
    return NextResponse.json({ cache: result.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ cache: null })
  }
}

export async function POST(req: Request) {
  try {
    const { org, channelId, gaps } = await req.json()
    await ensureTable()
    await sql`
      INSERT INTO gap_cache (org, channel_id, gaps)
      VALUES (${org}, ${channelId}, ${JSON.stringify(gaps)})
      ON CONFLICT (org, channel_id) DO UPDATE SET gaps = ${JSON.stringify(gaps)}, scanned_at = NOW()
    `
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
