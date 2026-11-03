import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const captionSchema = z.string().trim().max(200, "La légende doit contenir au maximum 200 caractères.").transform((value) => value || "Souvenir du camp");

export function validatePhoto(file: { type: string; size: number }) {
  if (!extensions[file.type]) throw new Error("Choisissez une photo JPG, PNG ou WebP.");
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) throw new Error("La photo doit peser entre 1 octet et 10 Mo.");
  return extensions[file.type];
}

export async function loadMemories() {
  const rows: { image_path: string; caption: string }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("camp_memories").select("image_path, caption").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) break;
  }
  if (!rows.length) return [];
  const { data, error } = await supabase.storage.from("camp-memories").createSignedUrls(rows.map((row) => row.image_path), 7200);
  if (error) throw error;
  return rows.map((row, index) => {
    const url = data[index]?.signedUrl;
    if (!url) throw new Error("Une photo n’a pas pu être chargée.");
    return { src: url, alt: row.caption, edition: "Souvenir partagé" };
  });
}

export async function shareMemory(file: File, caption: string) {
  const extension = validatePhoto(file);
  const validatedCaption = captionSchema.parse(caption);
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("camp-memories").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("L’envoi de la photo a échoué. Veuillez réessayer.");
  const { error } = await supabase.from("camp_memories").insert({ image_path: path, caption: validatedCaption });
  if (error) throw new Error("La photo n’a pas pu être ajoutée à la galerie. Veuillez réessayer.");
}