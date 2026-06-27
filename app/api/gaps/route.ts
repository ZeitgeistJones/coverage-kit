import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

function clean(str: string): string {
  return (str || '').replace(/[^\x20-\x7E]/g, '').trim().slice(0, 200)
}

function extractJSON(text: string): any {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in response')
  const jsonStr = text.slice(start, end + 1)
  return JSON.parse(jsonStr)
}

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json()

    const slimRepos = repos
      .map((r: any) => `- ${clean(r.name)} (pushed: ${clean(r.pushedAt)})`)
      .join('\n')

    const slimVideos = videos
      .map((v: any) => `- "${clean(v.title)}" | ${clean(v.publishedAt)}`)
      .join('\n')

    const prompt = `Analyze coverage gaps between a GitHub org's repos and a YouTube channel's videos.

REPOS:
${slimRepos}

VIDEOS:
${slimVideos}

For each repo classify as uncovered, stale (repo pushed 30+ days after video), or covered. Match loosely on repo name appearing in video title.

Return ONLY valid JSON with no markdown, no backticks, no explanation: {"gaps":[{"repoName":"name","status":"uncovered","matchedVideo":null,"repoLastPushed":"ISO date","priority":"high"}]}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const result = extractJSON(text)

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
