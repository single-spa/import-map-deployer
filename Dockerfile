FROM mhart/alpine-node:10
COPY . /www/
WORKDIR /www
ARG container_port=5000
ENV PORT=$container_port
EXPOSE $PORT
RUN yarn install
CMD yarn start