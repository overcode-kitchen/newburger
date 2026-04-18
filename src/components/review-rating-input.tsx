"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReviewRatingInputProps {
  name: string;
  id?: string;
}

export function ReviewRatingInput({ name, id = "rating" }: ReviewRatingInputProps) {
  const [selected, setSelected] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);

  const active = hovered || selected;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">별점</legend>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="별점 선택">
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            className="cursor-pointer"
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
          >
            <input
              id={`${id}-${value}`}
              type="radio"
              name={name}
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="sr-only"
              required={value === 1}
            />
            <span
              className={cn(
                "text-2xl leading-none transition-colors",
                value <= active ? "text-foreground" : "text-muted-foreground/40",
              )}
              aria-hidden
            >
              ★
            </span>
            <span className="sr-only">{value}점</span>
          </label>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {selected > 0 ? `${selected}점` : "선택하세요"}
        </span>
      </div>
    </fieldset>
  );
}
