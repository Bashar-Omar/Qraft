const pattern = [
  1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1,
  0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1,
  1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1,
] as const;

type QrMotifProps = {
  compact?: boolean;
};

export function QrMotif({ compact = false }: QrMotifProps) {
  return (
    <div aria-hidden="true" className={compact ? "qr-motif qr-motif--compact" : "qr-motif"}>
      {pattern.map((cell, index) => (
        <span className={cell ? "qr-motif__cell is-on" : "qr-motif__cell"} key={index} />
      ))}
    </div>
  );
}
