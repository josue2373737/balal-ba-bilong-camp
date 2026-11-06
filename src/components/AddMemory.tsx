import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Send, Check, Mic, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { shareMemory, validatePhoto, validateAudio } from "@/lib/memories";

const empty = { caption: "", date: "", year: "", location: "", people: "", story: "" };

export function AddMemory({ onShared }: { onShared: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(empty);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!audio) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(audio); setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  function stopRecording() { recorder.current?.stop(); }
  function changeOpen(value: boolean) {
    if (busy) return;
    if (!value) { stopRecording(); setFile(null); setForm(empty); setAudio(null); setError(""); setSuccess(false); }
    setOpen(value);
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: (rec.mimeType || "audio/webm").split(";")[0] ?? "audio/webm" });
        try { validateAudio(blob); setAudio(blob); } catch (e) { setError((e as Error).message); }
      };
      recorder.current = rec; rec.start(); setRecording(true);
    } catch { setError("Impossible d’accéder au micro. Vérifiez l’autorisation du navigateur."); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || busy || recording) return;
    setBusy(true); setError("");
    try { await shareMemory(file, form, audio); setSuccess(true); await onShared(); }
    catch (err) { setError(err instanceof Error ? err.message : "L’envoi a échoué. Veuillez réessayer."); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button size="lg" className="shrink-0"><ImagePlus /> Ajouter un souvenir</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="pr-6 font-display text-2xl">{success ? "Merci pour votre souvenir !" : "Ajouter un souvenir"}</DialogTitle>
          <DialogDescription>{success ? "Votre photo est maintenant partagée dans la galerie." : "Une photo, et l’histoire qui va avec."}</DialogDescription>
        </DialogHeader>
        {success ? <div className="space-y-5"><Check className="mx-auto size-12 text-primary" /><Button className="w-full" onClick={() => changeOpen(false)}>Voir la galerie</Button></div> : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memory-photo">Photo</Label>
              <input id="memory-photo" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => {
                const selected = event.target.files?.[0];
                if (!selected) return;
                try { validatePhoto(selected); setFile(selected); setError(""); }
                catch (err) { setFile(null); setError(err instanceof Error ? err.message : "Photo invalide."); event.target.value = ""; }
              }} />
              <Button type="button" variant="outline" className="h-auto min-h-28 w-full flex-col border-dashed py-5" disabled={busy} onClick={() => inputRef.current?.click()}>
                {preview ? <img src={preview} alt="Aperçu de votre souvenir" className="max-h-44 max-w-full rounded-md object-contain" /> : <ImagePlus className="size-7" />}
                {file ? "Changer la photo" : "Choisir une photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · 10 Mo maximum</p>
            </div>
            <div className="space-y-2"><Label htmlFor="memory-caption">Légende (facultative)</Label><Input id="memory-caption" maxLength={200} placeholder="Un beau moment au camp…" value={form.caption} disabled={busy} onChange={set("caption")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="memory-date">Date précise</Label><Input id="memory-date" type="date" value={form.date} disabled={busy || !!form.year} onChange={set("date")} /></div>
              <div className="space-y-2"><Label htmlFor="memory-year">ou année</Label><Input id="memory-year" inputMode="numeric" maxLength={4} placeholder="2019" value={form.year} disabled={busy || !!form.date} onChange={set("year")} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="memory-location">Lieu</Label><Input id="memory-location" maxLength={200} placeholder="Maison de Grand-Mère, Yaoundé" value={form.location} disabled={busy} onChange={set("location")} /></div>
            <div className="space-y-2"><Label htmlFor="memory-people">Personnes présentes</Label><Input id="memory-people" maxLength={500} placeholder="Tata Rose, Paul, les enfants…" value={form.people} disabled={busy} onChange={set("people")} /></div>
            <div className="space-y-2"><Label htmlFor="memory-story">L’histoire derrière la photo</Label><Textarea id="memory-story" maxLength={5000} rows={4} placeholder="Ce jour-là…" value={form.story} disabled={busy} onChange={set("story")} /></div>
            <div className="space-y-2">
              <Label>Anecdote vocale (facultative)</Label>
              {audioUrl ? (
                <div className="flex items-center gap-2"><audio controls src={audioUrl} className="min-w-0 flex-1" /><Button type="button" variant="ghost" size="icon" aria-label="Supprimer la note vocale" disabled={busy} onClick={() => setAudio(null)}><Trash2 /></Button></div>
              ) : recording ? (
                <Button type="button" variant="destructive" className="w-full" onClick={stopRecording}><Square /> Arrêter l’enregistrement</Button>
              ) : (
                <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={startRecording}><Mic /> Enregistrer une note vocale</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Votre souvenir sera visible par tous. En le partageant, vous confirmez l’accord des personnes concernées.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!file || busy || recording}>{busy ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Send />}{busy ? "Envoi en cours…" : "Partager le souvenir"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
