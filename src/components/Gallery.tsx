import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import g3 from "@/assets/g3.jpg";
import g4 from "@/assets/g4.jpg";
import g5 from "@/assets/g5.jpg";
import g6 from "@/assets/g6.jpg";
import g7 from "@/assets/g7.jpg";
import g8 from "@/assets/g8.jpg";

type Photo = { src: string; alt: string; edition: "2024" | "2025" };

const photos: Photo[] = [
  { src: g1, alt: "Étude de la Bible en petits groupes sous les arbres", edition: "2024" },
  { src: g2, alt: "Chorale des jeunes en pleine louange", edition: "2025" },
  { src: g3, alt: "Tournoi de football entre campeurs", edition: "2024" },
  { src: g4, alt: "Moment de partage fraternel au coucher du soleil", edition: "2025" },
  { src: g5, alt: "Repas communautaire partagé au camp", edition: "2024" },
  { src: g6, alt: "Photo de groupe des participants du camp", edition: "2025" },
  { src: g7, alt: "Veillée de témoignages autour du feu", edition: "2024" },
  { src: g8, alt: "Enseignement biblique devant l'assemblée", edition: "2025" },
];

const filters = [
  { key: "all", label: "Toutes" },
  { key: "2024", label: "Édition 2024" },
  { key: "2025", label: "Édition 2025" },
] as const;

export function Gallery() {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [index, setIndex] = useState<number | null>(null);

  const visible = photos.filter((p) => filter === "all" || p.edition === filter);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % visible.length)),
    [visible.length],
  );
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + visible.length) % visible.length)),
    [visible.length],
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
          Souvenirs des éditions passées
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Des instants de louange, d'amitié et de grâce, gardés précieusement.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setIndex(null);
              }}
              className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {visible.map((p, i) => (
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

      {index !== null && visible[index] && (
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
              src={visible[index].src}
              alt={visible[index].alt}
              className="mx-auto max-h-[78vh] w-auto rounded-xl object-contain"
            />
            <figcaption className="mt-4 text-center text-sm text-background/70">
              {visible[index].alt} — Édition {visible[index].edition} ({index + 1}/{visible.length})
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
