"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { CupArt } from "@/components/CupArt";
import { tasteNotes } from "./content";

export function TasteNoteBanner() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  function move(index: number) {
    const el = track.current;
    if (!el) return;
    const target = el.children[
      Math.max(0, Math.min(tasteNotes.length - 1, index))
    ] as HTMLElement;
    el.scrollTo({
      left: target.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  function syncPosition() {
    const el = track.current;
    if (!el) return;
    let closest = 0,
      distance = Infinity;
    Array.from(el.children).forEach((child, index) => {
      const gap = Math.abs((child as HTMLElement).offsetLeft - el.scrollLeft);
      if (gap < distance) {
        distance = gap;
        closest = index;
      }
    });
    setActive(closest);
  }
  return (
    <section
      className="taste-note-carousel"
      aria-label="한컵의 취향 노트"
      aria-roledescription="carousel"
    >
      <div className="taste-note-track" ref={track} onScroll={syncPosition}>
        {tasteNotes.map((note, index) => (
          <Link
            key={note.slug}
            href={"/notes/" + note.slug}
            className={`taste-note-banner taste-note-tone-${index % 3}`}
          >
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
              <CupArt name="음료 한 잔" kind={note.illustrationKind} />
            </span>
          </Link>
        ))}
      </div>
      <div className="taste-note-carousel-controls">
        <span
          className="taste-note-position"
          aria-live="polite"
          aria-atomic="true"
        >
          {active + 1} / {tasteNotes.length}
        </span>
        <div className="taste-note-dots">
          {tasteNotes.map((note, index) => (
            <button
              type="button"
              key={note.slug}
              aria-label={`추천 글 ${index + 1} 보기`}
              aria-pressed={index === active}
              onClick={() => move(index)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="taste-note-arrows">
          <button
            type="button"
            aria-label="이전 추천 글"
            disabled={active === 0}
            onClick={() => move(active - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="다음 추천 글"
            disabled={active === tasteNotes.length - 1}
            onClick={() => move(active + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
