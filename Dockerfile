FROM node:16.16.0-alpine3.16 as build

COPY package.json /app/build/package.json
COPY yarn.lock /app/build/yarn.lock
WORKDIR /app/build
# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk --no-cache --virtual build-dependencies add \
  python3 \
  make \
  g++ \
  && yarn \
  && apk del build-dependencies

COPY . /app/build
RUN npx quasar build

FROM nginx as nginx-astral

COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build/dist/spa /app
