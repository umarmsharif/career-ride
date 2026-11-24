// The plain timeline: the same career content as the ride, as ordinary HTML.
// Used three ways: the fallback page, the "Plain CV" view, and a static /cv/ page for search engines.
import career from './content/career.json' with { type: 'json' }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function items(island) {
  if (island.districts) {
    return island.districts
      .map((d) => `<h4>${esc(d.name)}</h4><ul>${d.pickups.map((p) => `<li>${esc(p.fact)}</li>`).join('')}</ul>`)
      .join('')
  }
  if (island.pickups) return `<ul>${island.pickups.map((p) => `<li>${esc(p.fact)}</li>`).join('')}</ul>`
  if (island.machines) {
    return island.machines
      .map((m) => `<h4>${esc(m.title)}</h4><p class="tl-client">${esc(m.client)}</p><ul>${m.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`)
      .join('')
  }
  return [...(island.boards || []), ...(island.cards || [])].map((b) => `<h4>${esc(b.title)}</h4><p>${esc(b.body)}</p>`).join('')
}

export function timelineHtml() {
  const p = career.person
  return `<article class="tl">
  <header class="tl-head">
    <p class="tl-eyebrow">Career timeline</p>
    <h1>${esc(p.name)}</h1>
    <p class="tl-tag">${esc(p.tagline)}</p>
    <p class="tl-links"><a href="${esc(p.links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a> <a href="${esc(p.links.github)}" target="_blank" rel="noopener">GitHub</a></p>
  </header>
  <ol class="tl-list">
    ${career.islands
      .map(
        (i) => `<li class="tl-stop">
      <div class="tl-dot" aria-hidden="true">${i.id}</div>
      <div class="tl-body">
        <p class="tl-years">${esc(i.years)}</p>
        <h2>${esc(i.company)}</h2>
        <p class="tl-role">${esc(i.role)}</p>
        <p>${esc(i.summary)}</p>${i.about ? `
        <p class="tl-about">${esc(i.about)}</p>` : ''}
        ${items(i)}
      </div>
    </li>`
      )
      .join('\n    ')}
  </ol>
  ${career.islands[8].closing ? `<p class="tl-closing">${esc(career.islands[8].closing)}</p>` : ''}
</article>`
}

export const timelineCss = `
.tl{max-width:46rem;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));font-family:'Nunito','Segoe UI',system-ui,sans-serif;color:#22304f;line-height:1.5}
.tl h1,.tl h2,.tl h4{font-family:'Fredoka','Trebuchet MS',sans-serif;font-weight:600;margin:0;text-wrap:balance;line-height:1.15}
.tl h1{font-size:clamp(2rem,6vw,3rem);color:#f0553f}
.tl h2{font-size:1.4rem}
.tl h4{font-size:1.02rem;margin-top:12px}
.tl p{margin:4px 0}
.tl-eyebrow,.tl-years{font-family:'Fredoka','Trebuchet MS',sans-serif;font-weight:600;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;color:#17806f}
.tl-tag{font-size:1.1rem;font-weight:700}
.tl-links{display:flex;gap:16px;font-weight:800}
.tl a{color:#c23a26}
.tl-list{list-style:none;margin:28px 0 0;padding:0;display:flex;flex-direction:column;gap:22px}
.tl-stop{display:flex;gap:16px;align-items:flex-start}
.tl-dot{flex:none;width:40px;height:40px;border-radius:50%;background:#ffd23f;border:3px solid #22304f;box-shadow:0 3px 0 #22304f;display:grid;place-items:center;font-family:'Fredoka',sans-serif;font-weight:700}
.tl-body{min-width:0;background:#fff6e4;border:3px solid #22304f;border-radius:18px;box-shadow:0 5px 0 #22304f;padding:14px 18px;flex:1}
.tl-role{font-weight:800}.tl-about{font-style:italic;opacity:.8}
.tl-client{color:#55627d;font-weight:700}
.tl ul{margin:6px 0 0;padding-left:1.2em}
.tl li{margin:3px 0}
.tl-closing{margin-top:28px;font-family:'Fredoka',sans-serif;font-size:1.25rem;text-align:center}
`
