#!/bin/sh
set -eu

auth_base="${AUTH_BASE_URL:-${VITE_AUTH_BASE_URL:-/api/ums}}"
escaped_auth_base=$(printf '%s' "$auth_base" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  AUTH_BASE_URL: "$escaped_auth_base"
};
EOF

exec "$@"
