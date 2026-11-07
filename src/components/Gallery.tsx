import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, ArrowLeft, User, Trash2, Pencil } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddMemory } from "@/components/AddMemory";
import { MemoryDetailsView, MemoryInteractions } from "@/components/MemoryInteractions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EnrollFace } from "@/components/EnrollFace";
import { FaceCrop } from "@/components/FaceCrop";
import { loadMemories, memoryOfTheDay, yearsAgo, type Memory } from "@/lib/memories";
import { staticPhotos as photos } from "@/lib/static-photos";
import { deleteMyAlbum, getMyAlbum, isAdmin, loadPeople, loadPersonKeys, renamePerson, type Person } from "@/lib/faces";
import { cn } from "@/lib/utils";

function PhotoGrid({ items, onOpen }: { items: Memory[]; onOpen: (i: number) => void }) {
  return (
    <div className="grid grid-flow-dense grid-cols-3 gap-0.5 sm:grid-cols-4 sm:gap-1 lg:grid-cols-6">
      {items.map((p, i) => (
        <button key={p.key} type="button" onClick={() => onOpen(i)} aria-label={p.alt}
          className={cn("group relative block aspect-square overflow-hidden bg-muted", items.length >= 6 && i % 9 === 0 && "col-span-2 row-span-2")}>
          <img src={p.src} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        </button>
      ))}
    </div>
  );
}

function PersonCard({ person, cover, mine, onOpen }: { person: Person; cover: Memory | undefined; mine: boolean; onOpen: () => void }) {
  const label = person.name ?? "Album sans nom";
  return (
    <button type="button" onClick={onOpen} aria-label={`${label}, ${person.photoCount} photo${person.photoCount > 1 ? "s" : ""}`}
      className="group relative block aspect-square overflow-hidden rounded-2xl bg-muted text-left shadow-soft">
      {cover && person.coverBox
        ? <FaceCrop src={cover.src} box={person.coverBox} className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        : <span className="absolute inset-0 flex items-center justify-center text-muted-foreground"><User className="size-1/3" /></span>}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/85 to-transparent p-3 pt-10 text-background">
        <span className="block truncate font-display text-lg font-bold leading-tight">{label}</span>
        <span className="block text-xs text-background/80">{person.photoCount} photo{person.photoCount > 1 ? "s" : ""}{mine ? " · mon album" : ""}</span>
      </span>
    </button>
  );
}

