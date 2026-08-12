'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import type { BuildingWithAssignees, Profile } from '@/lib/supabase/types'
import { getBuildings, createBuilding, renameBuilding, deleteBuilding, assignMember, unassignMember } from '@/lib/actions/buildings'
import { sortByPatente } from '@/lib/utils/patente'
import { formatNomeCompleto } from '@/lib/utils/format'
import { useToast } from '@/components/ui/ToastProvider'

type MapaProfile = Pick<Profile, 'id' | 'email' | 'full_name' | 'nome_guerra' | 'avatar_url' | 'role' | 'patente'>

interface MapaViewProps {
  initialBuildings: BuildingWithAssignees[]
  profiles: MapaProfile[]
  canManage: boolean
  googleMapsApiKey: string
}

const MAP_LIBRARIES: 'places'[] = []
const DEFAULT_CENTER = { lat: -15.7801, lng: -47.9292 } // Brasília — ajustável por obra assim que houver dados
const CONTAINER_STYLE = { width: '100%', height: '70vh' }

function getInitial(p: Pick<MapaProfile, 'full_name' | 'email'>): string {
  if (p.full_name) return p.full_name[0].toUpperCase()
  return p.email[0].toUpperCase()
}

function pixelOffset(width: number, height: number) {
  return { x: -(width / 2), y: -height }
}

// ─── Avatar de um fiscal, sobreposto ao pin da obra ────────────────────────

