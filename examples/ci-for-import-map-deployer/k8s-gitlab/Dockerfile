FROM singlespa/import-map-deployer

ENV HTTP_USERNAME= HTTP_PASSWORD= DEV_IMPORT_MAP_URL= STAGE_IMPORT_MAP_URL= PROD_IMPORT_MAP_URL=

COPY conf.js /www/

CMD ["yarn", "start", "conf.js"]
