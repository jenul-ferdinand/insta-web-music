// node check.js: drives music.js against a fake Instagram page, API and <audio>.
const assert = require('node:assert');
const vm = require('node:vm');

let tick, player, reply, requested;
let autoplayBlocked = false;

globalThis.location = { pathname: '/' };
globalThis.setInterval = fn => (tick = fn);
globalThis.fetch = async url => {
  requested = url;
  return { ok: true, json: async () => reply };
};
globalThis.Audio = class {
  paused = true;
  constructor() { player = this; }
  async play() {
    if (autoplayBlocked) throw new DOMException('no click yet', 'NotAllowedError');
    this.paused = false;
  }
  pause() { this.paused = true; }
};
vm.runInThisContext(require('node:fs').readFileSync(`${__dirname}/music.js`, 'utf8'));

const post = (asset, consumption) => ({
  items: [{ music_metadata: { music_info: { music_asset_info: asset, music_consumption_info: consumption } } }],
});
const asset = { title: 'Song', display_artist: 'Artist', web_30s_preview_download_url: 'https://cdn/30s.m4a' };
const full = { ...asset, progressive_download_url: 'https://cdn/full.m4a' };
const open = async path => {
  location.pathname = path;
  await tick();
};

(async () => {
  // Opening a post plays its song from where the poster's clip starts; closing it stops the song.
  await tick();
  assert.equal(requested, undefined); // scrolling the feed looks nothing up
  reply = post(full, { audio_asset_start_time_in_ms: 45000 });
  await open('/p/BqvsDleB3lV/');
  assert.equal(requested, '/api/v1/media/1922949326347663701/info/'); // id pair from gallery-dl's test suite
  assert.equal(player.src, 'https://cdn/full.m4a#t=45');
  assert.equal(player.paused, false);
  await open('/');
  assert.equal(player.paused, true);

  // Closing a post before the API answers keeps its song from starting.
  const fetchNow = fetch;
  let answer;
  globalThis.fetch = () => new Promise(resolve => (answer = resolve));
  const slow = open('/p/SlowSong001/');
  await open('/');
  answer({ ok: true, json: async () => post(full, {}) });
  await slow;
  assert.equal(player.paused, true);
  globalThis.fetch = fetchNow;

  // Firefox blocks sound until the page has been clicked; the next tick after that starts it.
  autoplayBlocked = true;
  reply = post(full, {});
  await open('/p/NoClickYet1/');
  assert.equal(player.paused, true);
  autoplayBlocked = false;
  await tick();
  assert.equal(player.paused, false);
  await open('/');

  console.log('ok');
})();
