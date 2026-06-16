"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Track } from "@prisma/client";
import { ImageUp } from "lucide-react";
import { uploadSubmissionWithResult } from "@/app/actions";
import { ActionErrorDialog } from "@/components/ActionErrorDialog";
import { SegmentedSwitch } from "@/components/SegmentedSwitch";
import { VtuberTagInput } from "@/components/VtuberTagInput";
import { initialActionResult } from "@/lib/actions/result";

export function SubmissionUploadForm({
  contestId,
  contestTitle,
  currentCount,
  vtuberNames,
}: {
  contestId: string;
  contestTitle: string;
  currentCount: number;
  vtuberNames: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [compressionNotice, setCompressionNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [state, formAction] = useActionState(uploadSubmissionWithResult, initialActionResult);
  const [dismissedErrorId, setDismissedErrorId] = useState<number>();
  const visibleError = state.error && state.errorId !== dismissedErrorId ? state.error : undefined;

  async function compressImageIfNeeded(file: File) {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    const bitmap = await createImageBitmap(file).catch(() => undefined);
    if (!bitmap) return file;
    const maxSide = 2400;
    const maxPixels = 5_760_000;
    const pixels = bitmap.width * bitmap.height;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height), Math.sqrt(maxPixels / pixels));
    if (scale >= 1 && file.size <= 10 * 1024 * 1024) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.88));
    if (!blob || blob.size >= file.size) return file;
    const extension = blob.type === "image/png" ? ".png" : ".jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, extension), { type: blob.type });
  }

  const setFiles = useCallback(async (files: FileList | null) => {
    const originalFile = files?.[0];
    if (!originalFile || !inputRef.current) return;
    const file = await compressImageIfNeeded(originalFile);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    setFileName(file.name);
    setCompressionNotice(file !== originalFile ? "已在上传前自动压缩。压缩会移除图片内嵌元数据，如识别为空请手动补全。" : "");
    setPreviewUrl(URL.createObjectURL(file));
    window.setTimeout(() => titleRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    function onDragOver(event: DragEvent) {
      event.preventDefault();
      setIsDragging(true);
    }
    function onDragLeave(event: DragEvent) {
      if (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight) {
        setIsDragging(false);
      }
    }
    function onDrop(event: DragEvent) {
      event.preventDefault();
      setIsDragging(false);
      void setFiles(event.dataTransfer?.files ?? null);
    }

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [setFiles]);

  return (
    <form action={formAction} className="panel grid gap-5 p-5">
      <ActionErrorDialog error={visibleError} onClose={() => setDismissedErrorId(state.errorId)} />
      <input type="hidden" name="contestId" value={contestId} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">上传到 {contestTitle}</h2>
          <p className="text-sm font-bold text-[#6d6258]">本届已投稿 {currentCount}/10 张。拖动图片到页面任意位置即可开始。</p>
        </div>
        <SegmentedSwitch
          defaultValue={Track.SFW}
          name="track"
          options={[
            { label: "SFW 赛道", value: Track.SFW },
            { label: "NSFW 禁赛道", value: Track.NSFW },
          ]}
        />
      </div>

      <label
        className={`upload-dropzone grid min-h-56 cursor-pointer place-items-center rounded-lg border-2 border-dashed p-6 text-center ${
          isDragging ? "border-[#00a6a6] bg-[#e4fbf4]" : "border-black/15 bg-white/70 hover:bg-white"
        } ${isDragging ? "is-dragging" : ""}`}
      >
        <input
          ref={inputRef}
          className="sr-only"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          onChange={(event) => void setFiles(event.currentTarget.files)}
        />
        <span className="grid gap-3 justify-items-center text-sm font-black text-[#6d6258]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="投稿预览" className="h-40 max-w-full rounded-lg border border-black/10 bg-white object-contain shadow-sm" />
          ) : (
            <span className="grid size-14 place-items-center rounded-md bg-[#ff5b2e] text-white"><ImageUp size={26} /></span>
          )}
          {fileName ? `已选择：${fileName}` : "拖动图片到这里，或点击选择源文件"}
          {compressionNotice ? <span className="max-w-md text-xs font-bold text-[#b97900]">{compressionNotice}</span> : null}
        </span>
      </label>

      {fileName ? (
        <div className="soft-enter grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field">标题<input ref={titleRef} className="input" name="title" required /></label>
            <label className="field">虚拟主播官方完整名字，可多选
              <VtuberTagInput options={vtuberNames} required />
            </label>
            <label className="field">使用工具<input className="input" name="toolName" placeholder="自动识别，可手动覆盖" /></label>
            <label className="field">模型<input className="input" name="modelName" placeholder="自动识别，可手动覆盖" /></label>
            <label className="field">Seed<input className="input" name="seed" placeholder="自动识别，可手动覆盖" /></label>
          </div>
          <label className="field">作品说明<textarea className="input min-h-24" name="description" /></label>
          <label className="field">Prompt<textarea className="input min-h-28" name="prompt" placeholder="自动识别，可手动覆盖" /></label>
          <label className="field">Negative Prompt<textarea className="input min-h-24" name="negativePrompt" placeholder="自动识别，可手动覆盖" /></label>
          <button className="button w-fit" type="submit" disabled={currentCount >= 10}>提交作品</button>
        </div>
      ) : null}
    </form>
  );
}