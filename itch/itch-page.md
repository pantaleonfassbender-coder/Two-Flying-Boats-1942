# itch.io page for Two Flying Boats, 1942 — field by field

Files in this folder:
- `two-flying-boats-1942-itch.zip`: the upload. Build it with `python itch/build-itch.py`; it is gitignored.
- `cover-630x500.png`: the cover. Build it with `python itch/make-cover.py`.
- `screenshot-1…8.png`: the screenshots. Build them with `python itch/make-shots.py`; this needs the local server on port 8973.
- `description.html`: the page text, with the donation notice.
- `devlog-1.html`: the first devlog.

To use the two HTML files, open them in the browser, mark the text below the yellow box, copy it and paste it into itch's editor.

| Field | Value |
|---|---|
| Title | Two Flying Boats, 1942 |
| Project URL | two-flying-boats-1942 |
| Short description or tagline | A hypothetical study from the German Naval Staff's own war diary: the raid on New York by two flying boats, refuelled by U-boats, planned in July 1942. Read the dossier or take the staff's seat. |
| Classification | Games |
| Kind of project | HTML |
| Release status | Released |
| **Pricing** | **$0 or donate** · Suggested donation **$3** (as for Iron Hammer and Dragon's Lair) |
| Uploads | two-flying-boats-1942-itch.zip → tick **This file will be played in the browser** |
| Embed options | Embed in page · Viewport **1366 × 850** (or Click to launch in fullscreen) |
| Frame options | ☑ Fullscreen button · ☑ Enable scrollbars · ☐ Mobile friendly · ☐ Automatically start on page load |
| Genre | Simulation (or Educational) |
| Tags | historical, world-war-ii, alternate-history, documentary, simulation, educational, strategy, singleplayer, turn-based, history |
| AI generation disclosure | Yes — code and text. The documents are archival records; the cover uses a US Navy photograph and a facsimile of the war diary (public domain), not an AI image. |
| Languages | English |
| Inputs | Mouse |
| Community | Comments |
| Visibility & access | Draft → check the page → Public |
| Cover image | cover-630x500.png |
| Screenshots | 4-file, 3-decision, 5-raid, 6-accounting, 7-city-in-their-minds, 8-newyork (1-start, 2-request in reserve) |

## Notes

- **Donation notice.** The itch build sets `window.TF_ITCH = true`. The start page and the accounting then show "This study is free … please support it with a donation". Once `ITCH_URL` in `app.js` is set, the Netlify version links to the itch page.
- **Legal page.** The itch build leaves out `legal.html`, because its privacy notice describes the copy on Netlify. The study stores only its decisions in the browser and loads nothing from other servers.
- **Profile order.** Like Iron Hammer and Dragon's Lair, this study should not be the first tile on the profile.
- **Plates.** All plates are US Government works in the public domain; there are no Creative Commons images this time.
- **When the page is live.** Tell me the final URL. I will then set `ITCH_URL`, link it from the README and the footer, add cross-links from Iron Hammer and Dragon's Lair, and add a line to the profile text, which must stay under 5,000 characters.
