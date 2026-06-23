FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend FIRST
RUN cd artifacts/enygma && pnpm run build

# Build API server
RUN cd artifacts/api-server && node ./build.mjs

# Expose port
EXPOSE 10000

# Ensure frontend is built and accessible
ENV PORT=10000
ENV NODE_ENV=production

# Start API server
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
