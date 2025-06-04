#!/bin/bash

# Start the API server and run REST API tests automatically
# This avoids having to start the server manually before running tests.

PORT=${PORT:-3000}
LOG_FILE="/tmp/test-server.log"

node src/app.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
for i in {1..20}; do
  if curl -s http://localhost:$PORT/ > /dev/null; then
    break
  fi
  sleep 1
done

node test-api-fase2.js
TEST_EXIT=$?

kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

exit $TEST_EXIT
