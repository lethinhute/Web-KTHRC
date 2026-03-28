#!/bin/sh
set -eu
stamp=$(date +%Y%m%d%H%M%S)
log=/root/deploy-web-kthrc-final.log
exec >"$log" 2>&1

echo "[deploy] start $(date -Iseconds)"
rm -rf /opt/Web-KTHRC.new
mkdir -p /opt/Web-KTHRC.new
tar -xzf /root/web-kthrc-deploy.tar.gz -C /opt/Web-KTHRC.new

if [ -f /opt/Web-KTHRC/database/geiger.db ]; then
  mkdir -p /opt/Web-KTHRC.new/database
  cp /opt/Web-KTHRC/database/geiger.db /opt/Web-KTHRC.new/database/geiger.db
fi

cd /opt/Web-KTHRC.new
npm install --omit=dev --no-audit --no-fund

echo "[deploy] install done $(date -Iseconds)"
pm2 delete rabbitcave >/dev/null 2>&1 || true
pkill -f '/usr/local/bin/node index.js' || true

if [ -d /opt/Web-KTHRC ]; then
  mv /opt/Web-KTHRC /opt/Web-KTHRC.backup-$stamp
fi

mv /opt/Web-KTHRC.new /opt/Web-KTHRC
cd /opt/Web-KTHRC
PORT=5000 pm2 start index.js --name rabbitcave --cwd /opt/Web-KTHRC --interpreter /usr/local/bin/node
pm2 save

code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/ || true)
echo "[deploy] health $code"
echo "[deploy] done $(date -Iseconds)"

touch /root/deploy-web-kthrc-final.done
