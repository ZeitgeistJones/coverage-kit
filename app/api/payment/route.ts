import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const RECEIVER_CONTRACT = '0x0C1a3DB07304D2E4E551AB4A7b083382a33f25ad'
const BURN_AMOUNT_WEI = BigInt(20000)
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS usage (
      id SERIAL PRIMARY KEY,
      wallet TEXT NOT NULL,
      action TEXT NOT NULL,
      tx_hash TEXT,
      burn_tx TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')
    if (!wallet) return NextResponse.json({ scanCount: 0, genCount: 0 })
    await ensureTables()
    const scans = await sql`SELECT COUNT(*) as count FROM usage WHERE wallet = ${wallet.toLowerCase()} AND action = 'scan'`
    const gens = await sql`SELECT COUNT(*) as count FROM usage WHERE wallet = ${wallet.toLowerCase()} AND action = 'generate'`
    return NextResponse.json({
      scanCount: parseInt(scans.rows[0].count),
      genCount: parseInt(gens.rows[0].count),
    })
  } catch {
    return NextResponse.json({ scanCount: 0, genCount: 0 })
  }
}

export async function POST(req: Request) {
  try {
    const { wallet, txHash, action } = await req.json()
    await ensureTables()

    let burnTx: string | null = null
    try {
      const { createWalletClient, createPublicClient, http, parseAbi } = await import('viem')
      const { base } = await import('viem/chains')
      const { privateKeyToAccount } = await import('viem/accounts')

      const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
      const walletClient = createWalletClient({ account, chain: base, transport: http() })
      const publicClient = createPublicClient({ chain: base, transport: http() })

      const transferAbi = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])
      const transferHash = await walletClient.writeContract({
        address: USDC_BASE as `0x${string}`,
        abi: transferAbi,
        functionName: 'transfer',
        args: [RECEIVER_CONTRACT as `0x${string}`, BURN_AMOUNT_WEI],
      })
      await publicClient.waitForTransactionReceipt({ hash: transferHash })

      const executeAbi = parseAbi(['function execute()'])
      const executeHash = await walletClient.writeContract({
        address: RECEIVER_CONTRACT as `0x${string}`,
        abi: executeAbi,
        functionName: 'execute',
        args: [],
      })
      await publicClient.waitForTransactionReceipt({ hash: executeHash })
      burnTx = executeHash
    } catch (burnErr) {
      console.error('Burn failed (non-fatal):', burnErr)
    }

    await sql`
      INSERT INTO usage (wallet, action, tx_hash, burn_tx)
      VALUES (${wallet.toLowerCase()}, ${action || 'generate'}, ${txHash || null}, ${burnTx})
    `

    return NextResponse.json({ success: true, burnTx })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
