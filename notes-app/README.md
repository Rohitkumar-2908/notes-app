# Notes App (MERN + JWT + RBAC) with a 3D UI

MongoDB · Express · React (Vite) · Node.js

## Quick start (2 terminals, nothing to configure)

```bash
# Terminal 1 - backend
cd server
npm install
npm run dev          # http://localhost:5050

# Terminal 2 - frontend
cd client
npm install
npm run dev          # http://localhost:5173  <- open this
```

Log in with the admin account that is created automatically on first start:

| Email | Password |
|---|---|
| `admin@example.com` | `Admin@12345` |

(change these in `server/.env` → `ADMIN_EMAIL` / `ADMIN_PASSWORD` **before** the first start, or edit the user later from the Admin page.)

## Where do the JWT secrets come from?

You don't get them from anywhere. A JWT secret is just a long random string that only your server knows; it is used to sign and verify tokens.

The first time the server starts, it **creates `server/.env` for you and fills in two freshly generated random secrets** (`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`). If you ever want to make your own:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Keep them private, never commit `.env`, and use different secrets in production. Changing a secret logs everyone out.

## MongoDB connection

Set `MONGO_URI` in `server/.env`. Pick **one**:

1. **Local MongoDB** (default): `mongodb://127.0.0.1:27017/notes_app`. MongoDB must be installed and running (`mongod`, `brew services start mongodb-community`, or the Windows service).
2. **Docker**: `docker run -d -p 27017:27017 --name mongo mongo:7`, then keep the default URI.
3. **MongoDB Atlas (free cloud)**: create a free cluster → *Database Access*: add a user → *Network Access*: allow your IP (or `0.0.0.0/0` for testing) → *Connect → Drivers*, copy the string:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/notes_app`
   (URL-encode special characters in the password: `@` → `%40`, `#` → `%23`).

**Development safety net:** if MongoDB can't be reached and `NODE_ENV` is not `production`, the server prints exactly why, then falls back to an embedded local MongoDB (data saved in `server/.data`) so the app still runs. The navbar shows a **Local DB** badge when this is active. It needs internet on first use to download a MongoDB binary. Set `MEMORY_FALLBACK=false` to turn it off.

### Troubleshooting
| Symptom | Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running. Start it, use Docker, or use an Atlas URI. |
| `bad auth` / `Authentication failed` | Wrong user/password in the URI, or password not URL-encoded. |
| `querySrv ENOTFOUND` / timeout | Internet/DNS problem, or typo in the Atlas host. |
| Atlas: "could not connect to any servers" | Add your IP in Atlas → Network Access. |
| Port already in use | Change `PORT` in `server/.env` **and** the proxy target in `client/vite.config.js`. (Default is 5050 because macOS uses 5000 for AirPlay.) |
| Navbar shows "API offline" | The backend isn't running or crashed, check terminal 1. |

## Features
- Register / login with **bcrypt**-hashed passwords
- **JWT access token** (15 min, kept in memory) + **refresh token** (7 days, httpOnly cookie, rotated on each use, stored hashed in the DB, reuse detection)
- **RBAC**: roles `user` and `admin`
  - user: create / read / edit / delete **own** notes only
  - admin: everything a user can do, plus any note, add users, change roles, enable/disable, delete users, stats
- Notes: create, edit, delete, pin, tags, search, pagination
- **3D UI**: animated 3D cube scene and perspective grid, tilt-on-hover cards, pressable 3D buttons, 3D page transitions, 3D flip-in popups
- **Popups everywhere**: a floating ＋ button on every page opens page-specific quick actions (New note, Add user, Create account, Help…). Notes open in a popup, deletes/disables ask in a confirm popup, and actions show toasts.
- MVC structure, middleware chaining, central error handling, Mongoose validation, indexes, aggregation pipelines

## Structure
```
server/src
  config/       env.js (dotenv + auto secrets), db.js (mongoose + fallback)
  models/       User.js, Note.js
  controllers/  authController, noteController, adminController
  routes/       authRoutes, noteRoutes, adminRoutes
  middleware/   auth.js (protect + authorize), error.js
  utils/        token.js, AppError.js (+ asyncHandler), ensureAdmin.js
client/src
  api/axios.js  axios instance + single-flight silent token refresh
  context/      AuthContext.jsx, UIContext.jsx (toasts + confirm popups)
  components/   Navbar, Scene3D, Tilt, Modal, Fab, NoteForm, ProtectedRoute
  pages/        Login, Register, Notes, Admin
```

## API

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | cookie |
| POST | `/api/auth/logout` | cookie |
| GET | `/api/auth/me` | logged in |
| GET/POST | `/api/notes` | logged in (`?q=&tag=&page=&limit=`, admin: `&scope=all`) |
| GET/PUT/DELETE | `/api/notes/:id` | owner or admin |
| GET | `/api/admin/stats` | admin |
| GET/POST | `/api/admin/users` | admin |
| PATCH/DELETE | `/api/admin/users/:id` | admin |
| GET | `/api/health` | public (shows DB mode) |

```bash
curl -c jar -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@12345"}' localhost:5050/api/auth/login
curl -H "Authorization: Bearer <accessToken>" localhost:5050/api/notes
```

## Production notes
Set `NODE_ENV=production` (secure cookies, no embedded-DB fallback), serve over HTTPS, use strong secrets, change the default admin password, and add rate limiting on `/api/auth/*` (e.g. `express-rate-limit`). Passwords use `bcryptjs` (pure JS, same algorithm as `bcrypt`).
