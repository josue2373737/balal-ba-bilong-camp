import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, LogOut, ScanFace } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeAllPhotos, isAdmin, loadPeople } from "@/lib/faces";
import { loadMemories } from "@/lib/memories";
import { staticPhotos } from "@/lib/static-photos";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration | Balal ba Bilong" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setHydrated(true);
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => { setSignedIn(!!session); void queryClient.invalidateQueries({ queryKey: ["is-admin"] }); });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: isAdmin, enabled: hydrated && signedIn });
  const people = useQuery({ queryKey: ["people"], queryFn: loadPeople, enabled: admin.data === true });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");

  async function login(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Connexion impossible. Vérifiez l’e-mail et le mot de passe.");
    setBusy(false);
  }

  async function analyze() {
    setBusy(true); setError(""); setProgress("Préparation…");
    try {
      const shared = await loadMemories();
      const { total, skipped } = await analyzeAllPhotos([...shared, ...staticPhotos].map((p) => ({ key: p.key, src: p.src })), (done, all, bad) => setProgress(`Analyse ${done}/${all}${bad ? ` (${bad} ignorée${bad > 1 ? "s" : ""})` : ""}…`));
      setProgress(total === 0 ? "Toutes les photos sont déjà analysées." : `Terminé : ${total - skipped}/${total} photo${total > 1 ? "s" : ""} analysée${total > 1 ? "s" : ""}.`);
      await queryClient.invalidateQueries({ queryKey: ["people"] });
    } catch { setError("L’analyse a échoué. Réessayez."); setProgress(""); }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl text-foreground">Administration</h1>
      <p className="mt-2 text-foreground/80"><Link to="/" className="underline underline-offset-4">← Retour au site</Link></p>

      {!signedIn && (
        <form onSubmit={login} className="mt-8 space-y-4">
          <div className="space-y-2"><Label htmlFor="admin-email">E-mail</Label><Input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="admin-password">Mot de passe</Label><Input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin motion-reduce:animate-none" />} Se connecter</Button>
        </form>
      )}

      {signedIn && admin.isPending && <p className="mt-8 text-muted-foreground">Vérification…</p>}
      {signedIn && admin.data === false && <p role="alert" className="mt-8 text-destructive">Ce compte n’est pas administrateur.</p>}

      {admin.data === true && (
        <div className="mt-8 space-y-6">
          <section className="space-y-3 rounded-md border border-border bg-card p-6">
            <h2 className="text-2xl">Albums par visage</h2>
            <p className="text-sm text-foreground/80">{people.data ? `${people.data.length} album${people.data.length > 1 ? "s" : ""}.` : "Chargement…"} Pour nommer ou supprimer un album, ouvrez-le dans l’onglet « Personnes » du site : les commandes d’administration y apparaissent.</p>
            <p className="text-sm text-foreground/80">Les nouvelles photos sont analysées à l’envoi. Lancez l’analyse pour les photos plus anciennes ou si un envoi n’a pas été analysé.</p>
            <Button onClick={analyze} disabled={busy}>{busy ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <ScanFace />} Analyser les photos existantes</Button>
            {progress && <p role="status" className="text-sm text-foreground">{progress}</p>}
          </section>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}><LogOut /> Se déconnecter</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </main>
  );
}
