"use client";

import { useCallback, useState } from "react";
import { FileText, Check } from "lucide-react";

interface ExportPdfButtonProps {
  title?: string;
  className?: string;
}

export default function ExportPdfButton({
  title = "Anveshaka Research Report",
  className,
}: ExportPdfButtonProps) {
  const [exported, setExported] = useState(false);

  const handleExport = useCallback(() => {
    const originalTitle = document.title;
    const cleanTitle = title
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .trim()
      .slice(0, 60);

    document.title = cleanTitle ? `Anveshaka - ${cleanTitle}` : "Anveshaka - Research Report";

    window.print();

    setExported(true);
    setTimeout(() => {
      document.title = originalTitle;
      setExported(false);
    }, 2500);
  }, [title]);

  return (
    <button
      onClick={handleExport}
      type="button"
      className={
        className ||
        "flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
      }
      title="Export formatted PDF"
    >
      {exported ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">Exporting...</span>
        </>
      ) : (
        <>
          <FileText className="h-3 w-3 text-violet-400" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}
