"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";

export function ImageDropInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function setFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !inputRef.current) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    setFileName(file.name);
  }

  return (
    <label
      className={`grid min-h-44 cursor-pointer place-items-center rounded-lg border-2 border-dashed p-5 text-center transition ${
        isDragging ? "border-[#00a6a6] bg-[#e4fbf4]" : "border-black/15 bg-white/70 hover:bg-white"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        setFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        className="sr-only"
        name="image"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        required
        onChange={(event) => setFiles(event.currentTarget.files)}
      />
      <span className="grid gap-3 justify-items-center text-sm font-black text-[#6d6258]">
        <span className="grid size-12 place-items-center rounded-md bg-[#ff5b2e] text-white"><ImageUp size={22} /></span>
        {fileName ? `已选择：${fileName}` : "拖动图片到这里，或点击选择源文件"}
      </span>
    </label>
  );
}