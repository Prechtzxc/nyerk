"use client"

import { useMemo, useState } from "react"
import { Calendar, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { useToast } from "@shared/hooks/use-toast"
import { useCMS } from "@admin/contexts/cms-context"
import { CMSSectionHeader } from "./cms-section-header"
import { CMSImageUpload } from "./cms-image-upload"
import { CMSStatusBadge, EmptyState } from "./cms-status-badge"

type GalleryForm = { title: string; clientName: string; description: string; eventDate: string; venueName: string; image: string }
const EMPTY_FORM: GalleryForm = { title: "", clientName: "", description: "", eventDate: "", venueName: "", image: "" }

export function CMSGalleryTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { cmsData, addPastEvent, updatePastEvent, deletePastEvent } = useCMS()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GalleryForm>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const venueNames = useMemo(() => [...(cmsData.venues || []), ...(cmsData.offices || [])].map((s: any) => s.name).filter(Boolean) as string[], [cmsData.venues, cmsData.offices])
  const sortedEvents = useMemo(() => [...(cmsData.pastEvents || [])].sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()), [cmsData.pastEvents])

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(false) }
  const openNew = () => { resetForm(); setShowModal(true) }
  const openEdit = (e: any) => { setEditingId(e.id); setForm({ title: e.title || "", clientName: e.clientName || "", description: e.description || "", eventDate: e.eventDate || "", venueName: e.venueName || "", image: e.image || "" }); setShowModal(true) }

  const handleSave = () => {
    if (!form.title.trim()) { toast({ title: "Title required", description: "Enter the event title.", variant: "destructive" }); return }
    if (!form.eventDate) { toast({ title: "Date required", description: "Select the event date.", variant: "destructive" }); return }
    if (!form.image.trim()) { toast({ title: "Photo required", description: "Upload a photo.", variant: "destructive" }); return }
    const payload = { title: form.title.trim(), clientName: form.clientName.trim(), description: form.description.trim(), eventDate: form.eventDate, venueName: form.venueName || "One Estela Place", image: form.image || "/placeholder.jpg", isFeatured: true, hasClientConsent: true }
    if (editingId) { updatePastEvent(editingId, payload); toast({ title: "Photo updated", description: "Changes saved.", className: "bg-emerald-500 text-white border-none" }) }
    else { addPastEvent(payload); toast({ title: "Photo added", description: "New photo uploaded.", className: "bg-emerald-500 text-white border-none" }) }
    resetForm()
  }

  const handleDelete = (id: string) => { deletePastEvent(id); setConfirmDelete(null); toast({ title: "Photo deleted", description: "Photo removed.", className: "bg-emerald-500 text-white border-none" }) }

  function eventStatus(e: any) {
    if (e.isFeatured && e.hasClientConsent) return "live" as const
    return "live" as const
  }

  return (
    <div>
      <CMSSectionHeader title="Past Client Gallery" description="Upload real event photos from past clients."
        currentSection="gallery" onNavigate={onNavigate}
        action={<Button type="button" onClick={openNew} className="h-9 rounded-lg bg-pink-600 px-3.5 text-xs font-bold text-white hover:bg-pink-700"><Plus className="mr-1 h-3.5 w-3.5" /> Add Photo</Button>} />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2.5">
          <p className="text-[11px] font-semibold text-slate-500">
            {cmsData.pastEvents.length} photo{cmsData.pastEvents.length !== 1 ? "s" : ""}
          </p>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {sortedEvents.map((event: any) => (
              <div key={event.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="relative h-40 overflow-hidden bg-slate-100">
                  <img src={event.image?.trim() ? event.image : "/placeholder.jpg"} alt={event.title} className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/placeholder.jpg" }} />
                  <div className="absolute right-2 top-2"><CMSStatusBadge status={eventStatus(event)} /></div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-black text-slate-950">{event.title}</h3>
                  {event.clientName && <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-pink-600">{event.clientName}</p>}
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500"><Calendar className="h-3 w-3" />{event.eventDate || "No date"}</p>
                  <div className="mt-3 flex gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(event)} className="h-8 flex-1 rounded-md border-slate-200 text-[10px] font-bold"><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(event.id)} className="h-8 flex-1 rounded-md border-rose-200 text-[10px] font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState icon={<Upload className="h-8 w-8 text-pink-400" />} title="No past client photos yet"
              description="Upload real event photos to show past client bookings on the landing page."
              action={<Button type="button" onClick={openNew} className="h-9 rounded-lg bg-pink-600 text-xs font-bold text-white hover:bg-pink-700"><Upload className="mr-1.5 h-4 w-4" /> Upload Photo</Button>} />
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl max-h-[calc(100dvh-32px)] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
              <h2 className="text-base font-black text-slate-950">{editingId ? "Edit Photo" : "Add Past Client Photo"}</h2>
              <button type="button" onClick={resetForm} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Event Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Santos Birthday" className="mt-1 h-10 rounded-lg border-slate-200 text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Client Name</label>
                  <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Santos Family" className="mt-1 h-10 rounded-lg border-slate-200 text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Event Date</label>
                  <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="mt-1 h-10 rounded-lg border-slate-200 text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Venue</label>
                  <Input list="venue-list-modal" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} placeholder="Select venue" className="mt-1 h-10 rounded-lg border-slate-200 text-sm font-semibold" />
                  <datalist id="venue-list-modal">{venueNames.map((n) => <option key={n} value={n} />)}</datalist>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Description</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description..."
                  className="mt-1 min-h-[80px] resize-none rounded-lg border-slate-200 text-sm font-semibold" />
              </div>
              <CMSImageUpload label="Event Photo" value={form.image} storagePath="gallery" onValueChange={(v) => setForm({ ...form, image: v })} note="Upload an actual event photo from a past client booking." />
            </div>
            <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white px-5 py-3.5">
              <Button type="button" onClick={handleSave} className="h-9 flex-1 rounded-lg bg-pink-600 text-xs font-bold text-white hover:bg-pink-700">
                <Save className="mr-1.5 h-3.5 w-3.5" /> {editingId ? "Save Changes" : "Add Photo"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="h-9 rounded-lg border-slate-200 text-xs font-bold"><X className="mr-1.5 h-3.5 w-3.5" /> Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-black text-slate-900">Delete Photo?</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">This cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(null)} className="h-9 flex-1 rounded-lg border-slate-200 text-xs font-bold">Cancel</Button>
              <Button type="button" onClick={() => handleDelete(confirmDelete)} className="h-9 flex-1 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
