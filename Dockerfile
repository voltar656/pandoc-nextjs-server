FROM pandoc/extra

# Install specific Node.js version compatible with old Next.js
RUN apk add --no-cache bash curl git

# Install Node.js 18 via unofficial builds (Alpine compatible)
RUN apk add --no-cache nodejs=~18 npm || \
    (wget -qO- https://unofficial-builds.nodejs.org/download/release/v18.19.0/node-v18.19.0-linux-x64-musl.tar.gz | tar xz -C /usr/local --strip-components=1)

RUN echo node `node -v` && \
    echo npm v`npm -v` && \
    echo `git --version` && \
    echo `pandoc --version | head -1`

RUN mkdir -p /work/uploads
COPY . /work
RUN chmod 755 /work/uploads

# Set OpenSSL legacy provider for older webpack
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN cd /work && npm ci --legacy-peer-deps
RUN cd /work && npm run build
WORKDIR /work
ENTRYPOINT []
CMD ["npm", "run", "start"]
EXPOSE 3000
