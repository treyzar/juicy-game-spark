# GameHub

## LAN admin mode

1. Start LAN sessions server:

```bash
npm run lan:server
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
