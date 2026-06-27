import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

    const apiKey = process.env.YOUTUBE_API_KEY

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    )
    const channelData = await channelRes.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) throw new Error('Could not find uploads playlist — check your channel ID')

    let videos: any[] = []
    let pageToken = ''

    do {
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${pageToken}&key=${apiKey}`
      )
      const playlistData = await playlistRes.json()

      const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')

      const detailRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${apiKey}`
      )
      const detailData = await detailRes.json()

      const batch = detailData.items.map((v: any) => ({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        publishedAt: v.snippet.publishedAt,
        url: `https://youtube.com/watch?v=${v.id}`,
      }))

      videos = [...videos, ...batch]
      pageToken = playlistData.nextPageToken || ''
    } while (pageToken)

    return NextResponse.json({ videos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
