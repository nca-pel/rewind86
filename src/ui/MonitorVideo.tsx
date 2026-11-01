/**
 * Easter-Egg-Video im Monitor: YouTube-Einbettung (datensparsame nocookie-Domain) füllt die Bildröhre,
 * darüber liegen – wenn eingeschaltet – Scanlines, Flimmern und die Wölbung des Monitors.
 * Die Überlagerung lässt Klicks durch, damit der Play-Knopf erreichbar bleibt, falls der Browser Autoplay blockiert.
 */
export function MonitorVideo({ id, crt }: { id: string; crt: boolean }) {
  const params = new URLSearchParams({
    autoplay: '1',
    controls: '0',
    rel: '0',
    playsinline: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
  });
  return (
    <div className={`monitor-video${crt ? ' crt-on' : ''}`} data-testid="monitor-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
        title="Video im Monitor (Easter-Egg)"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="eager"
      />
      {crt && <div className="monitor-video-scanlines" aria-hidden="true" />}
    </div>
  );
}
