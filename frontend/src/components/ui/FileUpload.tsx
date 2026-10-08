"use client";

import { FileText, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

const DEFAULT_ACCEPT = "image/jpeg,image/png,application/pdf";
const MB = 1024 * 1024;

interface FileUploadProps {
  label: string;
  hint?: string;
  /** Name of the file already stored on the server, if any. */
  fileName: string | null;
  onFile: (file: File) => void;
  onPreview?: () => void;
  uploading?: boolean;
  disabled?: boolean;
  accept?: string;
  maxSizeMb?: number;
  error?: string;
}

/** Upload slot with client-side type/size checks, preview and replace. */
export function FileUpload({
  label,
  hint,
  fileName,
  onFile,
  onPreview,
  uploading = false,
  disabled = false,
  accept = DEFAULT_ACCEPT,
  maxSizeMb = 5,
  error,
}: FileUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string>();
  const shownError = localError ?? error;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!accept.split(",").includes(file.type)) {
      setLocalError(strings.validation.fileType);
      return;
    }
    if (file.size > maxSizeMb * MB) {
      setLocalError(strings.validation.fileSize(maxSizeMb));
      return;
    }
    setLocalError(undefined);
    onFile(file);
  };

  const pick = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium text-text">
        {label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-labelledby={`${id}-label`}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {fileName ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-control border bg-surface p-3",
            shownError ? "border-error" : "border-border",
          )}
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-success-soft text-success">
            {uploading ? <Spinner /> : <FileText aria-hidden size={16} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{fileName}</p>
            <p className="text-xs text-success">{uploading ? strings.upload.uploading : strings.upload.uploaded}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {onPreview && (
              <Button variant="text" size="sm" onClick={onPreview} disabled={uploading}>
                {strings.common.preview}
              </Button>
            )}
            {!disabled && (
              <Button variant="text" size="sm" onClick={pick} disabled={uploading}>
                {strings.common.replace}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          aria-describedby={`${id}-hint`}
          onClick={pick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-control border border-dashed bg-surface px-4 py-4 text-center transition-colors focus-ring",
            "hover:border-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60",
            shownError ? "border-error" : "border-border-strong",
          )}
        >
          {uploading ? <Spinner size={18} className="text-accent" /> : <Upload aria-hidden size={18} className="text-accent" />}
          <span className="text-sm font-medium text-primary">
            {uploading ? strings.upload.uploading : strings.upload.choose}
          </span>
          <span id={`${id}-hint`} className="text-xs text-muted">
            {hint ?? strings.upload.dropHint}
          </span>
        </button>
      )}
      {shownError && (
        <p role="alert" className="text-xs text-error">
          {shownError}
        </p>
      )}
    </div>
  );
}
