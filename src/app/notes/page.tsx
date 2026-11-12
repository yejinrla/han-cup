import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CupArt } from "@/components/CupArt";
import { tasteNotes } from "@/features/notes/content";

export const metadata: Metadata = {
  title: "한컵 매거진",
  description: "취향에 맞는 한 잔을 찾는 이야기",
};

export default function MagazinePage() {
  return (
    <main id="main" className="page-wrap magazine-page">
      <Link href="/" className="taste-note-back">
        <ArrowLeft size={15} aria-hidden="true" /> 홈으로
      </Link>
      <header className="taste-note-title magazine-title">
        <p className="eyebrow">HANCUP MAGAZINE</p>
        <h1>한컵 매거진</h1>
        <p className="taste-note-summary">취향에 맞는 한 잔을 찾는 이야기</p>
      </header>
      <ul className="magazine-list" aria-label="매거진 글 목록">
        {tasteNotes.map((note, index) => (
          <li key={note.slug}>
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
          </li>
        ))}
      </ul>
    </main>
  );
}
