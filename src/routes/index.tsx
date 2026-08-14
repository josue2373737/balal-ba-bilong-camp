import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  HeartHandshake,
  Users,
  Sparkles,
  MapPin,
  CalendarDays,
  Mail,
  Phone,
  Facebook,
  Instagram,
} from "lucide-react";

import { Gallery } from "@/components/Gallery";
import heroAsset from "@/assets/famille.jpg.asset.json";
import logoAsset from "@/assets/logo.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Camp Biblique Balal ba Bilong | Mahol Ma Ndap" },
      {
        name: "description",
        content:
          "Camp Biblique Balal ba Bilong organisé par Mahol Ma Ndap — Mbalmayo, quartier Obeck, du 24 au 30 août. Communion, prière et édification spirituelle.",
      },
      { property: "og:title", content: "Camp Biblique Balal ba Bilong | Mahol Ma Ndap" },
      {
        property: "og:description",
        content:
          "Une semaine de communion, de prière et d'étude de la Bible à Mbalmayo, du 24 au 30 août.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const objectifs = [
  { icon: BookOpen, text: "Approfondir la foi par l'étude de la Bible" },
  { icon: Users, text: "Créer des liens fraternels durables" },
  { icon: Sparkles, text: "Former et affermir la jeunesse" },
  { icon: HeartHandshake, text: "Vivre des temps de prière et d'intercession" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="relative flex min-h-[92vh] items-end overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Photo de famille des participants du camp biblique Balal ba Bilong"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/92 via-foreground/60 to-foreground/35" />
        <div className="absolute left-6 top-6 z-10 rounded-2xl bg-background/95 px-4 py-3 shadow-soft backdrop-blur">
          <img src={logoAsset.url} alt="Logo Mahol Ma Ndap" className="h-10 w-auto sm:h-12" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-32">
          <p className="font-display text-sm uppercase tracking-[0.35em] text-background/80">
            Organisé par Mahol Ma Ndap
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.05] text-background sm:text-7xl">
            Camp Biblique
            <span className="block italic text-background/90">Balal ba Bilong</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-background/85">
            « Venez à l'écart et reposez-vous un peu. » Une semaine pour respirer, prier et grandir
            ensemble dans la Parole.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-background/25 bg-background/10 px-5 py-2.5 text-sm text-background backdrop-blur">
              <CalendarDays className="size-4" /> Du 24 au 30 août
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-background/25 bg-background/10 px-5 py-2.5 text-sm text-background backdrop-blur">
              <MapPin className="size-4" /> Mbalmayo, quartier Obeck
            </span>
            <a
              href="#galerie"
              className="inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Découvrir le camp
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-accent">À propos</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl text-foreground sm:text-5xl">
          Un lieu de communion, de partage et d'édification
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h3 className="font-display text-2xl text-foreground">Ce que c'est</h3>
            <p className="mt-4 text-muted-foreground">
              Balal ba Bilong est un rendez-vous annuel où enfants, jeunes et aînés se retrouvent
              hors du quotidien. Pendant une semaine, on vit ensemble : louange au lever du jour,
              enseignements, ateliers, jeux et veillées. Un esprit simple de communion, de partage
              et d'édification spirituelle.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h3 className="font-display text-2xl text-foreground">Ses objectifs</h3>
            <ul className="mt-5 space-y-4">
              {objectifs.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border bg-primary p-8 text-primary-foreground shadow-soft">
            <h3 className="font-display text-2xl">Son rôle</h3>
            <p className="mt-4 text-primary-foreground/85">
              Le camp est un souffle pour la communauté : il accompagne spirituellement les
              participants, révèle des dons, forme de nouveaux serviteurs et resserre les liens
              entre familles et générations.
            </p>
            <p className="mt-4 text-primary-foreground/85">
              Chacun repart affermi, avec des amitiés nouvelles et une foi vivante à partager autour
              de lui.
            </p>
          </article>
        </div>
      </section>

      <Gallery />

      <footer className="bg-foreground py-16 text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-3">
          <div>
            <img
              src={logoAsset.url}
              alt="Logo Mahol Ma Ndap"
              className="h-12 w-auto rounded-lg bg-background p-1.5"
            />
            <p className="mt-4 font-display text-2xl">Mahol Ma Ndap</p>
            <p className="mt-3 text-sm text-background/70">
              Organisateur du Camp Biblique Balal ba Bilong, au service de la jeunesse et de la
              communauté.
            </p>
          </div>
          <div>
            <p className="font-display text-lg">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="size-4" /> +237 6 XX XX XX XX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4" /> contact@maholmandap.org
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4" /> Mbalmayo, quartier Obeck
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-lg">Nous suivre</p>
            <div className="mt-3 flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="rounded-full border border-background/20 p-3 transition-colors hover:bg-background/10"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="rounded-full border border-background/20 p-3 transition-colors hover:bg-background/10"
              >
                <Instagram className="size-4" />
              </a>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl px-6 text-xs text-background/50">
          © {new Date().getFullYear()} Mahol Ma Ndap — Camp Biblique Balal ba Bilong.
        </p>
      </footer>
    </div>
  );
}
