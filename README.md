# 下一班 NextBus
Mobile-friendly Traditional Chinese KMB / LWB bus arrival web app. Built directly against official open data; no copied hkbus source or runtime dependencies.

## Publish using GitHub Pages (no Node.js required)
1. On https://github.com/new, create a public repository named `hk-bus-app`.
2. Extract the supplied ZIP. In the repository, choose **Add file → Upload files**.
3. Upload `index.html`, `styles.css`, `app.js`, `core.js` and this README directly to the repository root. Do not upload the ZIP itself or a containing folder. Commit the files.
4. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Click **Save**.
5. Wait for deployment. Open the URL displayed by GitHub Pages, normally `https://YOUR-USERNAME.github.io/hk-bus-app/`.
6. To update the app, replace the relevant files and commit; Pages republishes automatically.

All asset paths are relative, so repository subpaths work. There is no backend, build step, account system, API key or analytics. The supplied `.nojekyll` file is optional for this plain static app.

## Local preview
From this folder run `python3 -m http.server 8000`, then open http://localhost:8000. Do not open index.html as a file:// URL because module loading may be blocked.

## Features
- KMB / LWB route search, direction and service-variant selection.
- Stops sorted by official stop sequence.
- Up to three valid future arrivals; exact route, bound, service type and sequence filtering.
- Current stop refresh every 60 seconds while visible; foreground refresh on return.
- Browser-local favourites, manual refresh, explicit load failures and stale ETA status.
- Traditional Chinese interface, responsive layout and keyboard focus indicators.

## API and limitations
Base: https://data.etabus.gov.hk/v1/transport/kmb
Endpoints: `/route/`, `/stop`, `/route-stop/{route}/{direction}/{service_type}`, `/eta/{stop}/{route}/{service_type}`.
Source: https://data.gov.hk/en-data/dataset/hk-td-tis_21-etakmb
API requests run in the visitor's browser and require upstream CORS support. GitHub Pages cannot host a server proxy. If upstream browser access changes, a separately hosted proxy would be needed. No arrival data is simulated in the app. Arrival estimates may be unavailable, delayed or inaccurate; check operator notices. No Citybus, nearby stops, fares, maps or journey planning in this version. Route/stop metadata is fetched per browser session.

## Checks
With Node.js installed run `npm test`. Three automated logic tests pass: direction / variant / repeated-stop filtering; arrival sorting and labels; route search and favourite identity. Browser testing could not run because Chromium was unavailable and its download was blocked. Live API verification from the development environment was also blocked (HTTP 403). After publishing, verify live requests (including CORS), representative real routes, favourite persistence, failure states and mobile layout.

## Reference
Architecture reference: https://github.com/hkbus. This app implements its own static UI and official KMB integration.
