export type FaceBox = { x: number; y: number; w: number; h: number };

/** Carré (en pixels) centré sur le visage, élargi de `pad`, ramené dans l'image — exprimé en fractions de la largeur/hauteur. */
export function squareBox(box: { x: number; y: number; width: number; height: number }, W: number, H: number, pad = 1.7): FaceBox {
  const side = Math.min(Math.max(box.width, box.height) * pad, W, H);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const x = Math.min(Math.max(cx - side / 2, 0), W - side);
  const y = Math.min(Math.max(cy - side / 2, 0), H - side);
  return { x: x / W, y: y / H, w: side / W, h: side / H };
}

/** Style CSS pour afficher uniquement le visage dans un conteneur carré (position: relative; overflow: hidden). */
export function faceCropStyle(b: FaceBox) {
  return { position: "absolute" as const, maxWidth: "none", width: `${100 / b.w}%`, left: `${(-100 * b.x) / b.w}%`, top: `${(-100 * b.y) / b.h}%` };
}
