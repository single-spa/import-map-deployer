FROM canopytax/minimal-node
COPY . /www/
WORKDIR /www
RUN npm install
CMD npm start

