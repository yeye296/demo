FROM node:24-slim

WORKDIR /tmp

COPY index.js index.html package.json ./

EXPOSE 3000/tcp

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        openssl \
        curl \
        iproute2 \
        coreutils \
        bash \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && chmod +x index.js \
    && npm install

CMD ["node", "index.js"]
