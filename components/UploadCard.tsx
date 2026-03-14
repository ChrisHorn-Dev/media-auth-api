"use client";

import { useCallback, useState } from "react";

const ALLOWED_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 10;

interface UploadCardProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export function UploadCard({ onUpload, disabled }: UploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return `Unsupported type: ${file.type}. Use JPEG, PNG, WebP, or GIF.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null);
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      onUpload(file);
    },
    [onUpload, validateFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file ?? null);
    },
    [handleFile]
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
      const file = e.target.files?.[0];
      handleFile(file ?? null);
      e.target.value = "";
    },
    [handleFile]
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
          onChange={onInputChange}
          className="hidden"
          disabled={disabled}
        />
        <span className="text-4xl mb-2" aria-hidden>
          📁
        </span>
        <span className="text-zinc-600 font-medium">
          {dragActive ? "Drop file here" : "Drag and drop an image here"}
        </span>
        <span className="text-zinc-500 text-sm mt-1">or click to browse</span>
        <span className="text-zinc-400 text-xs mt-2">
          JPEG, PNG, WebP, GIF — max {MAX_SIZE_MB} MB
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
