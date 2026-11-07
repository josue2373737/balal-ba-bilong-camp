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
