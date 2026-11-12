import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";
import { CupArt } from "@/components/CupArt";
import { tasteNotes } from "./content";
export function TasteNoteBanner() {
  const note = tasteNotes[0];
  return (
    <Link href={"/notes/" + note.slug} className="taste-note-banner">
      <div className="taste-note-banner-copy">
        <span className="taste-note-kicker">
          <Leaf size={12} aria-hidden="true" /> 한컵의 취향 노트
        </span>
        <h2>{note.title}</h2>
        <p>{note.bannerDescription}</p>
        <span className="taste-note-read">
          추천 글 읽기 <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
      <span className="taste-note-banner-art" aria-hidden="true">
        <CupArt name="차 한 잔" kind="tea" />
      </span>
    </Link>
  );
}
