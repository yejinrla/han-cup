import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleCard } from "@/features/notes/ArticleCard";
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
            <ArticleCard note={note} index={index} />
          </li>
        ))}
      </ul>
    </main>
  );
}
