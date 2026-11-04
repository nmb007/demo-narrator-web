# ADR 0001: Play narrated video from an in-memory Blob

## Status

Accepted

## Context

`GET /v1/videos/{video_id}/download` returns the narrated MP4 only when the request carries `Authorization: Bearer`. A `<video src>` or `<a href>` cannot send that header. The response is a full-body stream: no HTTP Range support, and the muxed file is not written with `-movflags +faststart`. Pointing the media element at the API URL cannot authenticate, and seeking would be unreliable even if it could.

Uploads are limited to 100 MB and 10 minutes. The narrated file is about the same size (assumption A6 in docs/01-findings-and-open-questions.md).

## Decision

The frontend fetches the download endpoint with the session token, reads the body into a Blob, and uses one Blob for both actions.

- Play: `URL.createObjectURL(blob)` is the source of a native `<video controls playsInline>`. The browser supplies play, pause, seek, and volume. No third-party player.
- Download: a temporary `<a download>` click saves that Blob. The filename comes from `Content-Disposition`.

The Blob is not a file on disk. Playback stores nothing under the app, the API, or the OS temp directory. `URL.revokeObjectURL` drops the `blob:` address. The browser reclaims the bytes once React no longer holds the Blob.

Revoke when the player closes, when the component unmounts, and before replacing the URL with another video. After a download click, wait about one second before revoking, so Safari can start the save. The file in the user's Downloads folder is theirs and is not removed.

Fetch on click. Do not prefetch every row. If the user downloads the clip already open in the player, reuse that Blob.

## Consequences

- Play and download work with the current endpoint. No backend change.
- The whole file sits in the tab's memory until the URL is revoked and the Blob is dropped. That matches the current size limit.
- Signed download URLs remain the later step that removes this memory limit (Phase 5 in docs/07-implementation-plan.md). They are not required for this feature.

## Rejected

- `<video src>` set to the API URL. The media element cannot send the bearer token, and the endpoint does not support Range.
- Range requests plus a cookie or query token. More surface than a signed URL, and a query token leaks into logs.
- Media Source Extensions or a service worker. The output is one finished MP4. Neither removes the need for an authenticated fetch.
- A third-party player (Vidstack, Plyr, Video.js) or a shadcn video widget. shadcn does not ship a player. The native element already plays a local MP4. A library would be a new dependency for controls the browser provides.
