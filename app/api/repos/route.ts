import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const org = searchParams.get('org')
    if (!org) return NextResponse.json({ error: 'org required' }, { status: 400 })

    const res = await fetch(`https://api.github.com/users/${org}/repos?per_page=100&sort=pushed`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

    const repos = await res.json()

    const mapped = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      pushedAt: r.pushed_at,
      language: r.language,
      stars: r.stargazers_count,
      topics: r.topics || [],
    }))

    return NextResponse.json({ repos: mapped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
