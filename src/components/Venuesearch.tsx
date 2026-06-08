/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MapPin, Search, Loader2, CheckCircle2, X,
  AlertCircle, Navigation, Building2, PenLine,
  Globe, Map,
} from 'lucide-react'

export type AddressComponents = {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

export type VenueResult = {
  venue: string
  address: string
  placeId: string
  coords: { lat: number; lng: number } | null
  components: AddressComponents
}

type Props = {
  venue: string
  address: string
  coords?: { lat: number; lng: number } | null
  onChange: (result: VenueResult) => void
  hasVenueError?: boolean
  hasAddressError?: boolean
  placeholder?: string
}

// ─── Load Google Maps ─────────────────────────────────────────────

let gmapsLoaded = false
let gmapsLoading = false
const gmapsCallbacks: (() => void)[] = []

function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (gmapsLoaded || (window as any).google?.maps?.places) {
      gmapsLoaded = true
      resolve()
      return
    }
    gmapsCallbacks.push(resolve)
    if (gmapsLoading) return
    gmapsLoading = true

    const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY || ''
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      gmapsLoaded = true
      gmapsLoading = false
      gmapsCallbacks.forEach(cb => cb())
      gmapsCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
}

// ─── Parse address components ─────────────────────────────────────

function parseComponents(
  components: google.maps.GeocoderAddressComponent[]
): AddressComponents {
  const get = (type: string) =>
    components.find(c => c.types.includes(type))?.long_name ?? ''
  const getShort = (type: string) =>
    components.find(c => c.types.includes(type))?.short_name ?? ''
  return {
    street: [get('street_number'), get('route')].filter(Boolean).join(' '),
    city: get('locality') || get('sublocality_level_1') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
    country: get('country'),
    postalCode: getShort('postal_code'),
  }
}

// ─── Styles ───────────────────────────────────────────────────────

const base: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  fontFamily: 'var(--font-body)', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
  WebkitAppearance: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: 'rgba(255,255,255,0.7)',
  fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6,
}

// ─── Component ────────────────────────────────────────────────────

