FROM node:12.22.1 as build

WORKDIR /app/build

COPY . /app/build

RUN yarn \
  && npx quasar build

FROM nginx as nginx-branle

COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build/dist/spa /app
