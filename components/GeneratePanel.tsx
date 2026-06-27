'use client'

import { useState } from 'react'
import { STYLE_PRESETS, DISCLAIMER_PRESETS } from '@/data/style-presets'

type Props = {
  selectedRepo: string
  org: string
  onRepoChange: (repo: string) => void
  onGenerate: (opts: {
    repoName: string
    styleBible: string
    disclaimers: string[]
    previousVideoDescription: string
    extraContext: string
    includeThumbnail: boolean
  }) => void
  generating: boolean
  isConnected: boolean
}

export default function GeneratePanel({ selectedRepo, org, onRepoChange, onGenerate, generating, isConnected }: Props) {
  const [styleMode, setStyleMode] = useState<'preset' | 'custom'>('preset')
  const [selectedStyle, setSelectedStyle] = useState('chill bro')
  const [customStyle, setCustomStyle] = useState('')
  const [selectedDisclaimers, setSelectedDisclaimers] = useState<string[]>(['not financial advice', 'not affiliated'])
  const [customDisclaimer, setCustomDisclaimer] = useState('')
  const [previousVideoDescription, setPreviousVideoDescription] = useState('')
  const [showPrevious, setShowPrevious] = useState(false)
  const [includeThumbnail, setIncludeThumbnail] = useState(true)
  const [extraContext, setExtraContext] = useState('')

  function toggleDisclaimer(key: string) {
    setSelectedDisclaimers(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    )
  }

  function handleGenerate() {
    if (!selectedRepo.trim() || !org.trim()) return
    const styleBible = styleMode === 'preset' ? STYLE_PRESETS[selectedStyle] : customStyle
    const disclaimers = [
      ...selectedDisclaimers.map(k => DISCLAIMER_PRESETS[k]),
      ...(customDisclaimer ? [customDisclaimer] : []),
    ]
    onGenerate({
      repoName: selectedRepo.trim(),
      styleBible,
      disclaimers,
      previousVideoDescription,
      extraContext,
      includeThumbnail,
    })
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
  }

  const labelStyle = {
    fontSize: 11,
    color: 'var(--text-muted)',
    display: 'block' as const,
    marginBottom: 6,
  }

  const isDisabled = generating || !selectedRepo.trim() || !org.trim() || !isConnected

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 16 }}>
        generate
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>repo name</label>
        <input
          value={selectedRepo}
          onChange={e => onRepoChange(e.target.value)}
          placeholder="select from gap report or type repo name"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>extra context <span style={{ color: 'var(--text-dim)' }}>(optional)</span></label>
        <textarea
          value={extraContext}
          onChange={e => setExtraContext(e.target.value)}
          placeholder="anything not in the repo — community context, upcoming launches, motivation behind the build..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>tone / style</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => setStyleMode('preset')}
            style={{
              background: styleMode === 'preset' ? 'var(--accent-dim)' : 'transparent',
              color: styleMode === 'preset' ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${styleMode === 'preset' ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 4, padding: '3px 10px', fontSize: 11,
            }}
          >preset</button>
          <button
            onClick={() => setStyleMode('custom')}
            style={{
              background: styleMode === 'custom' ? 'var(--accent-dim)' : 'transparent',
              color: styleMode === 'custom' ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${styleMode === 'custom' ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 4, padding: '3px 10px', fontSize: 11,
            }}
          >custom</button>
        </div>
        {styleMode === 'preset' ? (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {Object.keys(STYLE_PRESETS).map(key => (
              <button
                key={key}
                onClick={() => setSelectedStyle(key)}
                style={{
                  background: selectedStyle === key ? 'var(--accent-dim)' : 'transparent',
                  color: selectedStyle === key ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${selectedStyle === key ? 'var(--accent)' : 'var(--border-strong)'}`,
                  borderRadius: 4, padding: '3px 10px', fontSize: 11,
                }}
              >{key}</button>
            ))}
          </div>
        ) : (
          <textarea
            value={customStyle}
            onChange={e => setCustomStyle(e.target.value)}
            placeholder="describe your channel's tone, audience, and any specific framing rules..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>disclaimers <span style={{ color: 'var(--text-dim)' }}>(stack as many as you want)</span></label>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 8 }}>
          {Object.keys(DISCLAIMER_PRESETS).map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedDisclaimers.includes(key)}
                onChange={() => toggleDisclaimer(key)}
                style={{ accentColor: 'var(--accent)', width: 13, height: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{key}</span>
            </label>
          ))}
        </div>
        <input
          value={customDisclaimer}
          onChange={e => setCustomDisclaimer(e.target.value)}
          placeholder="custom disclaimer (optional)"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeThumbnail}
            onChange={e => setIncludeThumbnail(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 13, height: 13 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>generate thumbnail prompt</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPrevious}
            onChange={e => setShowPrevious(e.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 13, height: 13 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            episode continuity <span style={{ color: 'var(--text-dim)' }}>(paste previous video description)</span>
          </span>
        </label>
      </div>

      {showPrevious && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={previousVideoDescription}
            onChange={e => setPreviousVideoDescription(e.target.value)}
            placeholder="paste the previous video's YouTube description here..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isDisabled}
        style={{
          width: '100%',
          background: generating ? 'var(--accent-dim)' : 'var(--accent)',
          color: generating ? 'var(--accent)' : '#fff',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)',
          padding: '10px',
          fontSize: 13,
          fontWeight: 600,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {!isConnected ? 'connect wallet to generate' : generating ? 'generating...' : '⚡ generate'}
      </button>
    </div>
  )
}
