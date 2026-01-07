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

# Create uploads directory (mount as tmpfs in production for auto-cleanup)
# Use: docker run --tmpfs /work/uploads:rw,noexec,nosuid,size=512m ...
RUN mkdir -p uploads && chmod 755 uploads

# Health check for orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT []
CMD ["npm", "start"]
EXPOSE 3000
