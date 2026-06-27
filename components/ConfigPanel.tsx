'use client'

import { useState, useEffect } from 'react'

type Props = {
  org: string
  channelId: string
  onSave: (org: string, channelId: string) => void
}

export default function ConfigPanel({ org, channelId, onSave }: Props) {
  const [localOrg, setLocalOrg] = useState(org)
  const [localChannelId, setLocalChannelId] = useState(channelId)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalOrg(org)
    setLocalChannelId(channelId)
  }, [org, channelId])

  function handleSave() {
    onSave(localOrg.trim(), localChannelId.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius)',
    padding: '8px 12px',
    color: 'var(--text)',
    fontSize: 12,
    fontFamily: 'var(--font)',
    outline: 'none',
    marginBottom: 10,
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          github org or username
        </label>
        <input
          value={localOrg}
          onChange={e => setLocalOrg(e.target.value)}
          placeholder="e.g. clawdbotatg"
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          youtube channel
        </label>
        <input
          value={localChannelId}
          onChange={e => setLocalChannelId(e.target.value)}
          placeholder="e.g. @ClawdExplains or youtube.com/@ClawdExplains"
          style={inputStyle}
        />
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
          paste the channel URL or @handle
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={!localOrg.trim() || !localChannelId.trim()}
        style={{
          width: '100%',
          background: saved ? 'var(--success-dim)' : 'var(--accent-dim)',
          color: saved ? 'var(--success)' : 'var(--accent)',
          border: `1px solid ${saved ? 'var(--success)' : 'var(--accent)'}`,
          borderRadius: 'var(--radius)',
          padding: '7px',
          fontSize: 12,
          cursor: !localOrg.trim() || !localChannelId.trim() ? 'not-allowed' : 'pointer',
          opacity: !localOrg.trim() || !localChannelId.trim() ? 0.4 : 1,
          fontFamily: 'var(--font)',
        }}
      >
        {saved ? '✓ saved' : 'save config'}
      </button>
    </div>
  )
}
