import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { journalHref, monthDays, shiftMonth } from "../calendar";

export function JournalCalendar({
  selectedDate,
  today,
  recordDates,
}: {
  selectedDate: string;
  today: string;
  recordDates: string[];
}) {
  const recorded = new Set(recordDates);
  const [year, month] = selectedDate.split("-").map(Number);
  return (
    <section className="panel journal-calendar" aria-label="마신 기록 달력">
      <div className="journal-calendar-toolbar">
        <h2>
          {year}년 {month}월
        </h2>
        <div className="journal-month-controls">
          <Link
            className="journal-today-button"
            href={journalHref(today)}
            scroll={false}
            prefetch={false}
          >
            오늘
          </Link>
          <Link
            className="journal-month-button"
            href={journalHref(shiftMonth(selectedDate, -1))}
            aria-label="이전 달"
            scroll={false}
            prefetch={false}
          >
            <ChevronLeft size={20} />
          </Link>
          <Link
            className="journal-month-button"
            href={journalHref(shiftMonth(selectedDate, 1))}
            aria-label="다음 달"
            scroll={false}
            prefetch={false}
          >
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
      <div className="journal-weekdays" aria-hidden="true">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="journal-days">
        {monthDays(selectedDate).map((date, i) => {
          if (!date) return <span key={"blank-" + i} aria-hidden="true" />;
          const selected = date === selectedDate;
          const isToday = date === today;
          const hasRecord = recorded.has(date);
          const label = `${year}년 ${month}월 ${Number(date.slice(8))}일${isToday ? ", 오늘" : ""}${selected ? ", 선택됨" : ""}${hasRecord ? ", 기록 있음" : ""}`;
          return (
            <Link
              key={date}
              href={journalHref(date)}
              scroll={false}
              prefetch={false}
              className={`journal-day${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
              aria-label={label}
              aria-current={isToday ? "date" : undefined}
            >
              <span>{Number(date.slice(8))}</span>
              <span
                className={`journal-record-dot${hasRecord ? " has-record" : ""}`}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
      <p className="journal-calendar-legend">
        <span className="journal-record-dot has-record" aria-hidden="true" />
        기록이 있는 날 · 날짜를 눌러 한 잔의 기억을 확인하세요.
      </p>
    </section>
  );
}
