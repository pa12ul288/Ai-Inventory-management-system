"use client";

import { useAppData } from "@/lib/AppDataContext";
import UploadScreen from "@/components/UploadScreen";

export default function UploadPage() {
  const { analyzing, error, handleAnalyze } = useAppData();

  return <UploadScreen onAnalyze={handleAnalyze} analyzing={analyzing} errorMessage={error} />;
}
