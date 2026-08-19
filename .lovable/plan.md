# Admin downloads, authentication, and Google Drive

## What will change

- Add an admin-only **Download all** action that creates one ZIP containing every original photo and video.
- Preserve exact stored bytes and original file extensions; no resizing, conversion, or recompression of media.
- Show clear LT/EN preparation and download progress, disable duplicate starts, and surface retryable errors.
- Harden organiser session bootstrap so the published Cloudflare-hosted site waits for auth restoration and reports the real failure instead of incorrectly showing “no access.”
- Change Google OAuth navigation so Google opens as a real top-level popup rather than inside the blank same-origin document that triggers `ERR_BLOCKED_BY_RESPONSE`.
- Verify the Drive connection callback and run a safe sync test with an original test file, then confirm it appears in Drive and clean up test data where appropriate.

## Technical details

- Build the ZIP in the organiser’s browser from short-lived signed URLs using a streaming ZIP library, avoiding Cloudflare Worker memory/response limits and keeping private storage access admin-only.
- Use store/no-compression ZIP entries for already-compressed photos and videos, preserving quality and reducing CPU usage.
- Keep server functions thin: add an authenticated/admin-authorized function that returns a fresh media manifest and signed URLs; put listing/signing helpers in a server-only module.
- Replace direct server-function calls in admin event handlers with `useServerFn`, and subscribe to auth state changes before bootstrapping access. Distinguish unauthenticated, forbidden, and temporary server failures.
- Open the returned Google authorization URL with `window.open(url, ...)` as a top-level navigation, retain strict opener/origin validation on callback, and improve connector error reporting.
- Validate on the published origin with the organiser account: login, role access, ZIP contents/checksums, OAuth callback, Drive status, and sync tracking.
