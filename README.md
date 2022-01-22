# branle

a twitter-like nostr client forked off from https://github.com/arcbtc/nostr.

https://user-images.githubusercontent.com/1653275/149637874-5ae1e400-1de0-42f1-9946-c4cec19347ed.mp4

## Install the dependencies
```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
yarn run lint
```

### Build the app for production
```bash
quasar build
```

## Docker

### Build the docker image
```bash
docker build -t branle .
```

### Run the container
```bash
docker run -d -p 8080:80 --name branle branle
```

### Customize the brand
Edit `customize.json` and replace the colors, icon, name and dark mode setting.
When setting the dark mode, you can also set the colors `"dark-page"` and `"dark"`.
