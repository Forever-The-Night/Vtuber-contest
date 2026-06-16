"use client";

import { AlertTriangle, X } from "lucide-react";

export function ActionErrorDialog({ error, onClose }: { error?: string; onClose: () => void }) {
  if (!error) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#17130f]/55 p-4 backdrop-blur-md" role="alertdialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal-surface grid w-full max-w-md gap-4 rounded-lg bg-[#fffaf2] p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-red-100 text-red-800"><AlertTriangle size={20} /></span>
            <div>
              <p className="text-sm font-black text-red-800">操作没有完成</p>
              <h2 className="text-xl font-black text-[#17130f]">请检查后重试</h2>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="关闭提示"><X size={18} /></button>
        </div>
        <p className="rounded-lg bg-red-50 p-4 font-bold leading-7 text-red-800">{error}</p>
        <button className="button w-fit justify-self-end" type="button" onClick={onClose}>知道了</button>
      </div>
    </div>
  );
}
