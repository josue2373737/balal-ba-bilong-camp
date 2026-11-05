import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddMemory } from "@/components/AddMemory";
import { MemoryDetailsView, MemoryInteractions } from "@/components/MemoryInteractions";
import { Button } from "@/components/ui/button";
import { loadMemories, memoryOfTheDay, yearsAgo, type Memory } from "@/lib/memories";

import p1 from "@/assets/p1.jpg.asset.json";
import p2 from "@/assets/p2.jpg.asset.json";
import p3 from "@/assets/p3.jpg.asset.json";
import p4 from "@/assets/p4.jpg.asset.json";
import p5 from "@/assets/p5.jpg.asset.json";
import p6 from "@/assets/p6.jpg.asset.json";
import p7 from "@/assets/p7.jpg.asset.json";
import p8 from "@/assets/p8.jpg.asset.json";
import famille from "@/assets/famille.jpg.asset.json";

const photos: Memory[] = [
  { key: "famille", src: famille.url, alt: "Photo de famille des participants du camp biblique" },
  { key: "p1", src: p1.url, alt: "Remise de certificat à une participante" },
  { key: "p8", src: p8.url, alt: "Mamans et enfants réunis dans la joie" },
  { key: "p4", src: p4.url, alt: "Groupe de garçons en t-shirts « My heart Jesus »" },
  { key: "p7", src: p7.url, alt: "Trois jeunes filles souriantes au camp" },
  { key: "p3", src: p3.url, alt: "Remise de matériel à un jeune serviteur" },
  { key: "p5", src: p5.url, alt: "Moment de danse et de louange en plein air" },
  { key: "p6", src: p6.url, alt: "Encadreurs du camp avec un enfant" },
  { key: "p2", src: p2.url, alt: "Un tout-petit joyeux pendant les ateliers" },
];

export function Gallery() {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const memories = useQuery({ queryKey: ["camp-memories"], queryFn: loadMemories, enabled: hydrated, staleTime: 60 * 60 * 1000, refetchInterval: 60 * 60 * 1000 });
  const allPhotos = [...(memories.data ?? []), ...photos];
  const [index, setIndex] = useState<number | null>(null);
  const today = new Date();
  const featured = hydrated ? memoryOfTheDay(allPhotos, today) : undefined;
  const ago = featured ? yearsAgo(featured, today) : null;

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % allPhotos.length)), [allPhotos.length]);
  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + allPhotos.length) % allPhotos.length)), [allPhotos.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [index, close, next, prev]);

  const current = index !== null ? allPhotos[index] : undefined;

  return (
    <section id="galerie" className="bg-secondary/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {featured && (
          <div className="mb-16 grid items-center gap-6 overflow-hidden rounded-3xl border border-border bg-card shadow-soft md:grid-cols-2">
            <Button variant="ghost" className="h-auto rounded-none p-0" onClick={() => setIndex(allPhotos.indexOf(featured))} aria-label={`Ouvrir le souvenir du jour : ${featured.alt}`}>
              <img src={featured.src} alt={featured.alt} className="aspect-[4/3] w-full object-cover" />
            </Button>
            <div className="space-y-3 p-6 md:p-8">
              <p className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-[0.3em] text-accent"><Sparkles className="size-4" /> Souvenir du jour</p>
              <h3 className="font-display text-3xl text-foreground">{ago ? `Il y a ${ago} an${ago > 1 ? "s" : ""}…` : "Vous vous souvenez ?"}</h3>
              <p className="text-muted-foreground">{featured.alt}</p>
              <MemoryDetailsView memory={featured} />
              <Button variant="outline" onClick={() => setIndex(allPhotos.indexOf(featured))}>Laisser un mot doux</Button>
            </div>
          </div>
        )}

        <p className="font-display text-sm uppercase tracking-[0.3em] text-accent">Galerie</p>
        <h2 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">Souvenirs de l'édition précédente</h2>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-muted-foreground">Des instants de louange, d'amitié et de grâce, gardés précieusement.</p>
          <AddMemory onShared={() => queryClient.invalidateQueries({ queryKey: ["camp-memories"] })} />
        </div>
        {memories.isError && <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 text-sm text-destructive">Les souvenirs partagés n’ont pas pu être chargés.<Button variant="outline" onClick={() => memories.refetch()}>Réessayer</Button></div>}

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {allPhotos.map((p, i) => (
            <Button variant="ghost" key={p.key} onClick={() => setIndex(i)} aria-label={p.alt}
              className="group block h-auto min-h-24 w-full break-inside-avoid overflow-hidden rounded-2xl bg-card p-0 shadow-soft">
              <img src={p.src} alt={p.alt} loading="lazy" className="w-full transition-transform duration-500 group-hover:scale-[1.04]" />
            </Button>
          ))}
        </div>
      </div>

      {current && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-foreground/95 p-4 lg:flex-row lg:items-center lg:gap-6" onClick={close} role="dialog" aria-modal="true" aria-label={current.alt}>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Fermer" className="fixed right-5 top-5 z-10 rounded-full bg-background/10 text-background hover:bg-background/20"><X className="size-5" /></Button>
          <div className="relative flex flex-1 items-center justify-center py-12">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Photo précédente" className="absolute left-0 rounded-full bg-background/10 text-background hover:bg-background/20"><ChevronLeft className="size-6" /></Button>
            <figure onClick={(e) => e.stopPropagation()}>
              <img src={current.src} alt={current.alt} className="mx-auto max-h-[70vh] w-auto rounded-xl object-contain" />
              <figcaption className="mx-auto mt-4 max-w-lg break-words text-center text-sm text-background/70">{current.alt} — {current.edition ?? "Édition précédente"} ({index! + 1}/{allPhotos.length})</figcaption>
            </figure>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Photo suivante" className="absolute right-0 rounded-full bg-background/10 text-background hover:bg-background/20"><ChevronRight className="size-6" /></Button>
          </div>
          <aside onClick={(e) => e.stopPropagation()} className="w-full space-y-4 rounded-2xl bg-card p-5 lg:max-h-[85vh] lg:w-96 lg:overflow-y-auto">
            <MemoryDetailsView memory={current} />
            <MemoryInteractions key={current.key} memory={current} />
          </aside>
        </div>
      )}
    </section>
  );
}
