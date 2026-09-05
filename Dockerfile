FROM node:alpine3.20

WORKDIR /tmp

COPY index.js package.json ./

EXPOSE 3000/tcp

RUN apk update && apk upgrade &&\
    apk add --no-cache bash openssl curl gcompat iproute2 coreutils &&\
    chmod +x index.js &&\
    npm install

CMD ["node", "index.js"]
