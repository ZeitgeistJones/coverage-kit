'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { parseUnits } from 'viem'
import GapReport from '@/components/GapReport'
import GeneratePanel from '@/components/GeneratePanel'
import OutputPanel from '@/components/OutputPanel'
import ConfigPanel from '@/components/ConfigPanel'

export type GapEntry = {
  repoName: string
  status: 'uncovered' | 'stale' | 'covered'
  matchedVideo: { title: string; url: string; publishedAt: string } | null
  repoLastPushed: string
  priority: 'high' | 'medium' | 'low'
}

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const PAYMENT_RECEIVER = process.env.NEXT_PUBLIC_WALLET_ADDRESS || ''
const PRICE = parseUnits('0.10', 6)

type Page = 'tool' | 'about'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [page, setPage] = useState<Page>('tool')
  const [org, setOrg] = useState('')
  const [channelId, setChannelId] = useState('')
  const [gaps, setGaps] = useState<GapEntry[]>([])
  const [scannedAt, setScannedAt] = useState<string | undefined>()
  const [scanning, setScanning] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState('')
  const [generating, setGenerating] = useState(false)
  const [output, setOutput] = useState<{
    notebookDoc: string
    youtubeDesc: string
    thumbnailPrompt?: string
  } | null>(null)
  const [error, setError] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const [genCount, setGenCount] = useState(0)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('coveragekit-config')
    if (saved) {
      const { org: savedOrg, channelId: savedChannelId } = JSON.parse(saved)
      if (savedOrg) setOrg(savedOrg)
      if (savedChannelId) setChannelId(savedChannelId)
    }
  }, [])

  useEffect(() => {
    if (!org || !channelId) return
    loadCachedGaps()
  }, [org, channelId])

  useEffect(() => {
    if (!address) return
    fetchUsage()
  }, [address])

  async function fetchUsage() {
    try {
      const res = await fetch(`/api/payment?wallet=${address}`)
      const data = await res.json()
      setScanCount(data.scanCount || 0)
      setGenCount(data.genCount || 0)
    } catch {}
  }

  async function loadCachedGaps() {
    try {
      const res = await fetch(`/api/gap-cache?org=${encodeURIComponent(org)}&channelId=${encodeURIComponent(channelId)}`)
      const data = await res.json()
      if (data.cache) {
        setGaps(data.cache.gaps)
        setScannedAt(data.cache.scanned_at)
      }
    } catch {}
  }

  function saveConfig(newOrg: string, newChannelId: string) {
    setOrg(newOrg)
    setChannelId(newChannelId)
    localStorage.setItem('coveragekit-config', JSON.stringify({ org: newOrg, channelId: newChannelId }))
  }

  async function payForAction(action: string): Promise<boolean> {
    if (!walletClient || !address) return false
    setPaying(true)
    try {
      const { parseAbi } = await import('viem')
      const abi = parseAbi(['function transfer(address to, uint256 amount) returns (bool)'])
      const hash = await walletClient.writeContract({
        address: USDC_BASE as `0x${string}`,
        abi,
        functionName: 'transfer',
        args: [PAYMENT_RECEIVER as `0x${string}`, PRICE],
      })
      await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, txHash: hash, action }),
      })
      await fetchUsage()
      return true
    } catch (e: any) {
      setError('Payment failed: ' + e.message)
      return false
    } finally {
      setPaying(false)
    }
  }

  async function runScan(force = false) {
    if (!org || !channelId) { setError('Set your config first'); return }

    if (scanCount >= 1) {
      const paid = await payForAction('scan')
      if (!paid) return
    }

    setScanning(true)
    setError('')
    try {
      const [reposRes, videosRes] = await Promise.all([
        fetch(`/api/repos?org=${encodeURIComponent(org)}`),
        fetch(`/api/videos?channelId=${encodeURIComponent(channelId)}`),
      ])
      const reposData = await reposRes.json()
      const videosData = await videosRes.json()
      if (!reposData.repos) throw new Error('Repos error: ' + JSON.stringify(reposData))
      if (!videosData.videos) throw new Error('Videos error: ' + JSON.stringify(videosData))

      const gapsRes = await fetch('/api/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos: reposData.repos, videos: videosData.videos }),
      })
      const gapsData = await gapsRes.json()
      if (!gapsData.gaps) throw new Error('Gaps error: ' + JSON.stringify(gapsData))

      setGaps(gapsData.gaps)
      const now = new Date().toISOString()
      setScannedAt(now)
      setScanCount(c => c + 1)

      await fetch('/api/gap-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org, channelId, gaps: gapsData.gaps }),
      })
    } catch (e: any) {
      setError(e.message || 'Scan failed')
    }
    setScanning(false)
  }

  async function generate(opts: {
    repoName: string
    styleBible: string
    disclaimers: string[]
    previousVideoDescription: string
    extraContext: string
    includeThumbnail: boolean
  }) {
    if (genCount >= 1) {
      const paid = await payForAction('generate')
      if (!paid) return
    }

    setGenerating(true)
    setError('')
    setOutput(null)
    try {
      const packRes = await fetch('/api/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org, repoName: opts.repoName }),
      })
      const { packed, repoUrl, error: packErr } = await packRes.json()
      if (packErr) throw new Error(packErr)

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packed, repoName: opts.repoName, repoUrl, org,
          styleBible: opts.styleBible,
          disclaimers: opts.disclaimers,
          previousVideoDescription: opts.previousVideoDescription,
          extraContext: opts.extraContext,
          includeThumbnail: opts.includeThumbnail,
        }),
      })
      const { notebookDoc, youtubeDesc, thumbnailPrompt, error: genErr } = await genRes.json()
      if (genErr) throw new Error(genErr)

      setOutput({ notebookDoc, youtubeDesc, thumbnailPrompt })
      setGenCount(c => c + 1)
    } catch (e: any) {
      setError(e.message || 'Generation failed')
    }
    setGenerating(false)
  }

  if (page === 'about') {
    return (
      <main className="main">
        <header className="header">
          <div className="header-inner">
            <div className="header-left">
              <span className="logo">📹 CoverageKit</span>
            </div>
            <nav className="nav-links">
              <button className="nav-link" onClick={() => setPage('tool')}>tool</button>
              <button className="nav-link active">about</button>
              <ConnectButton />
            </nav>
          </div>
        </header>
        <div className="about-page">
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
              What is CoverageKit?
            </h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 16 }}>
              CoverageKit is a video production assistant for teams who build in public on GitHub and document their work on YouTube. It finds the gaps between what you've shipped and what you've covered, then generates the assets you need to make the video.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Connect your GitHub org and YouTube channel. CoverageKit scans both, identifies repos with no video coverage or coverage that's gone stale. Pick a gap, hit generate, and get a NotebookLM source document, YouTube description, and thumbnail prompt — ready to go.
            </p>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>What is NotebookLM?</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 12 }}>
              <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>NotebookLM</a> is a free AI research tool from Google. You paste in source documents and it generates audio overviews — essentially a podcast-style conversation between two AI hosts discussing your content. Many YouTube creators use it to turn written content into a narrated audio track for their videos.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              The NotebookLM document CoverageKit generates is formatted specifically to produce a great audio overview — flowing narrative, right tone, no chapter markers that would make it feel like a lecture.
            </p>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>How it works</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['1', 'Connect your wallet'],
                ['2', 'Set your GitHub org and YouTube channel'],
                ['3', 'Run a gap scan — CoverageKit compares your repos against your videos'],
                ['4', 'Pick an uncovered or stale repo'],
                ['5', 'Configure tone, disclaimers, and options then generate'],
              ].map(([num, text]) => (
                <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, minWidth: 16 }}>{num}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pricing</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              First scan and first generation are free. After that, $0.10 in USDC on Base per action. A portion of each payment is automatically swapped to CLAWD and burned, reducing supply.
            </p>
          </div>

          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 24,
            fontSize: 12,
            color: 'var(--text-dim)',
            lineHeight: 1.8,
          }}>
            <p style={{ marginBottom: 8 }}>
              The buy-and-burn mechanic uses the{' '}
              <a href="https://github.com/clawdbotatg/receiver-buy-and-burn" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                receiver-buy-and-burn contract
              </a>
              {' '}built by clawdbotatg — a permissionless contract that receives USDC, swaps to CLAWD via Uniswap V3, and burns to the dead address.
            </p>
            <p>Built by an independent community member. Not affiliated with or endorsed by clawdbotatg or any other project mentioned.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="main">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <span className="logo">📹 CoverageKit</span>
            <span className="tagline">gap analysis → notebooklm doc → youtube description</span>
          </div>
          <nav className="nav-links">
            <button className="nav-link active">tool</button>
            <button className="nav-link" onClick={() => setPage('about')}>about</button>
            {paying && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>processing payment...</span>}
            <ConnectButton />
          </nav>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="panel">
            <div className="panel-header"><span>config</span></div>
            <ConfigPanel org={org} channelId={channelId} onSave={saveConfig} />
          </div>

          <div className="panel">
            <div className="panel-header">
              <span>coverage gaps</span>
              {!scannedAt && org && channelId && (
                <button
                  onClick={() => runScan()}
                  disabled={scanning || !isConnected}
                  className="btn"
                >
                  {!isConnected ? 'connect wallet' : scanning ? 'scanning...' : 'scan'}
                </button>
              )}
            </div>
            {gaps.length > 0 ? (
              <GapReport
                gaps={gaps}
                onSelect={setSelectedRepo}
                selected={selectedRepo}
                scannedAt={scannedAt}
                onRescan={() => runScan(true)}
                scanning={scanning}
              />
            ) : (
              <div className="empty">
                {!org || !channelId ? 'set your config above to get started'
                  : !isConnected ? 'connect your wallet to scan'
                  : scanning ? 'scanning...'
                  : 'run a scan to find uncovered repos'}
              </div>
            )}
          </div>
        </aside>

        <div className="content">
          {error && <div className="error">{error}</div>}
          <GeneratePanel
            selectedRepo={selectedRepo}
            org={org}
            onRepoChange={setSelectedRepo}
            onGenerate={generate}
            generating={generating}
            isConnected={isConnected}
          />
          {output && (
            <OutputPanel
              notebookDoc={output.notebookDoc}
              youtubeDesc={output.youtubeDesc}
              thumbnailPrompt={output.thumbnailPrompt}
            />
          )}
        </div>
      </div>
    </main>
  )
}
