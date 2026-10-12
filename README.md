# Two Flying Boats, 1942

**A hypothetical study from the German Naval Staff's own war diary.** On 16 July 1942 the German Naval Staff recorded, "in a very restricted circle", that at Hitler's request Göring was preparing a raid on New York by two Blohm & Voss BV 222 flying boats, to be refuelled at sea by type IXc U-boats. On 17 July the procedure was set down: two bases at sea, refuelling by hose, take-off at dusk, not before 10 September. On 28 July the Luftwaffe's General Staff declined. The study follows the wish from Göring's speech of 1938 and Hitler's Azores plans of 1940–41 to the war diary of July 1942; it reads the Nazi leadership's antisemitic picture of New York from their own documents, without claiming it as the order's motive; and it follows what the file did not count: the city of 1942 and the dead of the fear of 1945.

**Live:** https://two-flying-boats-1942.netlify.app/ · **On itch.io:** https://leofassb.itch.io/two-flying-boats-1942

Read it as a dossier, or take the Naval Staff's seat and decide where the file decides; a model then runs the raid with the file's figures and named assumptions. Third in a series with [Iron Hammer, 1945](https://iron-hammer-1945.netlify.app/) and [Dragon's Lair, 1944–45](https://dragons-lair-1944-45.netlify.app/).

## Sources

- **The file:** War Diary of the German Naval Staff, Operations Division, Part A, vol. 35 (July 1942), translated by the US Office of Naval Intelligence, 1948: entries of 16, 17 and 28 July 1942. Facsimile and transcription in `data/file.json`.
- **The wish and the city:** Nuremberg documents R-140 (Göring, 8 July 1938), 1517-PS and 001-PS (Rosenberg, December 1941), 2663-PS (Hitler, 30 January 1939), in *Nazi Conspiracy and Aggression* (US Government Printing Office, 1946); *Fuehrer Conferences on Naval Affairs* (Admiralty translation), 14 November 1940 and 22 May 1941.
- **The other side:** US census of 1940; photographs by Marjory Collins for the Office of War Information (Library of Congress); US Navy records of Operation Teardrop and the interrogation of the survivors of U-546. Secondary literature is summarised and cited, not reproduced.

## Files

- `index.html`, `app.js`, `model.js`, `style.css`: the study; `legal.html`: legal notice and privacy.
- `data/`: chapters (`study.json`), the file (`file.json`), model figures and assumptions (`model.json`), plates, sources, map.
- `tools/`: scripts that build the facsimiles, plates and map from the sources (`make-facsimiles.py`, `make-plates.py`, `make-map.py`).

Local: `python -m http.server` in this folder, then `http://localhost:8000/`. The model also runs in Node: `node -e "const TF=require('./model.js');TF.setData(require('./data/model.json'));console.log(TF.monteCarlo({naval:'support',base1:'ny1000',planes:'2',when:'sep',final:'press'},1000,1))"`.

## Licences

Code MIT; transcriptions CC0; editorial matter CC BY 4.0; documents and plates in the public domain (US Government works). See [LICENSES.md](LICENSES.md).
