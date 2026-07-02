import type { FeaturedArtist } from './onboardingTypes'

const LASTFM_KEY = 'b25b959554ed76058ac220b7b2e0a026'
const SPOTIFY_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchSpotifyArtists'
const DEEZER_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchDeezerArtists'
const KG_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchKnowledgeGraph'

function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'&-]/g, '')
    .replace(/\s+/g, ' ')
}

// Deezer returns a fixed generic "note" avatar for artists it has no real photo for.
// Its URL always contains an empty artist-id segment ("/artist//") — treat that as "no image".
function isDeezerPlaceholder(url: string) {
  if (!url) return true
  return url.includes('/artist//') || url.includes('1000x1000-000000-80-0-0')
}

async function spotifyFetch(artistName: string, limit = 8) {
  const res = await fetch(`${SPOTIFY_FUNCTION_URL}?q=${encodeURIComponent(artistName)}&limit=${limit}`)
  if (!res.ok) throw new Error('spotify function error')
  return res.json()
}

async function deezerFetch(artistName: string, limit = 8) {
  const res = await fetch(`${DEEZER_FUNCTION_URL}?q=${encodeURIComponent(artistName)}&limit=${limit}`)
  if (!res.ok) throw new Error('deezer function error')
  return res.json()
}

async function wikipediaImageFor(name: string): Promise<string> {
  try {
    const wikiSearch = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=1`)
    if (!wikiSearch.ok) return ''
    const wikiSearchData = await wikiSearch.json()
    const pageTitle = wikiSearchData?.query?.search?.[0]?.title
    if (!pageTitle) return ''
    const wikiImg = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=400&format=json&origin=*`)
    if (!wikiImg.ok) return ''
    const wikiImgData = await wikiImg.json()
    const pages = wikiImgData?.query?.pages
    const page = pages?.[Object.keys(pages)[0]]
    return page?.thumbnail?.source || ''
  } catch {
    return ''
  }
}

async function wikipediaSummaryFor(name: string): Promise<{ title: string; extract: string; image: string } | null> {
  try {
    const wikiSearch = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*&srlimit=1`)
    if (!wikiSearch.ok) return null
    const wikiSearchData = await wikiSearch.json()
    const pageTitle = wikiSearchData?.query?.search?.[0]?.title
    if (!pageTitle) return null

    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`)
    if (!summaryRes.ok) return null
    const summary = await summaryRes.json()
    if (!summary?.title) return null

    return {
      title: summary.title,
      extract: summary.extract || '',
      image: summary.thumbnail?.source || '',
    }
  } catch {
    return null
  }
}

