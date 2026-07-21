#!/usr/bin/env bash
set -euo pipefail

release_id="${1:?release id is required}"
api_release="/opt/life7-api/releases/${release_id}"
web_release="/var/www/life7/releases/${release_id}"

if ! getent passwd life7 >/dev/null; then
  useradd --system --home /nonexistent --shell /usr/sbin/nologin life7
fi

install -d -m 0755 /opt/life7-api/releases "$api_release"
tar -xzf /tmp/life7-api.tgz -C "$api_release"
chown -R root:root "$api_release"
cd "$api_release"
npm ci --omit=dev --registry=https://registry.npmjs.org/
ln -sfn "$api_release" /opt/life7-api/current

install -d -m 0750 -o root -g life7 /etc/life7
if [[ ! -f /etc/life7/api.env ]]; then
  umask 0027
  safety_salt="$(openssl rand -hex 32)"
  echo "LIFE7_SAFETY_SALT=${safety_salt}" > /etc/life7/api.env
  chown root:life7 /etc/life7/api.env
  chmod 0640 /etc/life7/api.env
fi

install -m 0644 /tmp/life7-api.service /etc/systemd/system/life7-api.service
systemctl daemon-reload
systemctl enable --now life7-api.service

install -d -m 0755 "$web_release"
tar -xzf /tmp/life7-web.tgz -C "$web_release"
chown -R www-data:www-data "$web_release"
ln -sfn "$web_release" /var/www/life7/current

install -m 0644 /tmp/nginx-life7.conf /etc/nginx/sites-available/life7.maxdesign.rs
nginx -t
systemctl reload nginx

curl --fail --silent --show-error http://127.0.0.1:8787/api/health
