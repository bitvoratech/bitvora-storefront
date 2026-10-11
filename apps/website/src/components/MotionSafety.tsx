// Entrance animations (motion's initial="hidden") server-render content at
// opacity:0 and rely on JavaScript to fade it in. On a slow phone connection
// — or with JS blocked — that leaves sections blank. This is the safety net:
//   * no JavaScript at all → CSS reveals everything immediately;
//   * JavaScript hasn't hydrated within 3s → reveal everything anyway.
// When the page hydrates normally, nothing here changes the animations.
const SCRIPT = `(function(){var d=document.documentElement;setTimeout(function(){if(!d.hasAttribute('data-hydrated'))d.classList.add('motion-fallback')},3000)})();`

const STYLE = `
@media (scripting: none) {
  [style*="opacity:0"] { opacity: 1 !important; transform: none !important; }
}
.motion-fallback [style*="opacity:0"] { opacity: 1 !important; transform: none !important; }
`

export function MotionSafety() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  )
}
