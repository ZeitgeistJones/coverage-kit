import { NextResponse } from 'next/server'

export const maxDuration = 60

async function fetchRepoContents(org: string, repoName: string, path = ''): Promise<string> {
  const url = `https://api.github.com/repos/${org}/${repoName}/contents/${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return ''
  const items = await res.json()
  if (!Array.isArray(items)) return ''

  const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next']
  const skipExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.zip', '.lock']

  let output = ''
  for (const item of items) {
    if (item.type === 'dir') {
      if (skipDirs.includes(item.name)) continue
      const sub = await fetchRepoContents(org, repoName, item.path)
      output += sub
    } else if (item.type === 'file') {
      const ext = '.' + item.name.split('.').pop()
      if (skipExts.includes(ext)) continue
      if (item.size > 50000) continue
      try {
        const fileRes = await fetch(item.download_url)
        const content = await fileRes.text()
        output += `\n\n=== ${item.path} ===\n${content}`
      } catch {}
    }
    if (output.length > 80000) {
      output += '\n\n[truncated — repo too large]'
      break
    }
  }
  return output
}

export async function POST(req: Request) {
  try {
    const { org, repoName } = await req.json()
    const repoUrl = `https://github.com/${org}/${repoName}`

    const metaRes = await fetch(`https://api.github.com/repos/${org}/${repoName}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    })
    const meta = await metaRes.json()

    const header = `Repository: ${repoName}\nDescription: ${meta.description || 'No description'}\nLanguage: ${meta.language || 'Unknown'}\nStars: ${meta.stargazers_count}\nLast pushed: ${meta.pushed_at}\nURL: ${repoUrl}\n`
    const contents = await fetchRepoContents(org, repoName)
    const packed = header + contents

    return NextResponse.json({ packed, repoName, repoUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
