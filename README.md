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
./node_modules/.bin/quasar dev
```

### Lint the files
```bash
yarn run lint
```
### Format the files
```bash
yarn format
# or
npm run format
```

### Build the app for production
```bash
./node_modules/.bin/quasar build
```

## Docker

### Build the docker image
```bash
docker build -t astral .
```

### Run the container
```bash
docker run -d -p 8080:8000 --name astral astral
```

and connect to 'http://localhost:8080/'

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js).
