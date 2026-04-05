"use client";

import { useState, useCallback } from "react";

interface FileUploadProps {
  onUploadComplete?: (ipfsHash: string, gatewayUrl: string) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onUploadComplete,
  onError,
  acceptedTypes = ".pdf,.png,.jpg,.jpeg,.mp4,.txt,.md",
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`File too large. Max size: ${maxSizeMB}MB`);
        return;
      }

      setIsUploading(true);
      setFileName(file.name);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "metadata",
          JSON.stringify({
            name: file.name,
            keyvalues: {
              originalName: file.name,
              size: file.size.toString(),
              type: file.type,
            },
          })
        );

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const data = await response.json();
        setUploadProgress(100);

        onUploadComplete?.(data.ipfsHash, data.gatewayUrl);
      } catch (err) {
        onError?.((err as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, onError, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadFile]
  );

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-dot terminal-dot-red" />
        <div className="terminal-dot terminal-dot-yellow" />
        <div className="terminal-dot terminal-dot-green" />
        <span className="ml-4 text-xs text-[#444444] font-mono">UPLOAD_TO_IPFS.exe</span>
      </div>

      <div
        className={`p-6 border-2 border-dashed transition-colors ${
          isDragging
            ? "border-[#00ff41] bg-[#00ff41]/5"
            : "border-[#1a1a1a] hover:border-[#333333]"
        } ${isUploading ? "pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#00ff41] animate-pulse" />
              <span className="text-sm font-mono text-[#00ff41]">
                UPLOADING: {fileName}
              </span>
            </div>
            <div className="h-1 bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full bg-[#00ff41] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-xs font-mono text-[#444444] text-right">
              {uploadProgress}%
            </div>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center gap-4 cursor-pointer"
            >
              <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#444444]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-mono text-white mb-1">
                  DROP_FILE_OR_CLICK_TO_UPLOAD
                </p>
                <p className="text-xs font-mono text-[#444444]">
                  MAX_SIZE: {maxSizeMB}MB | TYPES: {acceptedTypes}
                </p>
              </div>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
