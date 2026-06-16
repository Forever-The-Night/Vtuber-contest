"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function RankingImagePreview({
  buttonClassName = "block w-full",
  imageClassName,
  imageUrl,
  title,
}: {
  buttonClassName?: string;
  imageClassName: string;
  imageUrl: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={`preview-trigger overflow-hidden ${buttonClassName}`} type="button" onClick={() => setOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className={imageClassName} loading="lazy" />
      </button>
      {open ? (
        <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#17130f]/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onMouseDown={() => setOpen(false)}>
          <div className="modal-surface grid max-h-[92dvh] w-full max-w-6xl overflow-hidden rounded-lg bg-[#fffaf2] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-black/10 p-4">
              <h2 className="text-lg font-black text-[#17130f]">{title}</h2>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} title="关闭预览">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto bg-[#201a16]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={title} className="mx-auto max-h-[78dvh] w-auto max-w-full object-contain sm:max-h-[84dvh]" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}