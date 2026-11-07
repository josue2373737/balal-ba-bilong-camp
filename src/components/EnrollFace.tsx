import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { detectFaces, enrollPerson, imageToCanvas } from "@/lib/faces";
import { validatePhoto } from "@/lib/memories";

type Step = "intro" | "camera" | "working" | "done";

export function EnrollFace({ onEnrolled }: { onEnrolled: (personId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(false);
  const [personId, setPersonId] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function stopCamera() { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; }
  useEffect(() => stopCamera, []);

  function changeOpen(value: boolean) {
    if (step === "working") return;
    if (!value) { stopCamera(); setStep("intro"); setConsent(false); setError(""); }
    setOpen(value);
  }

  async function startCamera() {
    setError("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStep("camera");
      requestAnimationFrame(() => { if (video.current && stream.current) { video.current.srcObject = stream.current; void video.current.play(); } });
    } catch { setError("Impossible d’accéder à la caméra. Vérifiez l’autorisation du navigateur, ou choisissez une photo."); }
  }

  async function finish(samples: number[][]) {
    const result = await enrollPerson(samples);
    setExisting(result.existing); setPersonId(result.id); setStep("done");
    onEnrolled(result.id);
  }

  function oneFace(faces: Awaited<ReturnType<typeof detectFaces>>) {
    if (faces.length === 0) throw new Error("Aucun visage net n’a été trouvé. Placez-vous face à la lumière et réessayez.");
    if (faces.length > 1) throw new Error("Un seul visage doit être visible. Choisissez une photo où vous êtes seul(e).");
    return faces[0]!;
  }

  async function capture() {
    const v = video.current;
    if (!v) return;
    setError(""); setStep("working");
    try {
      const samples: number[][] = [];
      for (let i = 0; i < 3; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        canvas.getContext("2d")!.drawImage(v, 0, 0);
        samples.push(oneFace(await detectFaces(canvas)).descriptor);
        if (i < 2) await new Promise((r) => setTimeout(r, 400));
      }
      stopCamera();
      await finish(samples);
    } catch (e) { setError(e instanceof Error ? e.message : "L’analyse a échoué."); await startCamera(); }
  }

  async function fromFile(file: File) {
    setError(""); setStep("working");
    try {
      validatePhoto(file);
      await finish([oneFace(await detectFaces(await imageToCanvas(file))).descriptor]);
    } catch (e) { setError(e instanceof Error ? e.message : "L’analyse a échoué."); setStep("intro"); }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button size="lg" className="shrink-0"><ScanFace /> Scanner mon visage</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" onInteractOutside={(e) => { if (step === "working") e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="pr-6 font-display text-2xl">{step === "done" ? (existing ? "Votre album existe déjà" : "Votre album est créé !") : "Créer mon album"}</DialogTitle>
          <DialogDescription>{step === "done" ? "Les photos où vous apparaissez y sont rangées automatiquement, y compris les prochaines." : "Retrouvez toutes les photos où vous êtes, rangées automatiquement."}</DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/80">
              <li>L’analyse se fait sur votre appareil. Seule une empreinte numérique est enregistrée, pas votre selfie.</li>
              <li>Vous pouvez supprimer votre album à tout moment, depuis cet appareil.</li>
              <li>Pour un enfant, c’est un parent qui scanne et donne son accord.</li>
              <li>L’administrateur donnera un nom à votre album.</li>
            </ul>
            <div className="flex items-start gap-3">
              <Checkbox id="face-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <Label htmlFor="face-consent" className="text-sm font-normal leading-snug">J’accepte que mon visage (ou celui de mon enfant) soit reconnu pour créer cet album.</Label>
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void fromFile(f); }} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={!consent} onClick={startCamera}><Camera /> Prendre un selfie</Button>
              <Button variant="outline" disabled={!consent} onClick={() => fileInput.current?.click()}><ImagePlus /> Choisir une photo</Button>
            </div>
          </div>
        )}

        {step === "camera" && (
          <div className="space-y-4">
            <video ref={video} playsInline muted className="aspect-[3/4] w-full -scale-x-100 rounded-md bg-foreground object-cover" />
            <p className="text-sm text-muted-foreground">Visage de face, bien éclairé, sans lunettes de soleil. Restez immobile pendant la capture.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => { stopCamera(); setStep("intro"); }}>Annuler</Button>
              <Button onClick={capture}><ScanFace /> Capturer</Button>
            </div>
          </div>
        )}

        {step === "working" && (
          <p className="flex items-center gap-3 py-6 text-sm text-foreground/80" role="status">
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" /> Analyse en cours… la première fois, le chargement peut prendre un moment (≈ 7 Mo).
          </p>
        )}

        {step === "done" && <Button className="w-full" onClick={() => { changeOpen(false); onEnrolled(personId); }}>Voir mon album</Button>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
