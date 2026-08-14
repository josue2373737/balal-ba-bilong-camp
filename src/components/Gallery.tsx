import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import p1 from "@/assets/p1.jpg.asset.json";
import p2 from "@/assets/p2.jpg.asset.json";
import p3 from "@/assets/p3.jpg.asset.json";
import p4 from "@/assets/p4.jpg.asset.json";
import p5 from "@/assets/p5.jpg.asset.json";
import p6 from "@/assets/p6.jpg.asset.json";
import p7 from "@/assets/p7.jpg.asset.json";
import p8 from "@/assets/p8.jpg.asset.json";
import famille from "@/assets/famille.jpg.asset.json";

type Photo = { src: string; alt: string };

const photos: Photo[] = [
  { src: famille.url, alt: "Photo de famille des participants du camp biblique" },
  { src: p1.url, alt: "Remise de certificat à une participante" },
  { src: p8.url, alt: "Mamans et enfants réunis dans la joie" },
  { src: p4.url, alt: "Groupe de garçons en t-shirts « My heart Jesus »" },
  { src: p7.url, alt: "Trois jeunes filles souriantes au camp" },
  { src: p3.url, alt: "Remise de matériel à un jeune serviteur" },
  { src: p5.url, alt: "Moment de danse et de louange en plein air" },
  { src: p6.url, alt: "Encadreurs du camp avec un enfant" },
  { src: p2.url, alt: "Un tout-petit joyeux pendant les ateliers" },
];

export function Gallery() {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [],
  );
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, next, prev]);

  return (
    <section id="galerie" className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-accent">Galerie</p>
        <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
          Souvenirs de l'édition précédente
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Des instants de louange, d'amitié et de grâce, gardés précieusement.
        </p>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {photos.map((p, i) => (
            <button
              key={p.src}
              onClick={() => setIndex(i)}
              className="group block w-full break-inside-avoid overflow-hidden rounded-2xl bg-card shadow-soft"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="w-full transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>
      </div>

      {index !== null && photos[index] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95 p-4"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Fermer"
            className="absolute right-5 top-5 rounded-full bg-background/10 p-3 text-background transition-colors hover:bg-background/20"
          >
            <X className="size-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Photo précédente"
            className="absolute left-3 rounded-full bg-background/10 p-3 text-background transition-colors hover:bg-background/20 sm:left-8"
          >
            <ChevronLeft className="size-6" />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-h-full">
            <img
              src={photos[index].src}
              alt={photos[index].alt}
              className="mx-auto max-h-[78vh] w-auto rounded-xl object-contain"
            />
            <figcaption className="mt-4 text-center text-sm text-background/70">
              {photos[index].alt} — Édition précédente ({index + 1}/{photos.length})
            </figcaption>
          </figure>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Photo suivante"
            className="absolute right-3 rounded-full bg-background/10 p-3 text-background transition-colors hover:bg-background/20 sm:right-8"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
      )}
    </section>
  );
}
