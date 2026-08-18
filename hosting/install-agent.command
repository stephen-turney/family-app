#!/bin/bash
# ---------------------------------------------------------------------------
# Install (or remove) Family Hub's two launchd agents:
#
#   com.familyhub.server  — serves the API *and* client/dist on port 3001,
#                           starts at login, restarts on crash.
#   com.familyhub.backup  — nightly sqlite3 .backup of data.sqlite at 3:17am.
#
#   ./install-agent.command              install both, then verify both work
#   ./install-agent.command --restart     pick up edited server code
#   ./install-agent.command --backup-now  run a backup immediately
#   ./install-agent.command --status      what's loaded, is it answering, last backup
#   ./install-agent.command --uninstall   stop + remove both agents
# ---------------------------------------------------------------------------
set -euo pipefail

SERVER_LABEL='com.familyhub.server'
BACKUP_LABEL='com.familyhub.backup'
PORT=3001
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS="$HOME/Library/LaunchAgents"
DOMAIN="gui/$(id -u)"
BACKUP_SCRIPT="$ROOT/hosting/backup-db.mjs"
NODE=/opt/homebrew/bin/node

BOLD=$'\033[1m'; RESET=$'\033[0m'
GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'
ok()   { echo "${GREEN}✓${RESET} $*"; }
warn() { echo "${YELLOW}!${RESET} $*"; }
die()  { echo "${RED}✗${RESET} $*" >&2; exit 1; }

loaded()  { launchctl print "$DOMAIN/$1" >/dev/null 2>&1; }
answers() { curl -fsS -m 2 "http://localhost:$PORT/api/health" >/dev/null 2>&1; }

# Where backup-db.mjs writes, kept in sync with its own default.
backup_dir() {
  echo "${FAMILYHUB_BACKUP_DIR:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/FamilyHubBackups}"
}

# LAN address to hand to a tablet. Default route, not en0 — this Mac's default
# interface is en14 (same reason start.command does it this way).
lan_ip() {
  local iface
  iface="$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')" || return
  [ -n "$iface" ] && ipconfig getifaddr "$iface" 2>/dev/null
}

# bootout first: bootstrap fails on an already-loaded label, and this is also
# how an edited plist gets picked up.
install_one() {
  local label="$1" src="$ROOT/hosting/$1.plist" dest="$AGENTS/$1.plist"
  [ -f "$src" ] || die "Cannot find $src"
  loaded "$label" && launchctl bootout "$DOMAIN/$label" 2>/dev/null || true
  cp "$src" "$dest"
  launchctl bootstrap "$DOMAIN" "$dest" || die "launchctl bootstrap failed for $dest"
  ok "installed $dest"
}

remove_one() {
  local label="$1" dest="$AGENTS/$1.plist"
  if loaded "$label"; then
    launchctl bootout "$DOMAIN/$label" 2>/dev/null || true
    ok "$label stopped and unloaded"
  else
    warn "$label was not loaded"
  fi
  [ -f "$dest" ] && rm -f "$dest" && ok "removed $dest"
  return 0
}

case "${1:-install}" in
  --status)
    loaded "$SERVER_LABEL" && ok "$SERVER_LABEL is loaded" || warn "$SERVER_LABEL is not loaded"
    answers && ok "answering on port $PORT" || warn "nothing answering on port $PORT"
    loaded "$BACKUP_LABEL" && ok "$BACKUP_LABEL is loaded (nightly, 3:17am)" \
                          || warn "$BACKUP_LABEL is not loaded"
    latest="$(find "$(backup_dir)" -maxdepth 1 -name 'familyhub-*.sqlite.gz' 2>/dev/null | sort | tail -1)"
    if [ -n "$latest" ]; then
      ok "last backup: $(basename "$latest") ($(du -h "$latest" | cut -f1))"
    else
      warn "no backups found in $(backup_dir)"
    fi
    exit 0
    ;;

  --backup-now)
    [ -f "$BACKUP_SCRIPT" ] || die "Cannot find $BACKUP_SCRIPT"
    "$NODE" "$BACKUP_SCRIPT"
    exit 0
    ;;

  --restart)
    loaded "$SERVER_LABEL" || die 'server agent is not installed — run this script with no arguments first'
    # Server code is read once at startup, so an edit to server/src needs this.
    # Client changes only need `npm run build` (dist is read per request).
    launchctl kickstart -k "$DOMAIN/$SERVER_LABEL"
    for _ in $(seq 1 30); do answers && break; sleep 0.5; done
    answers && ok 'restarted' || die "restarted but nothing answered on port $PORT"
    exit 0
    ;;

  --uninstall)
    remove_one "$SERVER_LABEL"
    remove_one "$BACKUP_LABEL"
    echo
    warn "existing backups in $(backup_dir) were left alone"
    exit 0
    ;;

  install) ;;
  *) die "unknown option: $1 (use --restart, --backup-now, --status or --uninstall)" ;;
esac

[ -f "$ROOT/client/dist/index.html" ] || die \
  "No built frontend. Run: cd '$ROOT/client' && npm run build"

# start.command's own server would fight the agent for the port.
if answers && ! loaded "$SERVER_LABEL"; then
  die "Something is already using port $PORT (start.command?). Stop it first."
fi

mkdir -p "$AGENTS" "$ROOT/logs"

install_one "$SERVER_LABEL"
for _ in $(seq 1 20); do answers && break; sleep 0.5; done
answers || { warn "server agent is loaded but nothing answered on port $PORT"
             echo "  Check $ROOT/logs/launchd-server.log"; exit 1; }
ok "Family Hub is running on port $PORT and will start again at login"

install_one "$BACKUP_LABEL"
echo
echo "  Running one backup now to prove it works…"
"$NODE" "$BACKUP_SCRIPT" || die 'the backup script failed — fix that before trusting the schedule'

ip="$(lan_ip || true)"
echo
echo "  On this Mac    ${BOLD}http://localhost:$PORT${RESET}"
[ -n "${ip:-}" ] && \
echo "  On the tablet  ${BOLD}http://$ip:$PORT${RESET}"
echo "  Or by name     ${BOLD}http://$(scutil --get LocalHostName).local:$PORT${RESET}"
echo
echo "  Backups        $(backup_dir)  (nightly 3:17am, 30 days kept)"
echo "  Logs           $ROOT/logs/launchd-{server,backup}.log"
echo "  Stop it all    $0 --uninstall"
