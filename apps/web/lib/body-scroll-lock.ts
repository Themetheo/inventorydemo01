type ScrollLockTarget = { style: { overflow: string } };

export function lockBodyScroll(target: ScrollLockTarget): () => void {
  const previousOverflow = target.style.overflow;
  target.style.overflow = "hidden";
  return () => { target.style.overflow = previousOverflow; };
}
