import type { Memory } from "@/lib/memories";
import p1 from "@/assets/p1.jpg.asset.json";
import p2 from "@/assets/p2.jpg.asset.json";
import p3 from "@/assets/p3.jpg.asset.json";
import p4 from "@/assets/p4.jpg.asset.json";
import p5 from "@/assets/p5.jpg.asset.json";
import p6 from "@/assets/p6.jpg.asset.json";
import p7 from "@/assets/p7.jpg.asset.json";
import p8 from "@/assets/p8.jpg.asset.json";
import famille from "@/assets/famille.jpg.asset.json";

export const staticPhotos: Memory[] = [
  { key: "famille", src: famille.url, alt: "Photo de famille de la 6e édition du camp biblique" },
  { key: "p1", src: p1.url, alt: "Remise de certificat à Grâce par papa Jean Paul et papa Tonton" },
  { key: "p8", src: p8.url, alt: "Photo de Mo’o, mama Adèle et mama Dalhem" },
  { key: "p4", src: p4.url, alt: "Photo de Jean Jacques, Nathan, Yohan, Anaël, Gedeon et Polycarpe" },
  { key: "p7", src: p7.url, alt: "Photo de Nyango, Manunu et Vive" },
  { key: "p3", src: p3.url, alt: "Remise de cadeau à Freddy" },
  { key: "p5", src: p5.url, alt: "Mama Adèle en plein sport" },
  { key: "p6", src: p6.url, alt: "Papa Tonton, papa Parfils et papa Papy" },
  { key: "p2", src: p2.url, alt: "Le petit Moïse" },
];
