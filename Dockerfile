FROM mhart/alpine-node:10
COPY . /www/
WORKDIR /www
EXPOSE 5000
RUN yarn install
CMD yarn start