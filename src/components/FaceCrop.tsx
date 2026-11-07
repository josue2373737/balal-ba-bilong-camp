import { faceCropStyle, type FaceBox } from "@/lib/face-geometry";

/** Affiche uniquement le visage d'une photo dans un carré. */
export function FaceCrop({ src, box, className = "" }: { src: string; box: FaceBox; className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-muted ${className}`}>
      <img src={src} alt="" loading="lazy" style={faceCropStyle(box)} />
    </div>
  );
}
