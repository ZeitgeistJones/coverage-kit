import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

function clean(str: string): string {
  return (str || '').replace(/[\u{D800}-\u{DFFF}]/gu, '').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
}

export async function POST(req: Request) {
  try {
    const { repos, videos } = await req.json()

    const slimRepos = repos.map((r: any) => `- ${clean(r.name)} (pushed: ${clean(r.pushedAt)})`).join('\n')
    const slimVideos = videos.map((v: any) => `- "${clean(v.title)}" | ${clean(v.publishedAt)} | ${clean((v.description || '').slice(0, 150))}`).join('\n')

    const prompt = `Analyze coverage gaps between a GitHub org's repos and a YouTube channel's videos.

REPOS:
${slimRepos}

VIDEOS:
${slimVideos}

For each repo classify as uncovered, stale (repo pushed 30+ days after video), or covered. Match loosely on name in title or description.

Return ONLY valid JSON: {"gaps":[{"repoName":"name","status":"uncovered","matchedVideo":null,"repoLastPushed":"ISO date","priority":"high"}]}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