function AdminRename({ person, onSaved }: { person: Person; onSaved: () => void }) {
  const [name, setName] = useState(person.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form className="flex items-center gap-2" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError("");
      try { await renamePerson(person.id, name); onSaved(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}>
      <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Nom de la personne" aria-label="Nom de l’album" className="max-w-64" />
      <Button type="submit" variant="outline" disabled={busy}><Pencil /> Nommer</Button>
      {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
    </form>
  );
}

export function Gallery() {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [mineId, setMineId] = useState<string | null>(null);
  useEffect(() => { setHydrated(true); setMineId(getMyAlbum()?.id ?? null); }, []);
  const memories = useQuery({ queryKey: ["camp-memories"], queryFn: loadMemories, enabled: hydrated, staleTime: 60 * 60 * 1000, refetchInterval: 60 * 60 * 1000 });
  const people = useQuery({ queryKey: ["people"], queryFn: loadPeople, enabled: hydrated, staleTime: 5 * 60 * 1000 });
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: isAdmin, enabled: hydrated, staleTime: 5 * 60 * 1000 });
  const allPhotos = [...(memories.data ?? []), ...photos];
  const [tab, setTab] = useState("photos");
  const [albumId, setAlbumId] = useState<string | null>(null);
  const album = people.data?.find((p) => p.id === albumId);
  const albumKeys = useQuery({ queryKey: ["person-photos", albumId], queryFn: () => loadPersonKeys(albumId!), enabled: !!albumId });
  const albumPhotos = allPhotos.filter((p) => albumKeys.data?.includes(p.key));
  const [lightbox, setLightbox] = useState<{ list: Memory[]; index: number } | null>(null);
  const today = new Date();
  const featured = hydrated ? memoryOfTheDay(allPhotos, today) : undefined;
  const ago = featured ? yearsAgo(featured, today) : null;

  const list = lightbox?.list ?? [];
  const index = lightbox?.index ?? null;
  const close = useCallback(() => setLightbox(null), []);
  const next = useCallback(() => setLightbox((l) => (l ? { ...l, index: (l.index + 1) % l.list.length } : l)), []);
  const prev = useCallback(() => setLightbox((l) => (l ? { ...l, index: (l.index - 1 + l.list.length) % l.list.length } : l)), []);

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

  const current = index !== null ? list[index] : undefined;
  const refreshPeople = () => queryClient.invalidateQueries({ queryKey: ["people"] }).then(() => queryClient.invalidateQueries({ queryKey: ["person-photos"] }));
  const openFeatured = () => featured && setLightbox({ list: allPhotos, index: allPhotos.indexOf(featured) });
  const canDelete = !!album && (admin.data === true || mineId === album.id);

  return (
    <section id="galerie" className="bg-secondary py-24">
      <div className="mx-auto max-w-6xl px-6">
        {featured && (
          <div className="mb-16 grid items-center gap-6 overflow-hidden rounded-md rounded-tr-[3rem] border border-border bg-card shadow-soft md:grid-cols-2">
            <Button variant="ghost" className="h-auto rounded-none p-0" onClick={openFeatured} aria-label={`Ouvrir le souvenir du jour : ${featured.alt}`}>
              <img src={featured.src} alt={featured.alt} className="aspect-[4/3] w-full object-cover" />
            </Button>
            <div className="space-y-3 p-6 md:p-8">
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground"><Sparkles className="size-4" /> Souvenir du jour</p>
              <h3 className="text-3xl text-foreground">{ago ? `Il y a ${ago} an${ago > 1 ? "s" : ""}…` : "Vous vous souvenez ?"}</h3>
              <p className="text-muted-foreground">{featured.alt}</p>
              <MemoryDetailsView memory={featured} />
              <Button variant="outline" onClick={openFeatured}>Laisser un mot doux</Button>
            </div>
          </div>
        )}

        <h2 className="text-4xl leading-[1.05] text-foreground sm:text-6xl">Souvenirs de l'édition précédente</h2>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-lg text-foreground/80">Des instants de louange, d'amitié et de grâce, gardés précieusement.</p>
          <AddMemory onShared={() => queryClient.invalidateQueries({ queryKey: ["camp-memories"] })} onAnalyzed={refreshPeople} />
        </div>
        {memories.isError && <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 text-sm text-destructive">Les souvenirs partagés n’ont pas pu être chargés.<Button variant="outline" onClick={() => memories.refetch()}>Réessayer</Button></div>}

        <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "photos") setAlbumId(null); }} className="mt-10">
          <TabsList>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="personnes">Personnes</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-6">
            <PhotoGrid items={allPhotos} onOpen={(i) => setLightbox({ list: allPhotos, index: i })} />
          </TabsContent>

          <TabsContent value="personnes" className="mt-6">
            {!albumId && (
              <>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl text-foreground/80">Chacun peut scanner son visage pour avoir son propre album : les photos où il apparaît s’y rangent automatiquement.</p>
                  <EnrollFace onEnrolled={(id) => { setMineId(getMyAlbum()?.id ?? null); void refreshPeople(); setAlbumId(id); }} />
                </div>
                {people.isError && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">Les albums n’ont pas pu être chargés.<Button variant="outline" onClick={() => people.refetch()}>Réessayer</Button></div>}
                {people.data?.length === 0 && <p className="rounded-md border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Aucun album pour l’instant. Soyez le premier à scanner votre visage !</p>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {people.data?.map((p) => (
                    <PersonCard key={p.id} person={p} mine={mineId === p.id} cover={allPhotos.find((x) => x.key === p.coverKey)} onOpen={() => setAlbumId(p.id)} />
                  ))}
                </div>
              </>
            )}

            {albumId && (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => setAlbumId(null)}><ArrowLeft /> Personnes</Button>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-2xl text-foreground">{album?.name ?? "Album sans nom"}</h3>
                    <p className="text-sm text-muted-foreground">{albumKeys.isPending ? "Chargement…" : `${albumPhotos.length} photo${albumPhotos.length > 1 ? "s" : ""}`}{mineId === albumId ? " · mon album" : ""}</p>
                  </div>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline"><Trash2 /> {mineId === albumId ? "Supprimer mon album" : "Supprimer l’album"}</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cet album ?</AlertDialogTitle>
                          <AlertDialogDescription>L’empreinte du visage est effacée. Les photos restent dans la galerie. Vous pourrez recréer un album plus tard.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            try { await deleteMyAlbum(albumId, getMyAlbum()?.id === albumId ? getMyAlbum()!.token : null); setMineId(getMyAlbum()?.id ?? null); setAlbumId(null); await refreshPeople(); } catch { /* le bouton reste disponible */ }
                          }}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {admin.data === true && album && <div className="mb-6"><AdminRename key={album.id + (album.name ?? "")} person={album} onSaved={refreshPeople} /></div>}
                {albumKeys.isError && <p role="alert" className="text-sm text-destructive">L’album n’a pas pu être chargé.</p>}
                {albumKeys.isSuccess && albumPhotos.length === 0 && <p className="rounded-md border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Aucune photo trouvée pour l’instant. Elles apparaîtront ici dès qu’un souvenir avec ce visage sera partagé.</p>}
                <PhotoGrid items={albumPhotos} onOpen={(i) => setLightbox({ list: albumPhotos, index: i })} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {current && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-foreground/95 p-4 lg:flex-row lg:items-center lg:gap-6" onClick={close} role="dialog" aria-modal="true" aria-label={current.alt}>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Fermer" className="fixed right-5 top-5 z-10 rounded-full bg-background/10 text-background hover:bg-background/20"><X className="size-5" /></Button>
          <div className="relative flex flex-1 items-center justify-center py-12">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Photo précédente" className="absolute left-0 rounded-full bg-background/10 text-background hover:bg-background/20"><ChevronLeft className="size-6" /></Button>
            <figure onClick={(e) => e.stopPropagation()}>
              <img src={current.src} alt={current.alt} className="mx-auto max-h-[70vh] w-auto rounded-xl object-contain" />
              <figcaption className="mx-auto mt-4 max-w-lg break-words text-center text-sm text-background/70">{current.alt} — {current.edition ?? "Édition précédente"} ({index! + 1}/{list.length})</figcaption>
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
