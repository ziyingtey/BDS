# BDS Branch Staff Dashboard

React (Vite) web app for **branch queue operations**: live dashboard, call next, counters (including lunch rules), branch policy, and a **customer queue simulator** — all backed by **`bds_backend`** APIs.

## Local development

1. Start **SQL Server** and run **`bds_backend`** (`dotnet run`). Default API URL: `http://localhost:5062` (see `Properties/launchSettings.json`).
2. Copy env file: `cp .env.example .env.local` and set `VITE_API_BASE_URL` if your API port differs.
3. From this folder: `npm install` then `npm run dev` (default Vite port **5173**).

The backend `appsettings.json` includes CORS for `http://localhost:5173`. If you use another port, add it under `Cors:AllowedOrigins` and restart the API.

You can also change the API URL **in the dashboard** (top bar → **Apply & reload**); it is stored in `localStorage`.

## Production / “real” deployment (not only localhost)

### API (`bds_backend`)

- Host on **Azure App Service**, **IIS**, **Docker**, or any host that runs ASP.NET 8.
- Set **`Cors:AllowedOrigins`** to your **exact** dashboard origin(s), e.g. `https://staff.yourdomain.com` (scheme + host + port, no trailing slash).
- Set **`ConnectionStrings:DefaultConnection`** to your production SQL Server.
- Use a strong **`Jwt:Key`** and lock down **`AllowedHosts`** as needed.
- **Security note:** `api/staff/...` endpoints are **`[AllowAnonymous]`** for FYP demos. For a real bank system, protect them with **staff auth** (JWT / Entra ID) and HTTPS only.

### Dashboard (static site)

- Build: `npm run build` → output in `dist/`.
- Deploy `dist/` to **Azure Static Web Apps**, **Netlify**, **Vercel**, **S3+CloudFront**, or **IIS** as a static site.
- Set build-time variable **`VITE_API_BASE_URL`** to your **public API URL** (e.g. `https://api.yourdomain.com`).
- Ensure the API CORS policy includes that static site’s **origin**.

After deploy, open the staff URL in the browser; the dashboard will call the live API.

## Main API routes used

| Action | Method | Path |
|--------|--------|------|
| Branch list | GET | `/api/branches` |
| Time slots | GET | `/api/branches/{id}/slots` |
| Staff dashboard | GET | `/api/staff/branches/{id}/dashboard` |
| Call next | POST | `/api/staff/branches/{id}/call-next` |
| Counter open/close | PATCH | `/api/staff/branches/{id}/counters/{counterId}` |
| Crowd / booking block | PATCH | `/api/staff/branches/{id}/policy` |
| Simulator join queue | POST | `/api/staff/branches/{id}/simulator/join-queue` |

Simulator uses seeded user `simulator@bds.demo` (created on API startup).

## Lunch / counter policy (backend)

Configured in **`appsettings.json`** → `Staff:LunchPolicy`:

- `MinOpenCounters` — minimum counters that must stay open when rules apply.
- `MaxConcurrentLunchClosures` — max counters closed with “Lunch” at the same time.
- `EnforceMinOpenWhenWaitingExceeds` — if `0`, always enforce min open counters when closing; if e.g. `10`, only enforce when waiting count ≥ 10.