export async function searchArtists(name: string): Promise<FeaturedArtist[]> {
  const q = normalizeQuery(name)
  if (!q) return []
  const results: FeaturedArtist[] = []
  const seen = new Set<string>()

  // 1) Spotify first — by far the best catalog coverage, including gospel/afrobeats/regional artists
  try {
    const data = await spotifyFetch(q, 8)
    for (const a of (data?.artists?.items || []).slice(0, 6)) {
      const key = a.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const image = a.images?.[0]?.url || a.images?.[1]?.url || ''
      results.push({
        name: a.name,
        image,
        genre: a.genres?.[0] ? a.genres[0].replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Artist',
        listeners: typeof a.followers?.total === 'number' ? a.followers.total.toLocaleString() : '—',
        bio: '',
      })
    }
  } catch { /* fall through to Deezer */ }

  // 2) Deezer fills in if Spotify function isn't set up yet or came back thin
  if (results.length < 4) {
    try {
      const data = await deezerFetch(q, 8)
      for (const a of (data.data || []).slice(0, 6)) {
        const key = a.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)

        let image = a.picture_xl || a.picture_big || a.picture_medium || a.picture || ''
        if (isDeezerPlaceholder(image)) image = await wikipediaImageFor(a.name)

        results.push({
          name: a.name,
          image,
          genre: 'Artist',
          listeners: a.nb_fan ? parseInt(a.nb_fan).toLocaleString() : '—',
          bio: '',
        })
        if (results.length >= 6) break
      }
    } catch { /* fall through to Last.fm */ }
  }

  // 3) Last.fm as a final net for anything still missing
  if (results.length < 3) {
    try {
      const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(q)}&api_key=${LASTFM_KEY}&format=json&limit=6`)
      const data = await res.json()
      const matches = data?.results?.artistmatches?.artist || []
      for (const a of matches) {
        const key = a.name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)

        let image = ''
        try {
          const dd = await deezerFetch(a.name, 1)
          const candidate = dd?.data?.[0]?.picture_xl || dd?.data?.[0]?.picture_big || ''
          if (!isDeezerPlaceholder(candidate)) image = candidate
        } catch { /* no image */ }
        if (!image) image = await wikipediaImageFor(a.name)

        results.push({
          name: a.name, image, genre: 'Artist',
          listeners: a.listeners ? parseInt(a.listeners).toLocaleString() : '—',
          bio: '', mbid: a.mbid,
        })
        if (results.length >= 6) break
      }
    } catch { /* ignore */ }
  }

  return results.slice(0, 6)
}

export async function searchPublicFigures(name: string): Promise<FeaturedArtist[]> {
  const q = normalizeQuery(name)
  if (!q) return []
  const results: FeaturedArtist[] = []
  const seen = new Set<string>()

  try {
    const res = await fetch(`${KG_FUNCTION_URL}?q=${encodeURIComponent(q)}&limit=8`)
    if (!res.ok) throw new Error('function error')
    const data = await res.json()

    for (const item of (data.itemListElement || [])) {
      const entity = item.result
      if (!entity?.name) continue
      const key = entity.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      const types: string[] = entity['@type'] || []
      const typeLabel = types
        .filter((t: string) => !['Thing', 'Intangible'].includes(t))
        .map((t: string) => t.replace(/([A-Z])/g, ' $1').trim())
        .slice(0, 2).join(' · ') || 'Public Figure'

      const description = entity.detailedDescription?.articleBody || ''
      let image = entity.image?.contentUrl || entity.image?.url || ''

      if (!image) image = await wikipediaImageFor(entity.name)
      if (!image) {
        try {
          const deezerData = await deezerFetch(entity.name, 1)
          const candidate = deezerData?.data?.[0]?.picture_xl || deezerData?.data?.[0]?.picture_big || deezerData?.data?.[0]?.picture_medium || ''
          if (!isDeezerPlaceholder(candidate)) image = candidate
        } catch { /* no image */ }
      }

      results.push({
        name: entity.name, image, genre: typeLabel,
        listeners: description.length > 100 ? description.slice(0, 97) + '…' : description,
        bio: description,
      })
      if (results.length >= 6) break
    }
  } catch { /* ignore, fall through to Wikipedia below */ }

  // Knowledge Graph has thin coverage for many Nigerian / regional public figures.
  // Fall back to a direct Wikipedia search so those names still resolve.
  if (results.length < 3) {
    try {
      const wikiSearch = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=6`)
      if (wikiSearch.ok) {
        const wikiSearchData = await wikiSearch.json()
        const hits = wikiSearchData?.query?.search || []
        for (const hit of hits) {
          const key = (hit.title as string).toLowerCase()
          if (seen.has(key)) continue

          const summary = await wikipediaSummaryFor(hit.title)
          if (!summary) continue
          seen.add(key)

          results.push({
            name: summary.title,
            image: summary.image,
            genre: 'Public Figure',
            listeners: summary.extract.length > 100 ? summary.extract.slice(0, 97) + '…' : summary.extract,
            bio: summary.extract,
          })
          if (results.length >= 6) break
        }
      }
    } catch { /* ignore */ }
  }

  return results
}