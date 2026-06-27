import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const {
      packed,
      repoName,
      repoUrl,
      org,
      styleBible,
      disclaimers,
      previousVideoDescription,
      extraContext,
      includeThumbnail,
    } = await req.json()

    const disclaimerBlock = disclaimers?.length
      ? `\n\nDISCLAIMERS TO INCLUDE AT THE END:\n${disclaimers.join('\n')}`
      : ''

    const previousContext = previousVideoDescription
      ? `\n\nPREVIOUS VIDEO CONTEXT (episode continuity — reference as prior coverage, don't repeat it):\n${previousVideoDescription}`
      : ''

    const extraSection = extraContext
      ? `\n\nEXTRA CONTEXT FROM CREATOR (not in the repo — factor this in):\n${extraContext}`
      : ''

    const thumbnailSection = includeThumbnail ? `

---THUMBNAIL PROMPT---
A precise, ready-to-paste image generation prompt for ChatGPT or an image AI. Describe:
- A specific creative scene that captures the vibe of this repo/project
- Bold title text to overlay (short, punchy, relevant)
- Background, color palette, and visual style (comic book, cinematic, cartoon, anime, pop art, retro, etc)
- 16:9 YouTube thumbnail format, high contrast, eye-catching
Keep it under 150 words. Be specific and visual.` : ''

    const prompt = `You are generating video production assets for a YouTube channel covering the GitHub repo: ${repoName} (${repoUrl}) from the org: ${org}.

STYLE GUIDE:
${styleBible}
${disclaimerBlock}
${previousContext}
${extraSection}

Here is the packed repo content:
${packed}

Generate the following outputs:

---NOTEBOOKLM DOC---
A flowing narrative script for NotebookLM. Write it as one continuous piece — NOT a structured document with labeled sections or chapter headers. It should flow like a knowledgeable person explaining something interesting, not a school presentation.

Naturally weave in these beats (without labeling them):
- Why this repo was built: what gap or problem does it solve?
- What it does: plain english with good analogies
- Why it matters: concrete value for the audience
- Close with the disclaimers listed above

---YOUTUBE DESCRIPTION---
A YouTube video description. Include:
- 2-3 sentence summary of what the video covers
- The GitHub repo URL: ${repoUrl}
- A note to check official links
- The disclaimers listed above
- Keep it under 500 words
${thumbnailSection}

Return all sections clearly separated by their headers.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: includeThumbnail ? 5000 : 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const parts = text.split(/---YOUTUBE DESCRIPTION---|---THUMBNAIL PROMPT---/)
    const notebookDoc = (parts[0] || '').replace('---NOTEBOOKLM DOC---', '').trim()
    const youtubeDesc = (parts[1] || '').trim()
    const thumbnailPrompt = includeThumbnail ? (parts[2] || '').trim() : undefined

    return NextResponse.json({ notebookDoc, youtubeDesc, thumbnailPrompt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
