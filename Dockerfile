FROM canopytax/minimal-node
COPY . /www/
WORKDIR /www
EXPOSE 5000
RUN npm install
CMD npm start

