interface SignatureSlot {
  label: string;
  name?: string;
}

function signatureName(name: string | undefined, emptyName: string) {
  return name?.trim() || emptyName;
}

export function DocumentSignatures({ slots, emptyName = "------------", showTime = false, namedRoleLayout = false }: { slots: SignatureSlot[]; emptyName?: string; showTime?: boolean; namedRoleLayout?: boolean }) {
  return (
    <section className="document-signatures signature-section" aria-label="ลายเซ็น">
      {slots.map((slot) => (
        <div className="document-signature signature-box" key={slot.label}>
          {namedRoleLayout ? (
            <div className="signature-role-line">
              <span>ลงชื่อ</span>
              <span className="document-signature__line signature-line" />
            </div>
          ) : (
            <div className="document-signature__line signature-line" />
          )}
          <p className="signature-name">{emptyName || slot.name?.trim() ? `(${signatureName(slot.name, emptyName)})` : ""}</p>
          {namedRoleLayout ? <strong className="signature-position">ตำแหน่ง {slot.label}</strong> : <strong>{slot.label}</strong>}
          <span className="signature-date">วันที่ ____ / ____ / ______{showTime ? " เวลา ______ น." : ""}</span>
        </div>
      ))}
    </section>
  );
}
