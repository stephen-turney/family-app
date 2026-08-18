#!/bin/bash
#
# Family Hub launcher — double-click this file in Finder (or run it from a shell)
# to bring up both halves of the app:
#
#   • API    server/  → http://localhost:3001   (node src/index.js)
#   • Web    client/  → http://localhost:5173   (vite dev server)
#
# It installs missing dependencies, waits until each side actually answers a
# request before reporting it up, opens the app in your browser, then streams
# both logs into this window. Ctrl-C (or closing the window) stops both.
#
# Flags:  --no-browser   don't open a browser tab
#         --local-only   bind the web server to this Mac only (no phones/tablets)
#         --help
#
# Ports are fixed rather than configurable: client/vite.config.js hardcodes the
# /api proxy target to localhost:3001, so a port override here would start the
# app in a state where the frontend can't reach the backend.

set -u

API_PORT=3001
WEB_PORT=5173
OPEN_BROWSER=1
EXPOSE_LAN=1

# Double-clicking runs this with $HOME as the working directory, so anchor
# everything to the script's own location.
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"

# Finder-launched shells can have a leaner PATH than an interactive terminal;
# make sure the usual Homebrew / local install prefixes are searchable.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

for arg in "$@"; do
  case "$arg" in
    --no-browser) OPEN_BROWSER=0 ;;
    --local-only) EXPOSE_LAN=0 ;;
    -h|--help)
      # Print the header comment block (skipping the shebang), minus the '# '.
      awk 'NR>2 && /^#/ { sub(/^# ?/, ""); print; next } NR>2 { exit }' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'
  YELLOW=$'\033[33m'; BLUE=$'\033[34m'; MAGENTA=$'\033[35m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; GREEN=''; RED=''; YELLOW=''; BLUE=''; MAGENTA=''; RESET=''
fi

ok()   { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
err()  { printf '  %s✗%s %s\n' "$RED" "$RESET" "$1" >&2; }
step() { printf '  %s·%s %s\n' "$DIM" "$RESET" "$1"; }

# Keep the window readable when Finder launched us and something went wrong.
die() {
  err "$1"
  shift
  for line in "$@"; do printf '    %s\n' "$line" >&2; done
  if [ -t 0 ]; then
    printf '\n%sPress Return to close this window.%s ' "$DIM" "$RESET"
    read -r _
  fi
  exit 1
}

SERVER_PID=''
CLIENT_PID=''

# Only processes we started ourselves get cleaned up — if the API was already
# running when we launched, it keeps running after we exit.
cleanup() {
  trap - INT TERM HUP EXIT
  # Nothing of ours is up (e.g. a preflight failure) — exit quietly.
  [ -z "$SERVER_PID$CLIENT_PID" ] && return 0
  printf '\n%sStopping Family Hub…%s\n' "$DIM" "$RESET"
  # Backstop so closing the window can never hang on a process that ignores
  # SIGTERM; normally both exit in well under a second and this never fires.
  ( sleep 5; kill -9 $CLIENT_PID $SERVER_PID 2>/dev/null ) >/dev/null 2>&1 &
  watchdog=$!
  for pid in $CLIENT_PID $SERVER_PID; do
    kill "$pid" 2>/dev/null
    # wait does double duty: reaps the child, and stops bash from printing its
    # own "Terminated: 15" job notice over our output.
    wait "$pid" 2>/dev/null
  done
  # Retire the backstop now that both are reaped, so it can't outlive us and
  # SIGKILL an unrelated process that inherited a recycled PID.
  kill "$watchdog" 2>/dev/null
  wait "$watchdog" 2>/dev/null
  ok 'Stopped.'
}
# HUP matters as much as INT here: closing the Terminal window sends SIGHUP, and
# without it bash would die without ever running the EXIT trap, leaving both
# node processes holding their ports.
#
# Signals exit straight after cleaning up — otherwise control returns to the
# monitor loop at the bottom, which sees the just-killed PIDs and misreports a
# deliberate Ctrl-C as "stopped unexpectedly".
trap 'cleanup; exit 0' INT TERM HUP
trap cleanup EXIT

printf '\n%s▶ Family Hub%s %s%s%s\n\n' "$BOLD" "$RESET" "$DIM" "$ROOT" "$RESET"

# ---------------------------------------------------------------------------
# Preflight: node, project layout, dependencies
# ---------------------------------------------------------------------------
command -v node >/dev/null 2>&1 || die 'Node.js not found on PATH.' \
  'Install it with:  brew install node' \
  'Family Hub needs Node 22 or newer (it uses the built-in node:sqlite module).'

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 22 ]; then
  die "Node $NODE_MAJOR is too old — Family Hub needs Node 22+ for node:sqlite." \
    'Upgrade with:  brew upgrade node'
fi

[ -f server/src/index.js ] || die 'Cannot find server/src/index.js.' \
  "Expected to be sitting in the family-app folder, but I'm in: $ROOT"
[ -f client/vite.config.js ] || die 'Cannot find client/vite.config.js.' \
  "Expected to be sitting in the family-app folder, but I'm in: $ROOT"

install_deps() {
  # $1 = directory, $2 = label
  if [ -d "$1/node_modules" ]; then
    return 0
  fi
  step "Installing $2 dependencies (first run — this takes a minute)…"
  ( cd "$1" && npm install --no-audit --no-fund ) || \
    die "npm install failed in $1/." 'Fix the error above, then launch again.'
  ok "$2 dependencies installed"
}
install_deps server 'server' || exit 1
install_deps client 'client' || exit 1

