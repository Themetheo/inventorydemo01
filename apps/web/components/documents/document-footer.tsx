export function DocumentFooter({ note, systemRequestId, emptyLabel = "ไม่มีหมายเหตุ" }: { note: string; systemRequestId?: string; emptyLabel?: string }) {
  const trimmedNote = note?.trim();
  const isBlank = !trimmedNote && !emptyLabel;
  return (
    <footer>
      <div className="document-footer">
        <strong>หมายเหตุ</strong>
        <p className={isBlank ? "document-footer__blank" : undefined}>{trimmedNote || emptyLabel}</p>
      </div>
      {systemRequestId && (
        <p className="document-system-reference">
          รหัสอ้างอิงระบบ: {systemRequestId}
        </p>
      )}
    </footer>
  );
}
