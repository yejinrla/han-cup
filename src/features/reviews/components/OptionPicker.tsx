"use client";
import { useState, type ChangeEvent } from "react";
import {
  exclusiveOptionGroups,
  maxReviewOptions,
  optionNutritionNote,
  reviewOptionLabels,
  reviewOptionSections,
  type ReviewOptionId,
} from "../options";
// Uncontrolled checkboxes named "options": the browser owns their state, so a
// form reset after saving returns them to their initial values together with
// the rest of the form. The server validates the same rules without JS.
export function OptionPicker({
  initial = [],
}: {
  initial?: readonly string[];
}) {
  const [message, setMessage] = useState("");
  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setMessage("");
    const box = event.currentTarget;
    if (!box.checked || !box.form) return;
    const boxes = [
      ...box.form.querySelectorAll<HTMLInputElement>('input[name="options"]'),
    ];
    // Picking an option clears the opposite one in its group.
    const group = exclusiveOptionGroups.find((g) =>
      g.includes(box.value as ReviewOptionId),
    );
    for (const other of boxes)
      if (other !== box && group?.includes(other.value as ReviewOptionId))
        other.checked = false;
    if (boxes.filter((b) => b.checked).length > maxReviewOptions) {
      box.checked = false;
      setMessage(`옵션은 ${maxReviewOptions}개까지 고를 수 있어요.`);
    }
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
                  defaultChecked={initial.includes(id)}
                  onChange={onChange}
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
