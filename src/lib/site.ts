export const SITE = {
  name: "Qraft",
  description: "A privacy-first QR and barcode studio.",
  githubUrl: "https://github.com/Bashar-Omar/Qraft",
} as const;

export const PRIMARY_NAV = [
  { href: "/generate", label: "Generate" },
  { href: "/scan", label: "Scan" },
  { href: "/batch", label: "Batch" },
  { href: "/guides", label: "Guides" },
] as const;
