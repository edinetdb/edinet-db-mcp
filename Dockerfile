# Runs the EDINET DB MCP server (stdio) from this repository.
#
#   docker build -t edinet-db-mcp .
#   docker run -i --rm -e EDINETDB_API_KEY=your-key edinet-db-mcp
#
# Get a free API key at https://edinetdb.jp/developers
# Listing tools works without a key; calling them does not.

FROM node:22-alpine

WORKDIR /app

# Install dependencies from the committed lockfile so builds are reproducible.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./

# The MCP transport is stdio, so the container must be run with -i.
ENTRYPOINT ["node", "/app/server.js"]
