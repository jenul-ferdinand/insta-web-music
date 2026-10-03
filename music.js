// Instagram web keeps photo posts silent, but its API still returns the post's song.
// When you open a photo post, this plays its song.
// Runs in the page's own JS world, so everything stays inside this function to keep clear of Instagram's globals.
(() => {
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const mediaId = code => [...code.slice(0, 11)].reduce((n, c) => n * 64n + BigInt(ABC.indexOf(c)), 0n);
  const https = url => (url?.startsWith('https://') ? url : null);
  // /p/CODE/ or /user/p/CODE/, but not comment permalinks (/p/CODE/c/ID/)
  const codeOf = el => el?.pathname.match(/\/p\/([\w-]+)\/?$/)?.[1] ?? null;

  async function findSong(code) {
    const res = await fetch(`/api/v1/media/${mediaId(code)}/info/`, {
      headers: { 'X-IG-App-ID': '936619743392459' }, // Instagram web's app id; the API rejects calls without it
    });
    if (!res.ok) throw new Error(`Instagram API returned ${res.status}`);
    const data = await res.json();
    const music = data.items?.[0]?.music_metadata?.music_info;
    const asset = music?.music_asset_info;
    if (!asset) return null;
    const src = https(asset.progressive_download_url);
    if (!src) return null;
    // Start where the poster's clip starts.
    const start = (music.music_consumption_info?.audio_asset_start_time_in_ms ?? 0) / 1000;
    return { src: `${src}#t=${start}` };
  }

  const songs = new Map(); // shortcode -> lookup, so each post hits the API once
  function lookup(code) {
    if (!songs.has(code)) {
      songs.set(code, findSong(code).catch(err => {
        console.warn('InstaWebMusic:', err);
        return null;
      }));
    }
    return songs.get(code);
  }

  const audio = new Audio();
  let blocked = false; // Firefox refuses sound until the page has been clicked once

  function play() {
    audio.play().then(
      () => (blocked = false),
      err => {
        blocked = err.name === 'NotAllowedError';
        if (!blocked && err.name !== 'AbortError') console.warn('InstaWebMusic:', err); // AbortError: switched songs mid-start
      },
    );
  }

  let current = null; // open post, or null when none is open
  let nowPlaying = null; // { code, song } loaded into `audio`

  async function tick() {
    const code = codeOf(location);
    if (code === current) {
      if (blocked && nowPlaying?.code === code) play(); // retry once Firefox allows sound
      return;
    }
    current = code;
    audio.pause();
    if (!code) return;
    const song = await lookup(code);
    if (current !== code || !song) return;
    nowPlaying = { code, song };
    audio.src = song.src;
    play();
  }

  // Polled because Instagram switches pages without reloading.
  setInterval(tick, 500);
})();
