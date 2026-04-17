# GameHub

## LAN admin mode

1. Start LAN sessions server:

```bash
ADMIN_SECRET="your-strong-secret" npm run lan:server
```

2. Run frontend:

```bash
npm run dev
```

3. If admin page is opened from another device in local network, set server URL:

```bash
VITE_LAN_SERVER_URL=http://<LAN-IP>:8787 npm run dev
```

4. Open `/admin` and top up any active session.
5. In `/admin`, enter the same secret from `ADMIN_SECRET`.

## Internet access with secret

1. Expose server ports from your host/router:
- `5173` for frontend
- `8787` for LAN session API
2. Use your public IP / domain on admin device.
3. Start frontend with API URL that points to public host:

```bash
VITE_LAN_SERVER_URL=http://<PUBLIC-IP-OR-DOMAIN>:8787 npm run dev -- --host 0.0.0.0
```

4. Open `http://<PUBLIC-IP-OR-DOMAIN>:5173/admin` and enter secret.
