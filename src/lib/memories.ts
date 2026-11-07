import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const audioExtensions: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-m4a": "m4a" };
export const captionSchema = z.string().trim().max(200, "La légende doit contenir au maximum 200 caractères.").transform((value) => value || "Souvenir du camp");

export const detailsSchema = z.object({
  caption: captionSchema,
  date: z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date invalide.").optional().default(""),
  year: z.string().trim().regex(/^(\d{4})?$/, "L’année doit comporter 4 chiffres.").optional().default("")
    .refine((v) => !v || (Number(v) >= 1800 && Number(v) <= 2200), "Année invalide."),
  location: z.string().trim().max(200, "Le lieu doit contenir au maximum 200 caractères.").default(""),
  people: z.string().trim().max(500, "La liste des personnes doit contenir au maximum 500 caractères.").default(""),
  story: z.string().trim().max(5000, "L’anecdote doit contenir au maximum 5000 caractères.").default(""),
});
export type MemoryDetails = z.input<typeof detailsSchema>;

export const commentSchema = z.object({
  author: z.string().trim().max(80, "Le nom doit contenir au maximum 80 caractères.").transform((v) => v || "Un proche"),
  body: z.string().trim().min(1, "Écrivez un petit mot.").max(1000, "Le mot doit contenir au maximum 1000 caractères."),
});

export type Memory = {
  key: string; src: string; alt: string; edition?: string;
  takenOn?: string | null; year?: number | null; location?: string; people?: string; story?: string;
  audioUrl?: string | null; createdAt?: string;
};

export function validatePhoto(file: { type: string; size: number }) {
  if (!extensions[file.type]) throw new Error("Choisissez une photo JPG, PNG ou WebP.");
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) throw new Error("La photo doit peser entre 1 octet et 10 Mo.");
  return extensions[file.type];
}

export function validateAudio(file: { type: string; size: number }) {
  const base = file.type.split(";")[0] ?? "";
  const ext = audioExtensions[base];
  if (!ext) throw new Error("Format audio non pris en charge.");
  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) throw new Error("La note vocale doit peser au maximum 10 Mo.");
  return { ext, type: base };
}

/** Pick the same memory for everyone on a given day. */
export function memoryOfTheDay<T>(items: T[], day: Date): T | undefined {
  if (!items.length) return undefined;
  const n = Math.floor(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) / 86400000);
  return items[n % items.length];
}

export function yearsAgo(m: Pick<Memory, "takenOn" | "year">, now: Date) {
  const y = m.takenOn ? Number(m.takenOn.slice(0, 4)) : m.year;
  if (!y) return null;
  const diff = now.getFullYear() - y;
  return diff > 0 ? diff : null;
}

export async function loadMemories(): Promise<Memory[]> {
  const rows: { image_path: string; caption: string; taken_on: string | null; approximate_year: number | null; location: string; people: string; story: string; audio_path: string | null; created_at: string }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("camp_memories").select("image_path, caption, taken_on, approximate_year, location, people, story, audio_path, created_at").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) break;
  }
  if (!rows.length) return [];
  const { data, error } = await supabase.storage.from("camp-memories").createSignedUrls(rows.map((row) => row.image_path), 7200);
  if (error) throw error;
  const audioPaths = rows.flatMap((r) => (r.audio_path ? [r.audio_path] : []));
  const audio = new Map<string, string>();
  if (audioPaths.length) {
    const { data: a, error: ae } = await supabase.storage.from("camp-audio").createSignedUrls(audioPaths, 7200);
    if (ae) throw ae;
    a.forEach((x, i) => { const p = audioPaths[i]; if (x.signedUrl && p) audio.set(p, x.signedUrl); });
  }
  return rows.map((row, index) => {
    const url = data[index]?.signedUrl;
    if (!url) throw new Error("Une photo n’a pas pu être chargée.");
    return {
      key: row.image_path, src: url, alt: row.caption, edition: "Souvenir partagé",
      takenOn: row.taken_on, year: row.approximate_year, location: row.location, people: row.people, story: row.story,
      audioUrl: row.audio_path ? audio.get(row.audio_path) ?? null : null, createdAt: row.created_at,
    };
  });
}

export async function shareMemory(file: File, details: MemoryDetails, audio?: Blob | null): Promise<string> {
  const extension = validatePhoto(file);
  const parsed = detailsSchema.safeParse(details);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
  const d = parsed.data;
  if (d.date && d.year) throw new Error("Indiquez soit une date précise, soit une année.");
  let audioPath: string | null = null;
  if (audio) {
    const { ext, type } = validateAudio(audio);
    audioPath = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("camp-audio").upload(audioPath, audio, { contentType: type, upsert: false });
    if (error) throw new Error("L’envoi de la note vocale a échoué. Veuillez réessayer.");
  }
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("camp-memories").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("L’envoi de la photo a échoué. Veuillez réessayer.");
  const { error } = await supabase.from("camp_memories").insert({
    image_path: path, caption: d.caption, taken_on: d.date || null, approximate_year: d.year ? Number(d.year) : null,
    location: d.location, people: d.people, story: d.story, audio_path: audioPath,
  });
  if (error) throw new Error("La photo n’a pas pu être ajoutée à la galerie. Veuillez réessayer.");
  return path;
}

export type Comment = { id: string; author: string; body: string; created_at: string };

export async function loadInteractions(key: string) {
  const [c, r] = await Promise.all([
    supabase.from("memory_comments").select("id, author, body, created_at").eq("photo_key", key).order("created_at").limit(200),
    supabase.from("memory_reactions").select("kind").eq("photo_key", key).limit(10000),
  ]);
  if (c.error) throw c.error;
  if (r.error) throw r.error;
  const counts = { like: 0, heart: 0 };
  r.data.forEach((x) => { if (x.kind === "like" || x.kind === "heart") counts[x.kind]++; });
  return { comments: c.data as Comment[], counts };
}

export async function addComment(key: string, input: { author: string; body: string }) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
  const { error } = await supabase.from("memory_comments").insert({ photo_key: key, ...parsed.data });
  if (error) throw new Error("Votre mot n’a pas pu être envoyé.");
}

export async function addReaction(key: string, kind: "like" | "heart") {
  const { error } = await supabase.from("memory_reactions").insert({ photo_key: key, kind });
  if (error) throw new Error("Votre réaction n’a pas pu être enregistrée.");
}
