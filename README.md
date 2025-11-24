# Brainrot Notifier API

A lightweight API that receives Roblox notifier payloads, stores them in-memory for 3 minutes, and optionally mirrors the data to a Discord webhook. Designed for Roblox Brainrot notifier + joiner pipelines.

## 🚀 Features

- **Notifier Ingestion**: Roblox scripts POST directly to `/api/notify`
- **Optional Discord Relay**: Stores entries and mirrors to a Discord webhook for alerts
- **Temporary Storage**: Keeps entries in memory for 3 minutes
- **Auto-Cleanup**: Removes expired entries every 30 seconds
- **Duplicate Prevention**: Updates existing entries by jobId
- **Value Parsing & Formatting**: Handles values such as "$2.2M/s"
- **RESTful API**: Endpoints for fetching, filtering, and deleting servers
- **Admin Dashboard**: Real-time web dashboard for monitoring servers
- **Security**: API key authentication and rate limiting

## 📋 Prerequisites

- Node.js 16+ installed
- Discord webhook URL
- API key for authentication

## 🛠️ Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   Edit `.env` and set:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN
   API_KEY=your-secret-api-key-here
   PORT=3000
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_WEBHOOK_URL` | Discord webhook to forward notifications (optional) | _Not set_ |
| `API_KEY` | Secret key for API authentication | Required |
| `PORT` | Server port | 3000 |
| `EXPIRATION_TIME` | Server expiration time (ms) | 180000 (3 min) |
| `CLEANUP_INTERVAL` | Cleanup task interval (ms) | 30000 (30 sec) |

### Getting Discord Webhook URL

1. Go to your Discord server settings
2. Navigate to **Integrations** → **Webhooks**
3. Create a new webhook or use existing one
4. Copy the webhook URL
5. Format: `https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN`

Discord webhook is optional—if omitted, the API simply stores data for joiners.

## 🚀 Running the Server

### Development
```bash
npm start
```

### Production
```bash
NODE_ENV=production npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📡 API Endpoints

All protected endpoints require the `X-API-Key` header.

### Health Check
```
GET /api/health
```
No authentication required. Returns server health status.

### Send Notification
```
POST /api/notify
Headers: 
  X-API-Key: your-api-key
  Content-Type: application/json
```
**Body:**
```json
{
  "displayName": "To To To Sahur",
  "value": 2200000,
  "valueFormatted": "$2.2M/s",
  "mutation": "Gold",
  "rarity": "Secret",
  "players": "6/8",
  "jobId": "af50fd9a-bee7-42fb-b9d6-db85d533a425",
  "placeId": 109983668079237,
  "teleportScript": "TeleportToPlaceInstance(12345, \"job-id\")"
}
```
**Response:**
```json
{
  "message": "Notification stored",
  "server": {
    "...": "stored server object (same as GET /api/servers)"
  }
}
```

### Get All Servers
```
GET /api/servers
Headers: X-API-Key: your-api-key
```
Returns all active (non-expired) servers.

**Response:**
```json
[
  {
    "id": "1234567890-job-id",
    "displayName": "Pet Name",
    "value": 2200000,
    "valueFormatted": "$2.2M/s",
    "mutation": "Gold",
    "rarity": "Secret",
    "players": "6/8",
    "jobId": "af50fd9a-bee7-42fb-b9d6-db85d533a425",
    "placeId": 109983668079237,
    "messageId": "discord-message-id",
    "timestamp": 1234567890000,
    "expiresAt": 1234568070000
  }
]
```

### Filter Servers by Value
```
GET /api/servers/filter?minValue=2000000
Headers: X-API-Key: your-api-key
```
Returns servers with value >= minValue.

### Get Server by Job ID
```
GET /api/servers/:jobId
Headers: X-API-Key: your-api-key
```
Returns specific server or 404 if not found/expired.

### Delete Server
```
DELETE /api/servers/:jobId
Headers: X-API-Key: your-api-key
```
Removes server from storage (useful when user joins).

