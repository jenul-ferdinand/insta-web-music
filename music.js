// Instagram web keeps photo posts silent, but its API still returns the post's song.
// When you open a photo post, this plays its song and names it under the poster's name, like the app.
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
    const full = https(asset.progressive_download_url);
    const src = full ?? https(asset.web_30s_preview_download_url);
    if (!src) return null;
    // The full track starts where the poster's clip starts; the 30s preview is already a clip.
    const start = full ? (music.music_consumption_info?.audio_asset_start_time_in_ms ?? 0) / 1000 : 0;
    return {
      src: `${src}#t=${start}`,
      title: `${asset.title} · ${asset.display_artist}`,
      user: data.items[0].user?.username,
    };
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

  function paint(btn) {
    btn.textContent = `${audio.muted ? '🔇' : '♫'} ${btn.dataset.song}`;
    btn.title = audio.muted ? 'Unmute post songs' : 'Mute post songs';
  }

  // The header column holding the poster's name and any line under it (location etc.): climb from
  // their name link until the next level up also holds their profile picture.
  function nameColumn(post, user) {
    const name = post.querySelector(`a[href="/${user}/"]:not(:has(img))`); // the header's comes before the caption's
    for (let el = name, depth = 0; el?.parentElement && depth < 12; el = el.parentElement, depth++) {
      if (el.parentElement.querySelector('img')) return el === name ? null : el;
    }
    return null;
  }

  // Shows the song under the poster's name, below anything already there. Click to mute.
  function label(code, song) {
    const date = [...document.querySelectorAll('a[href*="/p/"] time')].map(time => time.closest('a')).find(a => codeOf(a) === code);
    if (!date) return; // post not rendered yet
    const post = date.closest('[role="dialog"]') ?? document.querySelector('main') ?? document; // popup, else the post's own page
    if (post.querySelector('.insta-web-music')) return;
    const btn = document.createElement('button');
    btn.className = 'insta-web-music';
    btn.dataset.song = song.title;
    btn.style.cssText = 'display:block;background:none;border:0;padding:0;color:inherit;font:inherit;font-size:12px;text-align:left;cursor:pointer';
    btn.onclick = () => {
      audio.muted = !audio.muted;
      document.querySelectorAll('button.insta-web-music').forEach(paint);
    };
    paint(btn);
    const column = nameColumn(post, song.user);
    if (column) column.append(btn);
    else date.after(btn); // header not found
  }

  let current = null; // open post, or null when none is open or the tab is hidden
  let nowPlaying = null; // { code, song } loaded into `audio`

  async function tick() {
    const code = document.hidden ? null : codeOf(location);
    if (code === current) {
      if (code && nowPlaying?.code === code) {
        label(code, nowPlaying.song); // Instagram can render the header late or re-render it
        if (blocked) play();
      }
      return;
    }
    current = code;
    audio.pause();
    document.querySelectorAll('button.insta-web-music').forEach(btn => btn.remove()); // the popup reuses its header between posts
    if (!code) return;
    const song = await lookup(code);
    if (current !== code || !song) return;
    nowPlaying = { code, song };
    audio.src = song.src;
    label(code, song);
    play();
  }

  // Polled because Instagram switches pages without reloading.
  setInterval(tick, 500);
})();
