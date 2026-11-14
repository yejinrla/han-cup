import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CupArt } from "@/components/CupArt";
import type { TasteNote } from "./content";

export function ArticleCard({
  note,
  index,
}: {
  note: TasteNote;
  index: number;
}) {
  return (
    <Link href={`/notes/${note.slug}`} className="magazine-card">
      <span
        className={`magazine-thumbnail taste-note-tone-${index % 3}`}
        aria-hidden="true"
      >
        <CupArt name="음료 한 잔" kind={note.illustrationKind} />
      </span>
      <div className="magazine-card-copy">
        <h2>{note.title}</h2>
        <p>{note.summary}</p>
        <span className="magazine-card-read">
          글 읽기 <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
