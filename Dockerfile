FROM node:12.22.11-alpine3.15 as build

COPY package.json /app/build/package.json
COPY yarn.lock /app/build/yarn.lock
WORKDIR /app/build
RUN yarn

COPY . /app/build
RUN npx quasar build

FROM nginx as nginx-branle

COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build/dist/spa /app
