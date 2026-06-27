'use client'

import { useState } from 'react'

type Props = {
  notebookDoc: string
  youtubeDesc: string
  thumbnailPrompt?: string
}

function CopyBlock({ label, content, note }: { label: string; content: string; note?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)' }}>
            {label}
          </span>
          {note && <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{note}</span>}
        </div>
        <button
          onClick={copy}
          style={{
            background: copied ? 'var(--success-dim)' : 'var(--accent-dim)',
            color: copied ? 'var(--success)' : 'var(--accent)',
            border: `1px solid ${copied ? 'var(--success)' : 'var(--accent)'}`,
            borderRadius: 4,
            padding: '3px 10px',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        padding: '14px',
        fontSize: 12,
        lineHeight: 1.7,
        color: 'var(--text)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '400px',
        overflowY: 'auto',
        margin: 0,
      }}>
        {content}
      </pre>
    </div>
  )
}

export default function OutputPanel({ notebookDoc, youtubeDesc, thumbnailPrompt }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CopyBlock
        label="notebooklm source doc"
        content={notebookDoc}
        note="paste into notebooklm.google.com as a source"
      />
      <CopyBlock label="youtube description" content={youtubeDesc} />
      {thumbnailPrompt && (
        <CopyBlock
          label="thumbnail prompt"
          content={thumbnailPrompt}
          note="paste into ChatGPT or an image AI"
        />
      )}
    </div>
  )
}
