"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function VtuberTagInput({
  initialValues = [],
  inputName = "vtuberName",
  options,
  required = false,
}: {
  initialValues?: string[];
  inputName?: string;
  options: string[];
  required?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [values, setValues] = useState(initialValues.filter(Boolean));
  const listId = `${inputName}-options-${options.length}`;

  function addValue() {
    const next = draft.trim();
    if (!next || values.includes(next)) return;
    setValues([...values, next]);
    setDraft("");
  }

  return (
    <div className="grid gap-2">
      <div className="vtuber-tag-compose flex gap-2">
        <input
          className="input"
          list={listId}
          placeholder="选择或输入官方完整名字"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
        />
        <button className="button vtuber-tag-add shrink-0" type="button" onClick={addValue} title="加入标签">
          <Plus size={16} /> 加入
        </button>
      </div>
      <datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist>
      <div className="flex min-h-10 flex-wrap gap-2 rounded-lg border border-black/10 bg-white/70 p-2">
        {values.map((value) => (
          <span key={value} className="tag-pill inline-flex items-center gap-2 rounded-md bg-[#e4fbf4] px-3 py-1 text-sm font-black text-[#006b64]">
            {value}
            <button type="button" onClick={() => setValues(values.filter((item) => item !== value))} title="移除">
              <X size={14} />
            </button>
            <input type="hidden" name={inputName} value={value} />
          </span>
        ))}
        {values.length === 0 ? <span className="text-sm font-bold text-[#6d6258]">尚未选择</span> : null}
      </div>
      {required && values.length === 0 ? <input className="sr-only" required value="" onChange={() => undefined} /> : null}
    </div>
  );
}