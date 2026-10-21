#!/bin/sh
# Film X MCP server installer for macOS and Linux:
#
#   curl -fsSL https://filmx.nya.run/mcp/install.sh | sh
#
# Downloads the local MCP server that this Film X site publishes under /mcp/, installs its
# runtime dependencies with npm, and prints the configuration for Claude Desktop and ChatGPT
# Desktop. It changes no agent configuration and uploads nothing. Run it again to update; an
# install also keeps a copy of this script, which updates that folder from the same site:
#
#   sh ~/.film-x-mcp/install.sh
#
#   FILM_X_SITE_URL  Film X site to install from and render with (default: the site the installed
#                    copy recorded, else https://filmx.nya.run/)
#   FILM_X_MCP_HOME  Install folder (default: the installed copy's folder, else ~/.film-x-mcp)
set -eu

DEFAULT_SITE_URL='https://filmx.nya.run/'
MIN_NODE_MAJOR=22
MARKER='.film-x-mcp-install'
SITE_FILE='site-url'

# Run from an install folder (sh <folder>/install.sh): update that folder from its recorded site.
SELF_DIR=''
case "${0##*/}" in
install.sh) if [ -f "$0" ]; then SELF_DIR=$(cd "$(dirname "$0")" && pwd); fi ;;
esac
if [ -n "$SELF_DIR" ] && [ ! -f "$SELF_DIR/$MARKER" ]; then SELF_DIR=''; fi
RECORDED_SITE=''
if [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/$SITE_FILE" ]; then
  RECORDED_SITE=$(cat "$SELF_DIR/$SITE_FILE")
fi

SITE_URL="${FILM_X_SITE_URL:-${RECORDED_SITE:-$DEFAULT_SITE_URL}}"
INSTALL_DIR="${FILM_X_MCP_HOME:-${SELF_DIR:-$HOME/.film-x-mcp}}"
INSTALL_DIR="${INSTALL_DIR%/}"

say() { printf '%s\n' "$*"; }
fail() {
  printf 'film-x-mcp install: %s\n' "$*" >&2
  exit 1
}

browser_found() {
  if [ -n "${FILM_X_BROWSER_PATH:-}" ] && [ -x "$FILM_X_BROWSER_PATH" ]; then return 0; fi
  if [ "$(uname -s)" = Darwin ]; then
    for app in 'Google Chrome' 'Microsoft Edge'; do
      [ -d "/Applications/$app.app" ] || [ -d "$HOME/Applications/$app.app" ] && return 0
    done
  else
    for bin in google-chrome google-chrome-stable microsoft-edge microsoft-edge-stable; do
      command -v "$bin" >/dev/null 2>&1 && return 0
    done
  fi
  return 1
}

# Warns about a missing browser and prints the configuration, which also names the update command.
finish() {
  if ! browser_found; then
    say ''
    say 'Warning: Google Chrome or Microsoft Edge was not found. Install one of them, or set'
    say 'FILM_X_BROWSER_PATH in the agent configuration to another Chromium-based browser.'
  fi

  say ''
  # The server prints the configuration, so paths are escaped right for JSON and TOML.
  FILM_X_SITE_URL="$SITE_URL" "$NODE_BIN" "$INSTALL_DIR/server.mjs" --print-config </dev/null
}

# Everything runs from main, so a download cut short by `curl | sh` executes nothing.
main() {
  case "$SITE_URL" in
  */) ;;
  *) SITE_URL="$SITE_URL/" ;;
  esac
  # Same rule as the server: plain http only for a site on this computer.
  case "$SITE_URL" in
  https://* | http://localhost[:/]* | http://127.0.0.1[:/]* | 'http://[::1]'[:/]*) ;;
  *) fail "FILM_X_SITE_URL must use https (http is only allowed for localhost): $SITE_URL" ;;
  esac

  case "$INSTALL_DIR" in
  /*) ;;
  *) fail "FILM_X_MCP_HOME must be an absolute path: $INSTALL_DIR" ;;
  esac
  if [ "$INSTALL_DIR" = / ] || [ "$INSTALL_DIR" = "$HOME" ] || [ "$INSTALL_DIR" = "$HOME/" ]; then
    fail "Refusing to install into $INSTALL_DIR; choose a dedicated folder."
  fi
  # An existing folder is only replaced when an earlier run of this script created it.
  if [ -e "$INSTALL_DIR" ] && [ ! -f "$INSTALL_DIR/$MARKER" ]; then
    fail "$INSTALL_DIR already exists and was not created by this installer."
  fi

  command -v node >/dev/null 2>&1 ||
    fail "Node.js $MIN_NODE_MAJOR or later is required; install it from https://nodejs.org/."
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]' </dev/null)
  [ "$NODE_MAJOR" -ge "$MIN_NODE_MAJOR" ] ||
    fail "Node.js $MIN_NODE_MAJOR or later is required (found $(node -v))."
  command -v npm >/dev/null 2>&1 || fail "npm is required; it ships with Node.js."
  # Desktop apps do not inherit the shell's PATH, so the config points at the real binary.
  NODE_BIN=$(node -p 'process.execPath' </dev/null)

  if command -v curl >/dev/null 2>&1; then
    fetch() { curl -fsSL --retry 2 -o "$2" "$1" </dev/null; }
  elif command -v wget >/dev/null 2>&1; then
    fetch() { wget -q -O "$2" "$1" </dev/null; }
  else
    fail 'curl or wget is required.'
  fi

  # Staged next to the target so the final move stays on one file system.
  mkdir -p "$(dirname "$INSTALL_DIR")"
  STAGE=$(mktemp -d "$INSTALL_DIR.tmp.XXXXXX")
  trap 'rm -rf "$STAGE"' EXIT
  trap 'exit 130' INT TERM

  download() {
    fetch "${SITE_URL}mcp/$1" "$STAGE/$1" ||
      fail "Could not download ${SITE_URL}mcp/$1. The site must run Film X 0.6.0 or later."
  }

  # The checksums identify a release, so an install that matches them and still starts is current.
  download SHA256SUMS
  CURRENT=''
  if [ -f "$INSTALL_DIR/$MARKER" ]; then
    CURRENT=$("$NODE_BIN" "$INSTALL_DIR/server.mjs" --version </dev/null 2>/dev/null) || CURRENT=''
  fi
  if [ -n "$CURRENT" ] && command -v cmp >/dev/null 2>&1 &&
    cmp -s "$STAGE/SHA256SUMS" "$INSTALL_DIR/SHA256SUMS" </dev/null; then
    printf '%s\n' "$SITE_URL" >"$INSTALL_DIR/$SITE_FILE"
    say "Film X MCP $CURRENT in $INSTALL_DIR is already up to date."
    finish
    return
  fi

  if [ -n "$CURRENT" ]; then
    say "Updating Film X MCP $CURRENT from ${SITE_URL}mcp/"
  else
    say "Downloading the Film X MCP server from ${SITE_URL}mcp/"
  fi
  # The installers stay in the install folder so it can update itself later.
  for file in server.mjs package.json install.sh install.ps1; do
    download "$file"
  done

  if command -v shasum >/dev/null 2>&1; then
    (cd "$STAGE" && shasum -a 256 -c SHA256SUMS >/dev/null) || fail 'The download is corrupted.'
  elif command -v sha256sum >/dev/null 2>&1; then
    (cd "$STAGE" && sha256sum -c SHA256SUMS >/dev/null) || fail 'The download is corrupted.'
  else
    say 'Warning: no SHA-256 tool found, so the download was not verified.'
  fi

  say 'Installing dependencies with npm'
  (cd "$STAGE" && npm install --omit=dev --no-audit --no-fund --loglevel=error \
    </dev/null >/dev/null) || fail 'npm install failed; check the network connection and run this again.'

  VERSION=$("$NODE_BIN" "$STAGE/server.mjs" --version </dev/null) ||
    fail 'The downloaded server does not start with this Node.js.'
  : >"$STAGE/$MARKER"
  printf '%s\n' "$SITE_URL" >"$STAGE/$SITE_FILE"

  if [ -e "$INSTALL_DIR" ]; then
    OLD="$INSTALL_DIR.old.$$"
    mv "$INSTALL_DIR" "$OLD"
    mv "$STAGE" "$INSTALL_DIR"
    rm -rf "$OLD"
  else
    mv "$STAGE" "$INSTALL_DIR"
  fi

  say ''
  if [ -n "$CURRENT" ]; then
    say "Film X MCP is updated from $CURRENT to $VERSION in $INSTALL_DIR"
  else
    say "Film X MCP $VERSION is installed in $INSTALL_DIR"
  fi
  finish
}

main "$@"
