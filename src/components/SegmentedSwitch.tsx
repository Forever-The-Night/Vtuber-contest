"use client";

import { useState } from "react";

export function SegmentedSwitch({
  defaultValue,
  name,
  options,
}: {
  defaultValue: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  const defaultIndex = Math.max(0, options.findIndex((option) => option.value === defaultValue));
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <div className="segmented-slider" style={{ "--segments": options.length, "--active-index": activeIndex } as React.CSSProperties}>
      <span className="segmented-indicator" aria-hidden="true" />
      {options.map((option, index) => (
        <label key={option.value} className="segmented-slider-option">
          <input
            className="sr-only"
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={index === defaultIndex}
            onChange={() => setActiveIndex(index)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}