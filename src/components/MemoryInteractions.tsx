import { useState, type FormEvent } from "react";
import { Heart, ThumbsUp, Send, MapPin, Users, CalendarDays } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addComment, addReaction, loadInteractions, type Memory } from "@/lib/memories";

export function MemoryDetailsView({ memory }: { memory: Memory }) {
  const when = memory.takenOn ? new Date(memory.takenOn).toLocaleDateString("fr-FR", { dateStyle: "long" }) : memory.year ? `Vers ${memory.year}` : null;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        {when && <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />{when}</span>}
        {memory.location && <span className="inline-flex items-center gap-1"><MapPin className="size-4" />{memory.location}</span>}
        {memory.people && <span className="inline-flex items-center gap-1"><Users className="size-4" />{memory.people}</span>}
      </div>
      {memory.story && <p className="whitespace-pre-line break-words text-foreground">{memory.story}</p>}
      {memory.audioUrl && <audio controls src={memory.audioUrl} className="w-full" aria-label="Anecdote vocale" />}
    </div>
  );
}

export function MemoryInteractions({ memory }: { memory: Memory }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["interactions", memory.key], queryFn: () => loadInteractions(memory.key) });
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["interactions", memory.key] });

  async function react(kind: "like" | "heart") {
    setError("");
    try { await addReaction(memory.key, kind); await refresh(); } catch (e) { setError((e as Error).message); }
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try { await addComment(memory.key, { author, body }); setBody(""); await refresh(); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => react("heart")} aria-label="Ajouter un cœur"><Heart className="text-accent" /> {q.data?.counts.heart ?? 0}</Button>
        <Button variant="outline" size="sm" onClick={() => react("like")} aria-label="J’aime"><ThumbsUp className="text-primary" /> {q.data?.counts.like ?? 0}</Button>
      </div>
      {q.isError && <p role="alert" className="text-sm text-destructive">Les mots doux n’ont pas pu être chargés.</p>}
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {q.data?.comments.map((c) => (
          <li key={c.id} className="rounded-lg bg-secondary/60 p-3 text-sm">
            <p className="font-medium text-foreground">{c.author}</p>
            <p className="whitespace-pre-line break-words text-muted-foreground">{c.body}</p>
          </li>
        ))}
        {q.data && !q.data.comments.length && <li className="text-sm text-muted-foreground">Soyez le premier à laisser un mot doux.</li>}
      </ul>
      <form onSubmit={submit} className="space-y-2">
        <Input placeholder="Votre prénom (facultatif)" maxLength={80} value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Votre prénom" />
        <Textarea placeholder="Un petit mot doux…" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Votre mot" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={busy || !body.trim()}><Send /> Envoyer</Button>
      </form>
    </div>
  );
}
