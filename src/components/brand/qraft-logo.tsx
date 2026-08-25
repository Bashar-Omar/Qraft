type QraftLogoProps = {
  className?: string;
};

export function QraftLogo({ className = "" }: QraftLogoProps) {
  return (
    <span className={`qraft-logo ${className}`.trim()}>
      <span aria-hidden="true" className="qraft-logo__mark" />
      <span className="sr-only">Qraft</span>
    </span>
  );
}
