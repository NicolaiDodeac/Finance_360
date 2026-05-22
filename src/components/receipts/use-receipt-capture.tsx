"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { captureReceipt } from "@/lib/receipts/capture-actions";

interface UseReceiptCaptureOptions {
  defaultTaxYearId?: string | null;
  taxYearId?: string | null;
}

export function useReceiptCapture(options?: UseReceiptCaptureOptions) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [taxYearId, setTaxYearId] = useState(
    options?.taxYearId ?? options?.defaultTaxYearId ?? ""
  );

  function submitFile(file: File) {
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const yearId = options?.taxYearId ?? taxYearId;
    if (yearId) formData.set("tax_year_id", yearId);

    startTransition(async () => {
      const result = await captureReceipt(formData);
      if (!result.success || !result.data?.id) {
        setError(result.error ?? "Could not process receipt.");
        return;
      }
      router.push(`/receipts/review/${result.data.id}`);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) submitFile(file);
    e.target.value = "";
  }

  function openCamera() {
    cameraRef.current?.click();
  }

  function openFilePicker() {
    fileRef.current?.click();
  }

  const fileInputs = (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={isPending}
        onChange={handleFileChange}
        aria-hidden
      />
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
        className="sr-only"
        disabled={isPending}
        onChange={handleFileChange}
        aria-hidden
      />
    </>
  );

  return {
    isPending,
    error,
    taxYearId,
    setTaxYearId,
    fileInputs,
    openCamera,
    openFilePicker,
    submitFile,
  };
}
