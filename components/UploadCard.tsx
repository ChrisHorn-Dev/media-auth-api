"use client";

import { useCallback, useState } from "react";

const ALLOWED_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 10;
const MAX_FILES = 5;

interface UploadCardProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

function validateFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return `Unsupported type: ${file.type}. Use JPEG, PNG, WebP, or GIF.`;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

export function UploadCard({ onUpload, disabled }: UploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      setError(null);
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      if (files.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files per upload.`);
        return;
      }
      for (const file of files) {
        const err = validateFile(file);
        if (err) {
          setError(`${file.name}: ${err}`);
          return;
        }
      }
      onUpload(files);
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="w-full max-w-lg">
      <label
        className={`
          flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12
          text-center transition-colors cursor-pointer
          ${disabled ? "pointer-events-none opacity-60" : ""}
          ${dragActive ? "border-sky-500 bg-sky-50/50" : "border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-zinc-100/50"}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          accept={ALLOWED_TYPES}
          multiple
          onChange={onInputChange}
          className="hidden"
          disabled={disabled}
        />
        <span className="text-4xl mb-2" aria-hidden>
          📁
        </span>
        <span className="text-zinc-600 font-medium">
          {dragActive ? "Drop files here" : "Drag and drop images here"}
        </span>
        <span className="text-zinc-500 text-sm mt-1">or click to browse</span>
        <span className="text-zinc-400 text-xs mt-2">
          JPEG, PNG, WebP, GIF — max {MAX_SIZE_MB} MB, up to {MAX_FILES} files
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
