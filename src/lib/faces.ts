import { supabase } from "@/integrations/supabase/client";
import { squareBox, type FaceBox } from "@/lib/face-geometry";

export type DetectedFace = { descriptor: number[]; box: FaceBox };
export type Person = { id: string; name: string | null; photoCount: number; coverKey: string | null; coverBox: FaceBox | null };

type FaceApi = typeof import("@vladmandic/face-api");
let loading: Promise<FaceApi> | null = null;

/** Charge la bibliothèque et les modèles (~6,5 Mo, mis en cache par le navigateur) uniquement quand on en a besoin. */
export function loadFaceApi(): Promise<FaceApi> {
  if (!loading) {
    loading = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await (faceapi.tf as unknown as { ready: () => Promise<void> }).ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      return faceapi;
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

/** Charge une image (Blob ou URL) dans un canvas réduit à `maxSide` pixels, orientation EXIF respectée. */
export async function imageToCanvas(source: Blob | string, maxSide = 1280): Promise<HTMLCanvasElement> {
  const blob = typeof source === "string" ? await (await fetch(source, { mode: "cors" })).blob() : source;
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

const MIN_FACE_PX = 48;

export async function detectFaces(input: HTMLCanvasElement | HTMLVideoElement): Promise<DetectedFace[]> {
  const faceapi = await loadFaceApi();
  const W = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
  const H = input instanceof HTMLVideoElement ? input.videoHeight : input.height;
  const results = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.45 }))
    .withFaceLandmarks(true)
    .withFaceDescriptors();
  return results
    .filter((r) => r.detection.box.width >= MIN_FACE_PX)
    .map((r) => ({ descriptor: Array.from(r.descriptor, (v) => Math.round(v * 10000) / 10000), box: squareBox(r.detection.box, W, H) }));
}

const facesPayload = (faces: DetectedFace[]) => faces.map((f) => ({ d: f.descriptor, x: f.box.x, y: f.box.y, w: f.box.w, h: f.box.h }));

export async function submitPhotoFaces(key: string, faces: DetectedFace[]) {
  const { error } = await supabase.rpc("submit_photo_faces", { p_key: key, p_faces: facesPayload(faces) });
  if (error) throw error;
}

/** Analyse en arrière-plan une photo qui vient d'être partagée. Les erreurs sont sans conséquence : l'admin peut relancer l'analyse. */
export async function analyzeUploadedPhoto(file: Blob, key: string) {
  const faces = await detectFaces(await imageToCanvas(file));
  await submitPhotoFaces(key, faces);
}

const MINE = "bbc-my-album";
export type MyAlbum = { id: string; token: string | null };
export function getMyAlbum(): MyAlbum | null {
  try { const v = JSON.parse(localStorage.getItem(MINE) ?? "null"); return v && typeof v.id === "string" ? v : null; } catch { return null; }
}
function saveMyAlbum(v: MyAlbum | null) {
  try { if (v) localStorage.setItem(MINE, JSON.stringify(v)); else localStorage.removeItem(MINE); } catch { /* stockage indisponible */ }
}

export async function enrollPerson(samples: number[][]): Promise<{ id: string; existing: boolean }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const { data, error } = await supabase.rpc("enroll_person", { p_samples: samples, p_token: token });
  const row = data?.[0];
  if (error || !row) throw new Error("L’album n’a pas pu être créé. Veuillez réessayer.");
  if (!row.existing) saveMyAlbum({ id: row.person_id, token });
  else if (!getMyAlbum()) saveMyAlbum({ id: row.person_id, token: null });
  return { id: row.person_id, existing: row.existing };
}

export async function loadPeople(): Promise<Person[]> {
  const { data, error } = await supabase.rpc("list_people");
  if (error) throw error;
  return data.map((r) => ({
    id: r.id, name: r.name, photoCount: r.photo_count, coverKey: r.cover_key,
    coverBox: r.cover_key && r.cover_x !== null && r.cover_y !== null && r.cover_w !== null && r.cover_h !== null ? { x: r.cover_x, y: r.cover_y, w: r.cover_w, h: r.cover_h } : null,
  }));
}

export async function loadPersonKeys(id: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("person_photo_keys", { p_id: id });
  if (error) throw error;
  return data;
}

export async function deleteMyAlbum(id: string, token: string | null) {
  const { data, error } = await supabase.rpc("delete_person", { p_id: id, ...(token ? { p_token: token } : {}) });
  if (error || !data) throw new Error("L’album n’a pas pu être supprimé.");
  if (getMyAlbum()?.id === id) saveMyAlbum(null);
}

export async function isAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc("is_admin");
  return data === true;
}
export async function renamePerson(id: string, name: string) {
  const { error } = await supabase.rpc("rename_person", { p_id: id, p_name: name });
  if (error) throw new Error("Le nom n’a pas pu être enregistré.");
}

/** Admin : analyse toutes les photos pas encore traitées. Les photos inaccessibles (CORS) sont ignorées. */
export async function analyzeAllPhotos(photos: { key: string; src: string }[], onProgress: (done: number, total: number, skipped: number) => void) {
  const { data, error } = await supabase.rpc("admin_unanalyzed", { p_keys: photos.map((p) => p.key) });
  if (error) throw error;
  const todo = photos.filter((p) => data.includes(p.key));
  let skipped = 0;
  for (let i = 0; i < todo.length; i++) {
    try { await submitPhotoFaces(todo[i]!.key, await detectFaces(await imageToCanvas(todo[i]!.src))); }
    catch { skipped++; }
    onProgress(i + 1, todo.length, skipped);
  }
  return { total: todo.length, skipped };
}
