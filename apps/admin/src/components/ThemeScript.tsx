import Script from 'next/script'

const THEME_STORAGE_KEY = 'bitvora-admin-theme'

// Runs before hydration so there's no flash of the wrong theme.
// strategy="beforeInteractive" is what makes this safe to use as JSX here —
// Next.js injects it into <head> and runs it pre-hydration without React
// trying to reconcile it as a normal DOM child (which is what throws the
// "script tag while rendering" warning with a plain <script> element).
const script = `
(function() {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export function ThemeScript() {
  // App Router root layouts are the documented place for beforeInteractive; the
  // lint rule predates the App Router and only knows about pages/_document.
  // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
  return <Script id="theme-script" strategy="beforeInteractive">{script}</Script>
}