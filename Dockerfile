# Thin stdio proxy for Glama's Dockerfile-based quality checks.
# The actual EDINET DB MCP server runs remotely (streamable HTTP) at
# https://edinetdb.jp/mcp — this image just bridges stdio to that endpoint
# via mcp-remote.
#
# Auth: pass an API key via EDINETDB_API_KEY (get a free key at
# https://edinetdb.jp/developers), or omit it to use the server's OAuth flow.
FROM node:22-alpine
RUN npm install -g mcp-remote@0.1.38
ENTRYPOINT ["/bin/sh", "-c", "if [ -n \"$EDINETDB_API_KEY\" ]; then exec mcp-remote https://edinetdb.jp/mcp --header \"Authorization: Bearer $EDINETDB_API_KEY\"; else exec mcp-remote https://edinetdb.jp/mcp; fi"]