function AssigneeAvatar({ assignee, index }: { assignee: BuildingWithAssignees['assignees'][number]; index: number }) {
  const initial = assignee.full_name ? assignee.full_name[0].toUpperCase() : '?'
  return (
    <div
      title={formatNomeCompleto(assignee.patente, assignee.nome_guerra ?? assignee.full_name)}
      className="h-7 w-7 rounded-full border-2 border-white shadow-sm bg-secondary flex items-center justify-center text-secondary-foreground text-[10px] font-bold overflow-hidden shrink-0"
      style={{ marginLeft: index === 0 ? 0 : -10 }}
    >
      {assignee.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assignee.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  )
}

// ─── Marcador de obra: pin + avatares dos fiscais alocados ─────────────────

function BuildingMarker({
  building,
  onClick,
}: {
  building: BuildingWithAssignees
  onClick: () => void
}) {
  return (
    <OverlayView
      position={{ lat: building.lat, lng: building.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={pixelOffset}
    >
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-1 cursor-pointer group"
        aria-label={`Obra ${building.name}`}
      >
        {building.assignees.length > 0 && (
          <div data-testid="marker-avatars" className="flex items-center">
            {building.assignees.slice(0, 4).map((a, i) => (
              <AssigneeAvatar key={a.id} assignee={a} index={i} />
            ))}
            {building.assignees.length > 4 && (
              <div className="h-7 w-7 rounded-full border-2 border-white shadow-sm bg-muted flex items-center justify-center text-[10px] font-bold -ml-2.5">
                +{building.assignees.length - 4}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 text-primary drop-shadow group-hover:scale-110 transition-transform">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.847 2.02 6.837 3.963 8.827a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-medium shadow-sm whitespace-nowrap max-w-[140px] truncate">
            {building.name}
          </span>
        </div>
      </button>
    </OverlayView>
  )
}

// ─── Modal: detalhes da obra + gestão de alocação ───────────────────────────

interface DetailModalProps {
  building: BuildingWithAssignees
  profiles: MapaProfile[]
  canManage: boolean
  onClose: () => void
  onChanged: () => void
}

function BuildingDetailModal({ building, profiles, canManage, onClose, onChanged }: DetailModalProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [nameDraft, setNameDraft] = useState(building.name)
  const [renaming, setRenaming] = useState(false)

  const assignedIds = useMemo(() => new Set(building.assignees.map((a) => a.profile_id)), [building.assignees])
  const sortedProfiles = useMemo(() => sortByPatente(profiles), [profiles])

  function handleToggleMember(profileId: string, assigned: boolean) {
    startTransition(async () => {
      const result = assigned
        ? await unassignMember(building.id, profileId)
        : await assignMember(building.id, profileId)
      if (!result.ok) {
        toast(result.message, 'error')
        return
      }
      onChanged()
    })
  }

  function handleRename() {
    if (!nameDraft.trim()) return
    startTransition(async () => {
      const result = await renameBuilding(building.id, nameDraft)
      if (!result.ok) {
        toast(result.message, 'error')
        return
      }
      setRenaming(false)
      toast('Obra renomeada.', 'success')
      onChanged()
    })
  }

  function handleDelete() {
    if (!confirm(`Excluir a obra "${building.name}"? Isso remove todas as alocações.`)) return
    startTransition(async () => {
      const result = await deleteBuilding(building.id)
      if (!result.ok) {
        toast(result.message, 'error')
        return
      }
      toast('Obra excluída.', 'success')
      onClose()
      onChanged()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          {renaming ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="flex-1 px-2 py-1 rounded-lg border border-border bg-background text-sm"
              />
              <button onClick={handleRename} disabled={isPending} className="text-xs font-medium text-primary">Salvar</button>
              <button onClick={() => { setRenaming(false); setNameDraft(building.name) }} className="text-xs text-muted-foreground">Cancelar</button>
            </div>
          ) : (
            <h2 className="font-semibold text-foreground truncate">{building.name}</h2>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0 ml-2" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Efetivo alocado ({building.assignees.length})
          </p>
          <ul className="flex flex-col gap-1 mb-4">
            {sortedProfiles.map((p) => {
              const assigned = assignedIds.has(p.id)
              return (
                <li key={p.id} className="flex items-center gap-2 py-1">
                  <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-[10px] font-bold overflow-hidden shrink-0">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      getInitial(p)
                    )}
                  </div>
                  <span className="text-sm text-foreground flex-1 truncate">
                    {formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name)}
                  </span>
                  {canManage ? (
                    <button
                      disabled={isPending}
                      onClick={() => handleToggleMember(p.id, assigned)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        assigned
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {assigned ? 'Remover' : 'Alocar'}
                    </button>
                  ) : (
                    assigned && <span className="text-xs text-primary font-medium">Alocado</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {canManage && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <button onClick={() => setRenaming(true)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Renomear obra
            </button>
            <button onClick={handleDelete} disabled={isPending} className="text-xs font-medium text-destructive hover:text-destructive/80">
              Excluir obra
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal: nomear obra no ponto clicado ────────────────────────────────────

function PlacementModal({
  lat,
  lng,
  onClose,
  onCreated,
}: {
  lat: number
  lng: number
  onClose: () => void
  onCreated: (b: BuildingWithAssignees) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [isSubmitting, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createBuilding({ name, lat, lng })
      if (!result.ok) {
        toast(result.message, 'error')
        return
      }
      toast('Obra criada.', 'success')
      onCreated({ ...result.data, assignees: [] })
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-5 flex flex-col gap-3"
      >
        <h2 className="font-semibold text-foreground">Nova obra</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da obra"
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
        <div className="flex items-center justify-end gap-2 mt-1">
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground px-3 py-1.5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── View principal ──────────────────────────────────────────────────────

export default function MapaView({ initialBuildings, profiles, canManage, googleMapsApiKey }: MapaViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: MAP_LIBRARIES,
  })

  const [buildings, setBuildings] = useState<BuildingWithAssignees[]>(initialBuildings)
  const [placing, setPlacing] = useState(false)
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithAssignees | null>(null)
  const [, startTransition] = useTransition()

  const refetch = useCallback(() => {
    startTransition(async () => {
      const result = await getBuildings()
      if (result.ok) setBuildings(result.data)
    })
  }, [])

  const mapCenter = useMemo(() => {
    if (buildings.length > 0) return { lat: buildings[0].lat, lng: buildings[0].lng }
    return DEFAULT_CENTER
  }, [buildings])

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!placing || !e.latLng) return
      setPendingPoint({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      setPlacing(false)
    },
    [placing],
  )

  if (!googleMapsApiKey) {
    return (
      <div data-testid="mapa-page" className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">Mapa</h1>
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          O mapa ainda não foi configurado. Defina <code className="px-1 py-0.5 rounded bg-muted">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> em <code className="px-1 py-0.5 rounded bg-muted">.env.local</code> (veja instruções no arquivo <code className="px-1 py-0.5 rounded bg-muted">.env.local.example</code>).
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div data-testid="mapa-page" className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">Mapa</h1>
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-destructive">
          Não foi possível carregar o Google Maps. Verifique a chave de API e as restrições configuradas no Google Cloud Console.
        </div>
      </div>
    )
  }

  return (
    <div data-testid="mapa-page" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa</h1>
          <p className="text-sm text-muted-foreground">Alocação do efetivo nas obras em fiscalização.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setPlacing((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              placing ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'
            }`}
          >
            {placing ? 'Clique no mapa para marcar…' : '+ Nova obra'}
          </button>
        )}
      </div>

      <div data-testid="mapa-map-container" className={`bg-card border border-border rounded-2xl overflow-hidden ${placing ? 'cursor-crosshair' : ''}`}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={CONTAINER_STYLE}
            center={mapCenter}
            zoom={buildings.length > 0 ? 15 : 12}
            onClick={handleMapClick}
            options={{ streetViewControl: false, fullscreenControl: true }}
          >
            {buildings.map((b) => (
              <BuildingMarker key={b.id} building={b} onClick={() => setSelectedBuilding(b)} />
            ))}
          </GoogleMap>
        ) : (
          <div data-testid="mapa-map-loading" style={CONTAINER_STYLE} className="flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
          </div>
        )}
      </div>

      {pendingPoint && (
        <PlacementModal
          lat={pendingPoint.lat}
          lng={pendingPoint.lng}
          onClose={() => setPendingPoint(null)}
          onCreated={(b) => {
            setBuildings((prev) => [...prev, b])
            setPendingPoint(null)
          }}
        />
      )}

      {selectedBuilding && (
        <BuildingDetailModal
          building={buildings.find((b) => b.id === selectedBuilding.id) ?? selectedBuilding}
          profiles={profiles}
          canManage={canManage}
          onClose={() => setSelectedBuilding(null)}
          onChanged={refetch}
        />
      )}
    </div>
  )
}
