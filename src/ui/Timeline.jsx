import { useMemo } from 'react'
import { timelineHtml, timelineCss } from '../timeline.js'

export default function Timeline({ note, onPlay, playLabel }) {
  const html = useMemo(timelineHtml, [])
  return (
    <div className="timeline-page">
      <style>{timelineCss}</style>
      <div className="timeline-bar">
        {note && <p className="timeline-note">{note}</p>}
        {onPlay && (
          <button id="timeline-play" className="btn primary small" onClick={onPlay}>
            {playLabel}
          </button>
        )}
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
