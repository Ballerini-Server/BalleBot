###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:16.17-alpine AS development

WORKDIR /usr/src/app

COPY --chown=node:node package-lock.json ./

COPY --chown=node:node . .
RUN npm install

USER node
