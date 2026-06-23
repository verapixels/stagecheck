import type { FeaturedArtist } from './onboardingTypes'

const LASTFM_KEY = 'b25b959554ed76058ac220b7b2e0a026'
const DEEZER_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchDeezerArtists'
const KG_FUNCTION_URL = 'https://us-central1-stagecheck-699c7.cloudfunctions.net/searchKnowledgeGraph'

function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'&-]/g, '')
    .replace(/\s+/g, ' ')
}

async function deezerFetch(artistName: string, limit = 8) {
  const res = await fetch(`${DEEZER_FUNCTION_URL}?q=${encodeURIComponent(artistName)}&limit=${limit}`)
  if (!res.ok) throw new Error('function error')
  return res.json()
}

export async function searchArtists(name: string): Promise<FeaturedArtist[]> {
  const q = normalizeQuery(name)
  if (!q) return []
  const results: FeaturedArtist[] = []
  const seen = new Set<string>()

  try {
    const data = await deezerFetch(q, 8)
    for (const a of (data.data || []).slice(0, 6)) {
      const key = a.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      results.push({
        name: a.name,
        image: a.picture_xl || a.picture_big || a.picture_medium || a.picture || '',
        genre: 'Artist',
        listeners: a.nb_fan ? parseInt(a.nb_fan).toLocaleString() : '—',
        bio: '',
      })
    }
  } catch { /* fall through to Last.fm */ }

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
          image = dd?.data?.[0]?.picture_xl || dd?.data?.[0]?.picture_big || ''
        } catch { /* no image */ }
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

      if (!image) {
        try {
          const wikiSearch = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(entity.name)}&format=json&origin=*&srlimit=1`)
          if (wikiSearch.ok) {
            const wikiSearchData = await wikiSearch.json()
            const pageTitle = wikiSearchData?.query?.search?.[0]?.title
            if (pageTitle) {
              const wikiImg = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=400&format=json&origin=*`)
              if (wikiImg.ok) {
                const wikiImgData = await wikiImg.json()
                const pages = wikiImgData?.query?.pages
                const page = pages?.[Object.keys(pages)[0]]
                image = page?.thumbnail?.source || ''
              }
            }
          }
        } catch { /* try deezer */ }
      }

      if (!image) {
        try {
          const deezerData = await deezerFetch(entity.name, 1)
          image = deezerData?.data?.[0]?.picture_xl || deezerData?.data?.[0]?.picture_big || deezerData?.data?.[0]?.picture_medium || ''
        } catch { /* no image */ }
      }

      results.push({
        name: entity.name, image, genre: typeLabel,
        listeners: description.length > 100 ? description.slice(0, 97) + '…' : description,
        bio: description,
      })
      if (results.length >= 6) break
    }
  } catch { /* ignore */ }

  return results
}