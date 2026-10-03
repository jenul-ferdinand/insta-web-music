[![stars](https://custom-icon-badges.demolab.com/github/stars/jenul-ferdinand/insta-web-music?logo=star&style=flat)](https://github.com/jenul-ferdinand/insta-web-music/stargazers "stars")
[![issues](https://custom-icon-badges.demolab.com/github/issues-raw/jenul-ferdinand/insta-web-music?logo=issue)](https://github.com/jenul-ferdinand/insta-web-music/issues "issues")
[![release](https://custom-icon-badges.demolab.com/github/v/release/jenul-ferdinand/insta-web-music?logo=tag&logoColor=white)](https://github.com/jenul-ferdinand/insta-web-music/releases/latest "latest release")
[![code size](https://custom-icon-badges.demolab.com/github/languages/code-size/jenul-ferdinand/insta-web-music?logo=file-code&logoColor=white)](https://github.com/jenul-ferdinand/insta-web-music "code size")

<h1 align="center">♫ InstaWebMusic</h1>

<p align="center">
  <i>Hear the music on Instagram photo posts in your browser, not just the app.</i>
</p>

<h3 align="center">
  <a href="https://github.com/jenul-ferdinand/insta-web-music/releases/latest">Download</a>
  <span> · </span>
  <a href="#install">Install</a>
  <span> · </span>
  <a href="https://github.com/jenul-ferdinand/insta-web-music/issues">Issues</a>
</h3>

<br/>

## What is InstaWebMusic?

The Instagram app plays the song people add to their photo posts. Open the same post on instagram.com and you hear nothing. InstaWebMusic is a Firefox extension that plays the song when you open the post in your browser, starting from the part the poster picked.

Instagram's web API returns the song with each post even though the website doesn't play it. The extension asks for it with the Instagram session you're logged into, so you need no extra account and no third-party service.

## Features

<table>
  <tr>
    <td width="50%"><b>Plays when you open a post</b><br>The song starts from the part the poster picked and stops when you close the post or switch tabs</td>
    <td width="50%"><b>Song and artist</b><br>Shows ♫ Song · Artist under the poster's name, where the app puts it</td>
  </tr>
  <tr>
    <td width="50%"><b>Click to mute</b><br>Click the song name to mute or unmute</td>
    <td width="50%"><b>Quiet feed</b><br>Scrolling the feed plays nothing and sends no extra requests</td>
  </tr>
  <tr>
    <td width="50%"><b>Respects muted songs</b><br>If Instagram marks a song as muted for you, it stays muted</td>
    <td width="50%"><b>No data collection</b><br>Sends requests to Instagram and nowhere else</td>
  </tr>
</table>

## Install

You need Firefox 142 or newer on desktop.

1. Download the `.xpi` file from the [latest release](https://github.com/jenul-ferdinand/insta-web-music/releases/latest).
2. In Firefox, open `about:addons`, click the gear icon and choose **Install Add-on From File…**
3. Pick the file you downloaded and confirm.

Firefox blocks sound on a page until you click on it once. If you open a post from a link, click anywhere on the page and the song starts. To skip that step, click the autoplay icon in the address bar and set instagram.com to **Allow Audio and Video**.

## How it works

Opening a post changes the address to `/p/<shortcode>/`. The extension then:

1. converts the shortcode into the post's media ID
2. requests `/api/v1/media/<id>/info/` with your session cookies, a request Instagram's own site makes too
3. reads the song's audio URL, title, artist and start time from `music_metadata`
4. plays the song in an `<audio>` element and adds its name under the poster's name

If the full track's URL is missing, the extension plays the 30-second preview Instagram makes for the web. The script runs in the page itself (`"world": "MAIN"` in the manifest), so its requests carry your cookies like the site's own.

## Development

The extension has no build step and no dependencies: `manifest.json` loads `music.js` on instagram.com.

```sh
node check.js       # runs music.js against a fake Instagram page and API
npx web-ext lint    # Mozilla's add-on linter
```

To try a change, open `about:debugging#/runtime/this-firefox` in Firefox, click **Load Temporary Add-on…** and pick `manifest.json`. After each edit, click **Reload** on the extension's card and refresh Instagram.

## Contributing

Instagram changes its web app without notice, and a change can break the extension. If a song stops playing, open the browser console (F12) on that post and copy any lines starting with `InstaWebMusic:` into a [new issue](https://github.com/jenul-ferdinand/insta-web-music/issues).

Pull requests welcome. Run `node check.js` before you open one.

## Contact

**Developed by:** [@jenul-ferdinand](https://github.com/jenul-ferdinand) \
**Issues:** [GitHub Issues](https://github.com/jenul-ferdinand/insta-web-music/issues)

## Disclaimer

InstaWebMusic is an independent project. Instagram and Meta don't endorse, sponsor or have any affiliation with it. Instagram is a trademark of Meta Platforms, Inc.

## License

InstaWebMusic uses the MIT License. See the [LICENSE](LICENSE) file for details.
