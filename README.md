# Web CAD On-Prem Scaffold

This workspace contains a runnable v1 scaffold for an on-prem CAD and point cloud platform.

## What is included

- A local Node.js API server for document, token, upload, and collaboration endpoints.
- A DXF snapshot service that keeps collaboration metadata in a sidecar JSON file.
- An entity checkout collaboration manager with preview broadcasts and commit/release flow.
- A framework-agnostic SDK client plus a React wrapper component.
- A NAVER Maps background layer option for 2D CAD mode in the React editor.
- A worker process that turns uploaded assets into derived metadata.
- A separate file server process that serves files from the shared on-prem storage root.
- Docker Compose files for single-server deployment.

## Quick start

```bash
npm test
npm run start:api
npm run start:worker
npm run start:files
```

## Important directories

- `apps/server/src`: on-prem API and worker entrypoints
- `packages/core/src`: auth, collaboration, document, storage, geometry, worker logic
- `packages/sdk-core/src`: host-facing SDK client
- `packages/sdk-react/src`: React integration component
- `tests`: node-based verification suite

## Storage path configuration

The Docker Compose stack now mounts storage through environment variables instead of a hardcoded `./data:/app/data` binding.

- `WEB_CAD_STORAGE_ROOT_HOST`: host machine storage root
- `WEB_CAD_STORAGE_ROOT_CONTAINER`: container-side mount path

Examples:

```bash
WEB_CAD_STORAGE_ROOT_HOST=./data
```

```bash
WEB_CAD_STORAGE_ROOT_HOST=D:\web-cad-storage
```

You can change the host storage path later to another drive such as `C:` or `D:` by editing the `.env` file and recreating the containers. The API, worker, and file server all read the same shared storage root.

## NAVER Map in 2D CAD mode

When the host app mounts the React editor in `2d-cad` mode, it can enable a NAVER Maps background layer by passing:

```jsx
<CadPointCloudEditor
  baseUrl="http://localhost:4010"
  token={token}
  documentId="survey-1"
  viewMode="2d-cad"
  mapProvider="naver"
  naverMapClientId="YOUR_NCP_CLIENT_ID"
  mapCenter={{ lat: 37.3595704, lng: 127.105399 }}
  mapZoom={16}
/>
```

The integration follows NAVER Maps JavaScript API v3 loading rules using `ncpClientId` and creates the map only when the editor is in 2D CAD mode.