### Get Statistics
```
GET /api/stats
Headers: X-API-Key: your-api-key
```
Returns API statistics.

**Response:**
```json
{
  "totalFound": 150,
  "totalExpired": 120,
  "active": 30,
  "uptime": 3600,
  "uptimeFormatted": "1h 0m"
}
```


## 🎨 Admin Dashboard

Access the dashboard at `http://localhost:3000/`

**Features:**
- Real-time server list with countdown timers
- Filter by minimum value (1M+, 2M+, 5M+, 10M+)
- Search by pet name
- Sort by value, time, or rarity
- Statistics display
- Auto-refresh every 5 seconds
- Dark theme UI

**Note**: You'll be prompted for the API key when accessing the dashboard.

## 📦 Deployment to Render.com

### Step 1: Prepare Repository
1. Push your code to GitHub/GitLab
2. Ensure `.env.example` is included (not `.env`)

### Step 2: Create Render Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your repository
4. Configure:
   - **Name**: `brainrot-notifier-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Paid

### Step 3: Set Environment Variables
In Render dashboard, go to **Environment** tab and add:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
API_KEY=your-secret-api-key
PORT=3000
EXPIRATION_TIME=180000
CLEANUP_INTERVAL=30000
```

### Step 4: Deploy
Click **Create Web Service** and wait for deployment.

Your API will be available at `https://your-service.onrender.com`

## 🔍 Discord Notification Format

When `DISCORD_WEBHOOK_URL` is configured, each `/api/notify` call is mirrored to your Discord server using this embed:

```json
{
  "username": "JX-NOTIFIER",
  "embeds": [{
    "title": "🔔 Brainrot Found!",
    "fields": [
      {"name": "🐾 Brainrot", "value": "Pet Name"},
      {"name": "💰 Value", "value": "$2.2M/s"},
      {"name": "✨ Mutation", "value": "Gold"},
      {"name": "👥 Players", "value": "6/8"},
      {"name": "🎯 Rarity", "value": "Secret"},
      {"name": "🆔 Job ID", "value": "```job-id-here```"},
      {"name": "🚀 Teleport Script", "value": "```lua\nscript here```"}
    ]
  }]
}
```

## 🐛 Troubleshooting

### `/api/notify` returning 401/403

**Problem**: API key missing or incorrect.

**Solutions**:
1. Ensure `X-API-Key` header is included in every request.
2. Verify the key matches the one in `.env` / Render dashboard.
3. Restart the service after updating environment variables.

### No Servers Appearing

**Problem**: `/api/servers` returns empty array.

**Check**:
1. Roblox notifier is POSTing to `/api/notify` successfully (check server logs).
2. Payload includes required fields: `displayName`, `jobId`, `placeId`.
3. Values exceed your client filter (e.g., `MIN_VALUE_THRESHOLD` in Roblox script).
4. Entries older than 3 minutes are automatically removed—ensure fresh data exists.

### Memory Issues

**Problem**: Server using too much memory.

**Solutions**:
1. Reduce `EXPIRATION_TIME` (shorter lifetime per entry).
2. Reduce notifier frequency if duplicates are flooding the API.
3. Monitor `[EXPIRE]` logs to ensure cleanup is running.

## 📝 Logging

The API includes comprehensive logging:

- `[API]` - Incoming API requests
- `[STORE]` - Storage operations
- `[EXPIRE]` - Expiration cleanup
- `[ERROR]` - Errors with details
- `[INFO]` - General information

## 🔒 Security Considerations

1. **API Key**: Use a strong, random API key
2. **Environment Variables**: Never commit `.env` to version control
3. **Rate Limiting**: Configured at 60 req/min per IP
4. **CORS**: Currently allows all origins (adjust for production)
5. **Input Validation**: All inputs are sanitized

## 📄 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

Contributions welcome! Please ensure:
- Code follows existing style
- All features are tested
- Documentation is updated

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Check Discord webhook permissions

---

**Made for Roblox Brainrot Notifier System** 🔔

