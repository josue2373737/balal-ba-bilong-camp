import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, LoaderCircle, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { shareMemory, validatePhoto } from "@/lib/memories";

export function AddMemory({ onShared }: { onShared: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function changeOpen(value: boolean) {
    if (busy) return;
    setOpen(value);
    if (!value) { setFile(null); setCaption(""); setError(""); setSuccess(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true); setError("");
    try {
      await shareMemory(file, caption);
      setSuccess(true);
      await onShared();
    } catch (err) {
      setError(err instanceof Error ? err.message : "L’envoi a échoué. Veuillez réessayer.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button size="lg" className="shrink-0"><ImagePlus /> Ajouter un souvenir</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="pr-6 font-display text-2xl">{success ? "Merci pour votre souvenir !" : "Ajouter un souvenir"}</DialogTitle>
          <DialogDescription>{success ? "Votre photo est maintenant partagée dans la galerie." : "Une photo, un moment de fraternité à partager."}</DialogDescription>
        </DialogHeader>
        {success ? <div className="space-y-5"><Check className="mx-auto size-12 text-primary" /><Button className="w-full" onClick={() => changeOpen(false)} disabled={busy}>Voir la galerie</Button></div> : (
          <form onSubmit={submit} className="space-y-5">
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
            <div className="space-y-2"><Label htmlFor="memory-caption">Légende (facultative)</Label><Input id="memory-caption" maxLength={200} placeholder="Un beau moment au camp…" value={caption} disabled={busy} onChange={(event) => setCaption(event.target.value)} /></div>
            <p className="text-xs text-muted-foreground">Votre photo sera visible par tous. En la partageant, vous confirmez l’accord des personnes photographiées.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={!file || busy}>{busy ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Send />}{busy ? "Envoi en cours…" : "Partager le souvenir"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}