mkdir -p "$ROOT/logs"
SERVER_LOG="$ROOT/logs/server.log"
CLIENT_LOG="$ROOT/logs/client.log"
: > "$SERVER_LOG"
: > "$CLIENT_LOG"

# ---------------------------------------------------------------------------
# Port / readiness helpers
# ---------------------------------------------------------------------------
port_holder() { lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null | head -1; }
api_answers() { curl -sf -m 2 "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1; }
web_answers() { curl -sf -m 2 -o /dev/null "http://127.0.0.1:$WEB_PORT/" 2>/dev/null; }

# Poll until a check passes, failing fast if the process we're waiting on dies.
# $1 = check fn, $2 = pid to watch ('' to skip), $3 = log file, $4 = label
wait_ready() {
  check="$1"; pid="$2"; logfile="$3"; label="$4"
  tries=120   # ×0.5s = 60s ceiling; cold Vite starts are usually well under 2s
  while [ "$tries" -gt 0 ]; do
    if "$check"; then
      return 0
    fi
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      printf '\n'
      err "The $label exited during startup. Last lines of $logfile:"
      printf '%s\n' "$DIM"; tail -n 20 "$logfile" >&2; printf '%s' "$RESET"
      return 1
    fi
    sleep 0.5
    tries=$((tries - 1))
  done
  printf '\n'
  err "The $label never became ready (60s). Last lines of $logfile:"
  printf '%s\n' "$DIM"; tail -n 20 "$logfile" >&2; printf '%s' "$RESET"
  return 1
}

# ---------------------------------------------------------------------------
# API server
# ---------------------------------------------------------------------------
if api_answers; then
  warn "API already running on port $API_PORT — reusing it (won't be stopped on exit)"
else
  holder="$(port_holder "$API_PORT")"
  if [ -n "$holder" ]; then
    die "Port $API_PORT is taken by PID $holder, which isn't the Family Hub API." \
      "See what it is:  lsof -i tcp:$API_PORT" \
      "Stop it with:    kill $holder"
  fi
  step "Starting API on port ${API_PORT}…"
  # Run node directly rather than through `npm start` so we own a single PID we
  # can reliably signal (npm would leave the real server orphaned on Ctrl-C).
  # Clean text to the log file, prefixed + colored to this window.
  ( cd server && exec node src/index.js ) \
    > >(tee -a "$SERVER_LOG" | sed -l "s/^/${BLUE}[api]${RESET}    /") 2>&1 &
  SERVER_PID=$!
  wait_ready api_answers "$SERVER_PID" "$SERVER_LOG" 'API server' || die 'API server failed to start.'
fi
ok "API    ${BOLD}http://localhost:$API_PORT${RESET}"

# ---------------------------------------------------------------------------
# Web (Vite dev server)
# ---------------------------------------------------------------------------
if web_answers; then
  warn "Something is already serving port $WEB_PORT — reusing it (won't be stopped on exit)"
else
  holder="$(port_holder "$WEB_PORT")"
  if [ -n "$holder" ]; then
    die "Port $WEB_PORT is taken by PID $holder, which isn't answering as a web server." \
      "See what it is:  lsof -i tcp:$WEB_PORT" \
      "Stop it with:    kill $holder"
  fi
  step "Starting web app on port ${WEB_PORT}…"
  # --host binds all interfaces so phones/tablets on the home network can use
  # the hub too (the /api proxy runs on this Mac, so it keeps working).
  VITE_ARGS=''
  [ "$EXPOSE_LAN" -eq 1 ] && VITE_ARGS='--host'
  ( cd client && exec node node_modules/vite/bin/vite.js $VITE_ARGS ) \
    > >(tee -a "$CLIENT_LOG" | sed -l "s/^/${MAGENTA}[web]${RESET}    /") 2>&1 &
  CLIENT_PID=$!
  wait_ready web_answers "$CLIENT_PID" "$CLIENT_LOG" 'web app' || die 'Web app failed to start.'
fi
ok "App    ${BOLD}http://localhost:$WEB_PORT${RESET}"

if [ "$EXPOSE_LAN" -eq 1 ]; then
  # Ask the routing table which interface actually reaches the network — en0 is
  # a bad guess (this Mac's default route is en14; Ethernet/VPN/dock adapters
  # all shuffle the numbering).
  LAN_IF="$(route -n get default 2>/dev/null | awk '/interface:/ { print $2; exit }')"
  LAN_IP=''
  [ -n "$LAN_IF" ] && LAN_IP="$(ipconfig getifaddr "$LAN_IF" 2>/dev/null || true)"
  [ -n "$LAN_IP" ] && ok "Phones/tablets:  ${BOLD}http://$LAN_IP:$WEB_PORT${RESET}"
fi

if [ "$OPEN_BROWSER" -eq 1 ]; then
  open "http://localhost:$WEB_PORT" 2>/dev/null && ok 'Opened in your browser'
fi

printf '\n%sBoth running. Logs below — Ctrl-C or close this window to stop.%s\n' "$DIM" "$RESET"
printf '%sFull logs: logs/server.log · logs/client.log%s\n\n' "$DIM" "$RESET"

# Park here so the trap stays live and both log streams keep flowing. If either
# process dies on its own, report it and tear the other one down too.
while :; do
  for pid in $SERVER_PID $CLIENT_PID; do
    if ! kill -0 "$pid" 2>/dev/null; then
      printf '\n'
      if [ "$pid" = "$SERVER_PID" ]; then
        err 'The API server stopped unexpectedly — see logs/server.log.'
      else
        err 'The web app stopped unexpectedly — see logs/client.log.'
      fi
      exit 1
    fi
  done
  # Nothing we started (both sides pre-existing): stay parked quietly.
  sleep 1
done
