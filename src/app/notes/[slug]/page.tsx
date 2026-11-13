import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Leaf } from "lucide-react";
import {
  tasteNotes,
  resolveNoteRecommendations,
} from "@/features/notes/content";
import { getCatalog } from "@/features/catalog/repository";
import { getSummaries } from "@/features/reviews/repository";
import { getFavoriteIds } from "@/features/favorites/repository";
import { DrinkCard } from "@/features/catalog/components/DrinkCard";
import { getArticleFavorites } from "@/features/favorites/articles";
import { ArticleFavoriteButton } from "@/features/favorites/components/ArticleFavoriteButton";
import { CupArt } from "@/components/CupArt";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = tasteNotes.find((note) => note.slug === slug);
  return {
    title: note?.title ?? "취향 노트를 찾을 수 없어요",
    description: note?.summary,
  };
}
export default async function TasteNotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = tasteNotes.find((note) => note.slug === slug);
  if (!note) notFound();
  const [catalog, summaries, favorites, articleFavorites] = await Promise.all([
    getCatalog(),
    getSummaries(),
    getFavoriteIds(),
    getArticleFavorites(),
  ]);
  const picks = resolveNoteRecommendations(note, catalog);
  return (
    <main id="main" className="page-wrap taste-note-page">
      <Link href="/" className="taste-note-back">
        <ArrowLeft size={15} aria-hidden="true" /> 홈으로
      </Link>
      <Link href="/notes" className="taste-note-back magazine-return">
        <ArrowLeft size={15} aria-hidden="true" /> 매거진 전체 보기
      </Link>
      <article>
        <header className="taste-note-title">
          <p className="taste-note-kicker">
            <Leaf size={13} aria-hidden="true" /> 한컵의 취향 노트
          </p>
          <h1>{note.title}</h1>
          <p className="taste-note-summary">{note.summary}</p>
          <ArticleFavoriteButton
            slug={note.slug}
            initial={articleFavorites.slugs.includes(note.slug)}
            available={articleFavorites.available}
          />
        </header>
        <div className="taste-note-cover" aria-hidden="true">
          <span>
            {note.coverLines[0]}
            <br />
            {note.coverLines[1]}
          </span>
          <CupArt name="음료 한 잔" kind={note.illustrationKind} />
        </div>
        <div className="taste-note-prose">
          {note.paragraphs.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
        <section
          className="taste-note-picks"
          aria-labelledby="note-picks-title"
        >
          <p className="eyebrow">HANCUP PICKS</p>
          <h2 id="note-picks-title">이런 한 잔은 어때요?</h2>
          {picks.map(({ pick, item }, index) => (
            <section className="taste-note-pick" key={item.id}>
              <h3>{pick.heading}</h3>
              <p>{pick.body}</p>
              <DrinkCard
                item={{ ...item, rating: summaries[item.id] ?? item.rating }}
                index={index}
                basis="serving"
                isFavorite={favorites.includes(item.id)}
              />
            </section>
          ))}
          {picks.length < note.recommendations.length && (
            <p className="status-box">
              일부 추천 음료는 정보를 확인하고 있어요. 준비된 음료부터
              소개합니다.
            </p>
          )}
        </section>
        <p className="taste-note-footnote">
          음료 정보와 판매 여부는 브랜드·매장 사정에 따라 달라질 수 있어요.
          취향에 맞는 다른 음료도 검색에서 찾아보세요.
        </p>
        <Link
          href={"/search?category=" + note.searchCategory}
          className="primary-button"
        >
          다른 {note.searchCategory === "tea" ? "차" : "커피"} 메뉴 둘러보기
        </Link>
      </article>
    </main>
  );
}
