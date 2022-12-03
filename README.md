# astral

[astral](https://astral.ninja) is a web client for interacting with [Nostr](https://github.com/fiatjaf/nostr), a protocol that attempts to make decentralized social media a reality. astral began as a fork of [Branle](https://github.com/fiatjaf/branle).

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
# or if quasar is not installed globally
./node_modules/.bin/quasar dev
```

### Lint the files
```bash
yarn lint
# or
npm run lint
```
### Format the files
```bash
yarn format
# or
npm run format
```

### Build the app for production in PWA mode:
```bash
quasar build -m pwa
# or if quasar is not installed globally
./node_modules/.bin/quasar build -m pwa
```

### Build the app for production in SPA mode:
```bash
quasar build
# or if quasar is not installed globally
./node_modules/.bin/quasar build
```

## Docker

### Build the docker image (uses PWA mode):
```bash
docker build -t astral .
```

### Run the container:
```bash
docker run -d -p 8080:8000 --name astral astral
```

and connect to 'http://localhost:8080/'
