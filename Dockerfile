# ---- Builder Stage ----
# Use the full Node image for building; git is required for the sb2md GitHub dependency
FROM node:20-alpine AS builder

RUN apk add --no-cache git

WORKDIR /work

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Drop devDependencies so only production modules are copied to the runtime image
RUN npm prune --production

# ---- Runtime Stage ----
# pandoc/extra is Alpine-based and includes Pandoc + LaTeX for PDF support
FROM pandoc/extra

# Install Node.js and npm (no git needed at runtime)
RUN apk add --no-cache nodejs npm

# Create a non-root user (required by many Kubernetes security policies)
RUN addgroup -S app && adduser -S app -G app

WORKDIR /work

# Copy only the built artifacts and pruned production dependencies
COPY --from=builder --chown=app:app /work/.next       ./.next
COPY --from=builder --chown=app:app /work/public      ./public
COPY --from=builder --chown=app:app /work/node_modules ./node_modules
COPY --from=builder --chown=app:app /work/package.json ./package.json
COPY --from=builder --chown=app:app /work/next.config.js ./next.config.js

# Create uploads directory (override with a tmpfs volume in production for auto-cleanup)
# e.g. in Kubernetes: emptyDir: { medium: Memory } or a dedicated PVC
RUN mkdir -p uploads && chown app:app uploads

USER app

ENV NODE_ENV=production

# Health check used by Kubernetes liveness/readiness probes when not configured in the manifest
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Inherits PORT from the environment; defaults to 3000 (matches package.json start script)
CMD ["npm", "start"]
