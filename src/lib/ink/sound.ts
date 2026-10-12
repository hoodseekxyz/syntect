let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem("syntect.mute") === "1";
}

export function setMuted(muted: boolean) {
  window.localStorage.setItem("syntect.mute", muted ? "1" : "0");
}

export function blip(kind: "ok" | "bad" | "clean") {
  if (typeof window === "undefined" || isMuted()) return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === "bad" ? "square" : "triangle";
    const freq = kind === "ok" ? 640 : kind === "clean" ? 880 : 120;
    osc.frequency.setValueAtTime(freq, now);
    if (kind === "clean") osc.frequency.exponentialRampToValueAtTime(1320, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "bad" ? 0.03 : 0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "clean" ? 0.28 : 0.12));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    /* audio is juice, never a failure */
  }
}