export default function VenueSearch({
  venue, address, coords, onChange,
  hasVenueError,
  placeholder = 'Search venue e.g. Tafawa Balewa Square, Lagos',
}: Props) {
  const [query, setQuery] = useState(venue || '')
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<VenueResult | null>(
    venue ? { venue, address, placeId: '', coords: coords ?? null, components: { street: '', city: '', state: '', country: '', postalCode: '' } } : null
  )
  const [open, setOpen] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualVenue, setManualVenue] = useState(venue || '')
  const [manualAddress, setManualAddress] = useState(address || '')
  const [gmReady, setGmReady] = useState(false)
  const [focused, setFocused] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Use `any` for service refs — avoids overload mismatch on the callback signatures
  const autocompleteService = useRef<any>(null)
  const placesService = useRef<any>(null)

  useEffect(() => {
    loadGoogleMaps().then(() => {
      setGmReady(true)
      autocompleteService.current = new google.maps.places.AutocompleteService()
      if (mapDivRef.current) {
        placesService.current = new google.maps.places.PlacesService(mapDivRef.current)
      }
    })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Search — no explicit callback types, let TS infer ──────────
  const search = useCallback((q: string) => {
    if (!q.trim() || !autocompleteService.current) { setPredictions([]); setOpen(false); return }
    setSearching(true)
    autocompleteService.current.getPlacePredictions(
      { input: q },
      (results: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
        setSearching(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results)
          setOpen(true)
        } else {
          setPredictions([])
          setOpen(false)
        }
      }
    )
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    setSelected(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 300)
  }

  // ── Fetch place details ─────────────────────────────────────────
  const selectPrediction = (pred: google.maps.places.AutocompletePrediction) => {
    setOpen(false)
    setQuery(pred.structured_formatting.main_text)
    setSearching(true)
    if (!placesService.current) return

    placesService.current.getDetails(
      { placeId: pred.place_id, fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id'] },
      (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        setSearching(false)
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return
        const components = parseComponents(place.address_components ?? [])
        const result: VenueResult = {
          venue: place.name ?? pred.structured_formatting.main_text,
          address: place.formatted_address ?? pred.description,
          placeId: place.place_id ?? pred.place_id,
          coords: place.geometry?.location
            ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
            : null,
          components,
        }
        setSelected(result)
        setQuery(result.venue)
        onChange(result)
      }
    )
  }

  const saveManual = () => {
    if (!manualVenue.trim()) return
    const result: VenueResult = {
      venue: manualVenue.trim(), address: manualAddress.trim(),
      placeId: '', coords: null,
      components: { street: '', city: '', state: '', country: '', postalCode: '' },
    }
    setSelected(result); setQuery(result.venue); onChange(result); setManualMode(false)
  }

  const clear = () => {
    setQuery(''); setSelected(null); setPredictions([]); setOpen(false)
    onChange({ venue: '', address: '', placeId: '', coords: null, components: { street: '', city: '', state: '', country: '', postalCode: '' } })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div ref={mapDivRef} style={{ display: 'none' }} />

      {/* Search input */}
      {!manualMode && (
        <div>
          <label style={labelStyle}>
            <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Venue Name *
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
              {searching
                ? <Loader2 size={15} color="#22C55E" style={{ animation: 'spin 1s linear infinite' }} />
                : selected ? <CheckCircle2 size={15} color="#22C55E" />
                : <Search size={15} color={focused ? '#22C55E' : 'rgba(255,255,255,0.35)'} />}
            </div>
            <input
              ref={inputRef}
              value={query}
              onChange={handleInput}
              onFocus={() => { setFocused(true); if (predictions.length > 0) setOpen(true) }}
              onBlur={() => setFocused(false)}
              placeholder={gmReady ? placeholder : 'Loading Google Maps…'}
              disabled={!gmReady}
              style={{
                ...base, paddingLeft: 40, paddingRight: selected ? 38 : 14,
                borderColor: hasVenueError ? 'rgba(239,68,68,0.5)' : selected ? 'rgba(34,197,94,0.5)' : focused ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
                opacity: gmReady ? 1 : 0.5,
              }}
            />
            {(query || selected) && (
              <button onClick={clear} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                <X size={11} />
              </button>
            )}

            {/* Dropdown */}
            {open && predictions.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 300, background: 'rgba(8,14,28,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', maxHeight: 320, overflowY: 'auto' }}>
                {predictions.map((pred, i) => (
                  <div
                    key={pred.place_id}
                    onMouseDown={() => selectPrediction(pred)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', cursor: 'pointer', borderBottom: i < predictions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ marginTop: 1, flexShrink: 0 }}>
                      {pred.types?.includes('establishment') ? <Building2 size={14} color="#22C55E" />
                        : pred.types?.includes('geocode') || pred.types?.includes('street_address') ? <Navigation size={14} color="rgba(255,255,255,0.4)" />
                        : <MapPin size={14} color="rgba(255,255,255,0.4)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pred.structured_formatting.main_text}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pred.structured_formatting.secondary_text}</div>
                    </div>
                  </div>
                ))}
                <div
                  onMouseDown={() => { setOpen(false); setManualMode(true); setManualVenue(query); setManualAddress('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245,158,11,0.05)', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.05)')}
                >
                  <PenLine size={13} color="#F59E0B" />
                  <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Can't find it? Enter address manually</span>
                </div>
              </div>
            )}
          </div>
          {hasVenueError && <span style={{ fontSize: 12, color: '#F87171', marginTop: 4, display: 'block' }}>Venue is required</span>}
        </div>
      )}

      {/* Selected result card */}
      {selected && !manualMode && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <MapPin size={15} color="#22C55E" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{selected.venue}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 6 }}>{selected.address}</div>
              {(selected.components.city || selected.components.country) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                  {selected.components.city && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={10} />{selected.components.city}</span>}
                  {selected.components.state && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{selected.components.state}</span>}
                  {selected.components.country && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={10} />{selected.components.country}</span>}
                  {selected.coords && <span style={{ fontSize: 11, color: 'rgba(34,197,94,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}><Navigation size={10} />{selected.coords.lat.toFixed(4)}, {selected.coords.lng.toFixed(4)}</span>}
                  {!selected.placeId && <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}><PenLine size={10} />Manual entry</span>}
                </div>
              )}
            </div>
            <button onClick={clear} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Manual toggle when empty */}
      {!selected && !manualMode && query.length === 0 && (
        <button onClick={() => setManualMode(true)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(245,158,11,0.7)', fontSize: 12, fontWeight: 600 }}>
          <PenLine size={12} />
          Venue not on Google Maps yet? Enter manually
        </button>
      )}

      {/* Manual entry */}
      {manualMode && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PenLine size={13} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Manual Venue Entry</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>For new or unlisted venues not yet on Google Maps</div>
              </div>
            </div>
            <button onClick={() => setManualMode(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
              <X size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 9, padding: '9px 12px', marginBottom: 14 }}>
            <AlertCircle size={13} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              This venue won't have a map pin or directions link. You can add it to{' '}
              <a href="https://business.google.com" target="_blank" rel="noreferrer" style={{ color: '#F59E0B' }}>Google Business Profile</a>{' '}
              for free — usually live within 3–5 days.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Venue Name *</label>
              <input style={{ ...base, borderColor: hasVenueError && !manualVenue.trim() ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }} placeholder="e.g. The Grand Hall, Lekki" value={manualVenue} onChange={e => setManualVenue(e.target.value)} onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div>
              <label style={labelStyle}>Full Address</label>
              <input style={{ ...base }} placeholder="Street, City, State, Country" value={manualAddress} onChange={e => setManualAddress(e.target.value)} onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')} onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button onClick={saveManual} disabled={!manualVenue.trim()} style={{ flex: 1, padding: '10px', background: manualVenue.trim() ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${manualVenue.trim() ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 9, color: manualVenue.trim() ? '#F59E0B' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: manualVenue.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                <CheckCircle2 size={13} />Use this venue
              </button>
              <button onClick={() => { setManualMode(false); setQuery('') }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Search size={12} />Search instead
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
        <Map size={10} color="rgba(255,255,255,0.2)" />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Powered by Google Maps</span>
      </div>
    </div>
  )
}