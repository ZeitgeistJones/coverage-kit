import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const RECEIVER_CONTRACT = '0x0C1a3DB07304D2E4E551AB4A7b083382a33f25ad'
const BURN_PERCENT = 0.2 // 20% of payment goes to burn
const PRICE_USDC = 0.10 // $0.10 per generation
const PRICE_USDC_WEI = BigInt(100000) // 0.10 USDC (6 decimals)
const BURN_AMOUNT_WEI = BigInt(20000) // 0.02 USDC to burn (20%)
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS usage (
      id SERIAL PRIMARY KEY,
      wallet TEXT NOT NULL,
      tx_hash TEXT,
      burn_tx TEXT,
      generated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get('wallet')
    if (!wallet) return NextResponse.json({ count: 0 })

    await ensureTables()
    const result = await sql`SELECT COUNT(*) as count FROM usage WHERE wallet = ${wallet.toLowerCase()}`
    return NextResponse.json({ count: parseInt(result.rows[0].count) })
  } catch (err: any) {
    return NextResponse.json({ count: 0 })
  }
}

export async function POST(req: Request) {
  try {
    const { wallet, txHash } = await req.json()
    await ensureTables()

    // trigger burn on receiver contract
    let burnTx: string | null = null
    try {
      const { createWalletClient, createPublicClient, http, parseAbi } = await import('viem')
      const { base } = await import('viem/chains')
      const { privateKeyToAccount } = await import('viem/accounts')

      const account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY as `0x${string}`)
      const walletClient = createWalletClient({ account, chain: base, transport: http() })
      const publicClient = createPublicClient({ chain: base, transport: http() })

      // send burn % to receiver contract
      const transferAbi = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])
      const transferHash = await walletClient.writeContract({
        address: USDC_BASE as `0x${string}`,
        abi: transferAbi,
        functionName: 'transfer',
        args: [RECEIVER_CONTRACT as `0x${string}`, BURN_AMOUNT_WEI],
      })
      await publicClient.waitForTransactionReceipt({ hash: transferHash })

      // call execute() on receiver
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
      INSERT INTO usage (wallet, tx_hash, burn_tx)
      VALUES (${wallet.toLowerCase()}, ${txHash || null}, ${burnTx})
    `

    return NextResponse.json({ success: true, burnTx })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
