FROM node:10-alpine as build
WORKDIR /www
COPY package.json yarn.lock ./
RUN yarn install  --production --frozen-lockfile
COPY . /www/

FROM node:10-alpine as release
USER node
ARG container_port=5000
ENV PORT=$container_port
ENV NODE_ENV=production
EXPOSE $PORT
WORKDIR /www
COPY --from=build --chown=root:root /www /www
CMD ["node", "src/web-server.js"]
