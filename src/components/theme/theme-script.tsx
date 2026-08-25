const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem("qraft-theme");
    const preference = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = preference === "system" ? (systemDark ? "dark" : "light") : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
