"use client";
import { useState } from "react";
import {
  exclusiveOptionGroups,
  maxReviewOptions,
  optionNutritionNote,
  reviewOptionLabels,
  reviewOptionSections,
  type ReviewOptionId,
} from "../options";
// Real checkboxes named "options"; the server validates the same rules, so
// the form still works without JavaScript.
export function OptionPicker({
  initial = [],
}: {
  initial?: readonly string[];
}) {
  const [selected, setSelected] = useState<string[]>([...initial]);
  const [message, setMessage] = useState("");
  function toggle(id: ReviewOptionId, checked: boolean) {
    setMessage("");
    if (!checked) {
      setSelected((s) => s.filter((x) => x !== id));
      return;
    }
    // Picking an option clears the opposite one in its group.
    const opposites =
      exclusiveOptionGroups
        .find((g) => g.includes(id))
        ?.filter((x) => x !== id) ?? [];
    const next = [
      ...selected.filter((x) => !opposites.includes(x as ReviewOptionId)),
      id,
    ];
    if (next.length > maxReviewOptions) {
      setMessage(`옵션은 ${maxReviewOptions}개까지 고를 수 있어요.`);
      return;
    }
    setSelected(next);
  }
  return (
    <fieldset className="option-picker">
      <legend>
        커스텀 옵션{" "}
        <span className="muted">선택 · 최대 {maxReviewOptions}개</span>
      </legend>
      {reviewOptionSections.map((section) => (
        <div className="option-section" key={section.title}>
          <span className="option-section-title">{section.title}</span>
          <div className="option-section-items">
            {section.ids.map((id) => (
              <label className="option-chip" key={id}>
                <input
                  type="checkbox"
                  name="options"
                  value={id}
                  checked={selected.includes(id)}
                  onChange={(e) => toggle(id, e.target.checked)}
                />
                <span>{reviewOptionLabels[id]}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <p className="muted">
        {optionNutritionNote} 세부 내용(예: 바닐라 시럽 1펌프)은 메모에 적어
        주세요.
      </p>
      <div role="status" aria-live="polite">
        {message && <p className="inline-error">{message}</p>}
      </div>
    </fieldset>
  );
}
