import type { ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export interface DocumentMetaItem {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function DocumentMeta({ items, className }: { items: DocumentMetaItem[]; className?: string }) {
  return (
    <dl className={classes("document-meta", className)}>
      {items.map((item) => (
        <div className="document-meta__item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value || "-"}</dd>
          {item.detail && <p className="document-meta__detail">{item.detail}</p>}
        </div>
      ))}
    </dl>
  );
}
