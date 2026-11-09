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
      <header className="relative flex min-h-[92svh] items-end overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Photo de famille des participants du camp biblique Balal ba Bilong"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/55 to-foreground/10" />
        <div className="absolute left-6 top-6 z-10 rounded-xl bg-background px-4 py-3 shadow-soft">
          <img src={logoAsset.url} alt="Logo Mahol Ma Ndap" className="h-10 w-auto sm:h-12" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-14 pt-32 lg:flex-row lg:items-end lg:justify-between lg:pb-20">
          <div>
            <h1 className="text-background">
              <span className="block text-2xl font-semibold sm:text-3xl">Camp biblique</span>
              <span className="mt-2 block animate-in fade-in slide-in-from-bottom-6 fill-mode-backwards text-[clamp(3.25rem,14vw,9.5rem)] font-extrabold leading-[0.9] duration-700 motion-reduce:animate-none">
                Balal
              </span>
              <span className="block animate-in fade-in slide-in-from-bottom-6 fill-mode-backwards text-[clamp(3.25rem,14vw,9.5rem)] font-extrabold leading-[0.9] delay-150 duration-700 motion-reduce:animate-none">
                ba Bilong
              </span>
            </h1>
            <p className="mt-6 text-lg font-semibold text-accent">Organisé par Mahol Ma Ndap</p>
            <p className="mt-3 max-w-md text-lg text-background/90">
              « Venez à l'écart et reposez-vous un peu. » (Marc 6.31) Une semaine pour respirer,
              prier et grandir ensemble dans la Parole.
            </p>
          </div>

          <div className="w-full shrink-0 rounded-md rounded-tl-[2.5rem] bg-accent p-7 text-accent-foreground shadow-soft lg:w-80">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4" /> Prochaine édition
            </p>
            <p className="mt-2 font-display text-5xl font-extrabold leading-none tracking-tight">
              24–30 août
            </p>
            <p className="mt-3 flex items-center gap-2 font-medium">
              <MapPin className="size-4 shrink-0" /> Mbalmayo, quartier Obeck
            </p>
            <a
              href="#galerie"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Voir les souvenirs du camp
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="max-w-3xl text-4xl leading-[1.05] text-foreground sm:text-6xl">
          Un lieu de communion, de partage et d'édification
        </h2>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <div className="space-y-10">
            <article className="border-l-4 border-accent pl-6">
              <h3 className="text-2xl text-foreground">Ce que c'est</h3>
              <p className="mt-4 max-w-prose text-lg text-foreground/80">
                Balal ba Bilong est un rendez-vous annuel où enfants, jeunes et aînés se retrouvent
                hors du quotidien. Pendant une semaine, on vit ensemble : louange au lever du jour,
                enseignements, ateliers, jeux et veillées. Un esprit simple de communion, de
                partage et d'édification spirituelle.
              </p>
            </article>

            <article className="rounded-md rounded-tr-[3rem] bg-primary p-8 text-primary-foreground sm:p-10">
              <h3 className="text-2xl">Son rôle</h3>
              <p className="mt-4 max-w-prose text-primary-foreground/90">
                Le camp est un souffle pour la communauté : il accompagne spirituellement les
                participants, révèle des dons, forme de nouveaux serviteurs et resserre les liens
                entre familles et générations.
              </p>
              <p className="mt-4 max-w-prose text-primary-foreground/90">
                Chacun repart affermi, avec des amitiés nouvelles et une foi vivante à partager
                autour de lui.
              </p>
            </article>
          </div>

          <article className="self-start rounded-md rounded-bl-[3rem] border border-border bg-card p-8 shadow-soft">
            <h3 className="text-2xl text-foreground">Ses objectifs</h3>
            <ul className="mt-6 divide-y divide-border">
              {objectifs.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-medium text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <Gallery />

      <footer className="border-t-4 border-accent bg-foreground py-16 text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-3">
          <div>
            <img
              src={logoAsset.url}
              alt="Logo Mahol Ma Ndap"
              className="h-12 w-auto rounded-lg bg-background p-1.5"
            />
            <p className="mt-4 font-display text-2xl font-bold">Mahol Ma Ndap</p>
            <p className="mt-3 text-sm text-background/75">
              Organisateur du Camp Biblique Balal ba Bilong, au service de la jeunesse et de la
              communauté.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-accent">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-background/75">
              <li>
                <a
                  href="https://wa.me/237678672027"
                  className="flex items-center gap-2 underline-offset-4 hover:text-background hover:underline"
                >
                  <Phone className="size-4" /> +237 6 78 67 20 27 (WhatsApp)
                </a>
              </li>
              <li>
                <a
                  href="mailto:Maholmandap@gmail.com"
                  className="flex items-center gap-2 underline-offset-4 hover:text-background hover:underline"
                >
                  <Mail className="size-4" /> Maholmandap@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4" /> Mbalmayo, quartier Obeck
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-accent">Nous suivre</p>
            <div className="mt-3 flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="rounded-full border border-background/25 p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="rounded-full border border-background/25 p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Instagram className="size-4" />
              </a>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-6xl px-6 text-xs text-background/60">
          © {new Date().getFullYear()} Mahol Ma Ndap — Camp Biblique Balal ba Bilong.
        </p>
      </footer>
    </div>
  );
}
