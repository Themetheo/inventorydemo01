import type { ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DocumentPreviewShell({ toolbar, children }: { toolbar: ReactNode; children: ReactNode }) {
  return (
    <div className="document-system min-h-screen bg-[#eee9df] px-3 py-4 text-[#33231d] sm:px-6 lg:px-8">
      {toolbar}
      <div className="document-sheet mx-auto bg-white">
        {children}
      </div>
    </div>
  );
}

export function DocumentPaper({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={classes("document-paper", className)}>{children}</article>;
}
