# battle-fish

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

## License Integration

The app now validates license against your CI4 API using the existing field in
`Configuracoes do Sistema`.

### Dev setup

Create `.env` in project root:

```bash
LICENSE_API_BASE_URL=http://127.0.0.1:8080/api/v1
LICENSE_API_KEY=SUA_API_KEY_DO_APP_BATTLEFISH
LICENSE_VALIDATE_INTERVAL_MS=900000
LICENSE_REQUIRE_SIGNED_TOKEN=true
LICENSE_ALLOW_OFFLINE_TOKEN=true
LICENSE_PUBLIC_KEY_TTL_MS=21600000
LICENSE_TOKEN_CLOCK_SKEW_SECONDS=30
```

### Build setup

For packaged `.exe`, copy:

- `resources/license-config.example.json` -> `resources/license-config.json`

Fill API URL/key and build again.

Optional flags (JSON and `.env`):

- `LICENSE_REQUIRE_SIGNED_TOKEN`: requires `license_token` and local signature validation.
- `LICENSE_ALLOW_OFFLINE_TOKEN`: allows `ACTIVE_OFFLINE` when API is unreachable and cached token is still valid.
- `LICENSE_PUBLIC_KEY_TTL_MS`: public key cache TTL.
- `LICENSE_TOKEN_CLOCK_SKEW_SECONDS`: tolerated clock skew for `nbf/exp`.

Config loading priority:

1. System environment variables
2. `.env` files
3. `license-config.json` (next to `.exe` or inside `resources/`)

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
