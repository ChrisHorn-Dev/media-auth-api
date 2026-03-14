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

  const inputId = "file-upload-input";

  return (
    <div className="w-full max-w-lg">
      <label
        htmlFor={inputId}
        className={`
          flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors
          focus-within:outline-none focus-within:ring-2 focus-within:ring-zinc-400 focus-within:ring-offset-2
          ${disabled ? "pointer-events-none opacity-60" : ""}
          ${dragActive ? "border-zinc-500 bg-zinc-100/80" : "border-zinc-400 bg-zinc-50/80 hover:border-zinc-500 hover:bg-zinc-100/60"}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id={inputId}
          type="file"
          accept={ALLOWED_TYPES}
          multiple
          onChange={onInputChange}
          className="sr-only"
          disabled={disabled}
          aria-label="Choose image files to upload"
        />
        <span className="mb-3 text-3xl text-zinc-400" aria-hidden>
          📁
        </span>
        <span className="text-base font-medium text-zinc-700">
          {dragActive ? "Drop files here" : "Drag and drop images here"}
        </span>
        <span className="mt-1 text-sm text-zinc-500">or click to browse</span>
        <span className="mt-3 text-xs text-zinc-400">
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
