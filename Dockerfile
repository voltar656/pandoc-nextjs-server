FROM pandoc/extra

# Install Node.js 20 (native Alpine package now supports modern versions)
RUN apk add --no-cache nodejs npm git

# Verify versions
RUN echo "node $(node -v)" && \
    echo "npm v$(npm -v)" && \
    echo "$(pandoc --version | head -1)"

WORKDIR /work

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

ENTRYPOINT []
CMD ["npm", "start"]
EXPOSE 3000
