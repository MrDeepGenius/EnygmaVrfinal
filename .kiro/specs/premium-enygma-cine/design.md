# Design Document: Premium Enygma Cine

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Premium Page    │      │  Admin Panel     │            │
│  │  - Form Input    │      │  - User List     │            │
│  │  - Benefits      │      │  - Toggles       │            │
│  │  - Pricing       │      │  - Requests      │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                      │
│           └──────────┬──────────────┘                       │
│                      ▼                                      │
│            ┌──────────────────────┐                        │
│            │  Ad_Manager System   │                        │
│            │  - Check Premium     │                        │
│            │  - Show/Hide Ads     │                        │
│            └──────────┬───────────┘                        │
│                       │                                    │
└───────────────────────┼────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │   API   │   │ Telegram │   │  Google  │
    │ Server  │   │   Bot    │   │  Sheets  │
    │         │   │          │   │          │
    └────┬────┘   └────┬─────┘   └────┬─────┘
         │             │              │
         └─────────────┼──────────────┘
                       ▼
            ┌──────────────────────┐
            │  Premium_Storage     │
            │  (Google Sheets)     │
            │                      │
            │  - usuario           │
            │  - nombre            │
            │  - estado_premium    │
            │  - sin_publicidades  │
            │  - timestamp         │
            └──────────────────────┘
```

## Data Model

### Premium_Storage (Google Sheets)

| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique identifier (UUID) |
| usuario | String | Username del usuario |
| nombre | String | Nombre completo del usuario |
| email | String | Email de contacto |
| estado_premium | Boolean | true = Premium, false = No Premium |
| sin_publicidades | Boolean | true = Sin ads, false = Con ads |
| metodo_pago | String | "transferencia" o "crypto" |
| timestamp_solicitud | DateTime | Cuando se hizo la solicitud |
| timestamp_aprobacion | DateTime | Cuando fue aprobado (null si pendiente) |
| aprobado_por | String | Username del admin que aprobó |
| notas | String | Notas adicionales del admin |
| activo | Boolean | true = Activo, false = Desactivado |

### Session Premium Cache (Client-side)

```typescript
interface PremiumStatus {
  usuario: string;
  isPremium: boolean;
  sinPublicidades: boolean;
  lastUpdated: number; // timestamp
}
```

## Component Architecture

### Frontend Components

#### 1. PremiumPage (NEW)
- **Location:** `/src/pages/premium.tsx`
- **Props:** None
- **State:**
  - `nombre`: string
  - `usuario`: string
  - `metodo_pago`: "transferencia" | "crypto"
  - `isSubmitting`: boolean
  - `success`: boolean
  - `error`: string | null

**Responsibilities:**
- Display Premium benefits and pricing
- Show form for nombre + usuario
- Display payment instructions
- Send form submission to API

#### 2. Ad_Manager (MODIFIED)
- **Location:** `/src/lib/ad-manager.ts`
- **Responsibilities:**
  - Check user's Premium status
  - Determine if ads should be shown
  - Cache Premium status locally
  - Handle auto-refresh every 30 seconds

**Key Methods:**
```typescript
checkAdVisibility(userId: string): Promise<boolean>
getPremiumStatus(): PremiumStatus | null
invalidateCache(): void
subscribeToStatusChanges(callback: (status: PremiumStatus) => void): void
```

#### 3. Ad Components (MODIFIED)
- **Locations:** 
  - `/src/components/ads-banner-300x250.tsx`
  - `/src/components/ads-banner-full.tsx`
  - Any other ad component

**Modification:**
```typescript
// Before rendering ad
const { sinPublicidades } = await Ad_Manager.getPremiumStatus();
if (sinPublicidades) return null; // Don't render ad
return <Ad... />; // Render normally
```

#### 4. AdminPanel - Premium Section (NEW)
- **Location:** `/src/pages/admin.tsx` (extend existing)
- **Tab:** "Premium" (alongside existing admin tabs)
- **Sections:**
  - **Solicitudes Pendientes**
    - List of unapproved requests
    - Approve button (→ mark as premium)
    - Reject button (→ delete request)
  
  - **Usuarios Premium**
    - List of approved premium users
    - Toggle "Sin publicidades" per user
    - Remove Premium button
    - View request details (timestamp, payment method)

**State:**
```typescript
interface AdminPremiumState {
  pendingRequests: PremiumRequest[];
  premiumUsers: PremiumUser[];
  loading: boolean;
  error: string | null;
  selectedUser: PremiumUser | null;
}
```

### Backend Architecture

#### 1. New API Endpoints

**POST /api/premium/request**
```json
{
  "usuario": "string",
  "nombre": "string",
  "email": "string?",
  "metodo_pago": "transferencia" | "crypto"
}
```
Response:
```json
{
  "success": boolean,
  "message": "string",
  "requestId": "string?"
}
```

**GET /api/premium/status**
Headers: `Authorization: Bearer <token>`
Response:
```json
{
  "usuario": "string",
  "isPremium": boolean,
  "sinPublicidades": boolean
}
```

**PUT /api/premium/approve/:requestId**
Headers: `Authorization: Bearer <adminToken>`
```json
{
  "action": "approve" | "reject"
}
```

**PUT /api/premium/toggle-ads/:usuario**
Headers: `Authorization: Bearer <adminToken>`
```json
{
  "sinPublicidades": boolean
}
```

**GET /api/premium/list**
Headers: `Authorization: Bearer <adminToken>`
Response:
```json
{
  "pending": [...],
  "approved": [...]
}
```

#### 2. Telegram Bot Integration

**Service:** `/src/lib/telegram-notifier.ts`

**Responsibilities:**
- Send Premium request notifications
- Parse approval commands from Telegram
- Send confirmation to admin
- Send confirmation to user (TBD)

**Key Methods:**
```typescript
notifyPremiumRequest(requestId: string, nombre: string, usuario: string): Promise<void>
notifyApprovalSuccess(usuario: string): Promise<void>
notifyApprovalFailure(error: string): Promise<void>
```

**Telegram Message Format:**
```
🎬 Nueva Solicitud PREMIUM

Nombre: {nombre}
Usuario: {usuario}
Timestamp: {timestamp}
Método: {metodo_pago}

👉 Ir al Admin: {adminLink}

/approve_{requestId} - Aprobar
/reject_{requestId} - Rechazar
```

#### 3. Premium Service

**File:** `/src/lib/premium-service.ts`

**Responsibilities:**
- Handle Premium request creation
- Manage Premium status checks
- Coordinate with Telegram notifier
- Manage Google Sheets Premium_Storage

**Key Methods:**
```typescript
createRequest(data: PremiumRequestData): Promise<string>
getPremiumStatus(usuario: string): Promise<PremiumStatus>
approvePremium(requestId: string, adminUser: string): Promise<void>
rejectPremium(requestId: string): Promise<void>
toggleAds(usuario: string, sinPublicidades: boolean): Promise<void>
listPendingRequests(): Promise<PremiumRequest[]>
listApprovedUsers(): Promise<PremiumUser[]>
```

## Data Flow

### 1. Premium Request Flow

```
User fills form → Submit → API: POST /api/premium/request
                          ↓
                   Premium Service
                          ↓
                   Store in Google Sheets
                          ↓
                   Telegram Notifier
                          ↓
                   Send to +54 3417195165
                          ↓
         Admin sees notification with approval button
```

### 2. Approval Flow (via Telegram)

```
Admin clicks /approve_{requestId}
           ↓
Telegram Bot receives command
           ↓
API: PUT /api/premium/approve
           ↓
Premium Service updates Google Sheets
           ↓
Ad_Manager invalidates cache
           ↓
Next time user loads page → No ads
```

### 3. Approval Flow (via Admin Panel)

```
Admin navigates to Premium tab
           ↓
Loads list of pending requests
           ↓
Clicks Approve button
           ↓
API: PUT /api/premium/approve
           ↓
Same as Telegram flow above
```

### 4. Ad Rendering Flow

```
Component renders
      ↓
Calls Ad_Manager.checkAdVisibility()
      ↓
Check local cache (valid if < 30s)
      ↓
If valid: use cached status
If expired: fetch from API /api/premium/status
      ↓
If sinPublicidades = true → Don't render ad
If sinPublicidades = false → Render ad normally
      ↓
Update local cache timestamp
```

## Storage Architecture

### Google Sheets (Premium_Storage)

- **Sheet name:** "premium_users"
- **Read/Write:** API server only (never direct from frontend)
- **URL:** Set via environment variable `PREMIUM_SHEET_URL`
- **Format:** CSV export (same as existing sheets)

### Local Cache (Frontend)

- **Storage:** localStorage or sessionStorage
- **Key:** `enygma_premium_status`
- **TTL:** 30 seconds (auto-refresh)
- **Format:** JSON

### Admin Authentication

- Use existing admin auth mechanism from current system
- Extend to require "premium_admin" role for premium management

## Integration Points

### Existing Systems

1. **Admin Panel**
   - Extend existing `/admin` page
   - Add "Premium" tab alongside existing tabs
   - Use existing authentication

2. **Ad Components**
   - Modify all ad-related components
   - Import and use Ad_Manager
   - Maintain existing layout/styling

3. **Navigation**
   - Add "Premium" link to main navigation (visible to all users)
   - Link to `/premium` page

4. **User Sessions**
   - Extend user context to include Premium status
   - Load premium status on login
   - Invalidate cache on logout

## Security Considerations

1. **API Authentication**
   - Premium endpoints require authentication
   - Admin endpoints require admin role

2. **Telegram Bot Security**
   - Use environment variables for bot token
   - Validate incoming webhook signatures
   - Use HTTPS for webhook

3. **Data Protection**
   - Premium data is read-only from frontend
   - All writes go through authenticated API
   - Audit log all admin actions

4. **CORS**
   - Telegram API calls from backend only (not frontend)

## Performance Considerations

1. **Caching Strategy**
   - Local cache with 30-second TTL
   - Reduces API calls on rapid navigation
   - Fails gracefully if cache unavailable

2. **Lazy Loading**
   - Premium page loaded on-demand (not all users)
   - Admin panel lazy-loaded

3. **Ad Rendering**
   - Pre-check Premium status before rendering component
   - Prevent rendering then hiding (visual flicker)

## Testing Strategy

1. **Unit Tests**
   - Premium_Service methods
   - Ad_Manager logic
   - Telegram notification formatting

2. **Integration Tests**
   - Complete request → approval → ad hiding flow
   - Admin panel toggle functionality
   - Cache invalidation

3. **E2E Tests**
   - User submits premium request
   - Admin approves via Telegram
   - User sees no ads after reload

## Deployment Checklist

- [ ] Create `PREMIUM_SHEET_URL` environment variable
- [ ] Create `TELEGRAM_BOT_TOKEN` environment variable
- [ ] Create `TELEGRAM_ADMIN_CHAT_ID` environment variable
- [ ] Create Google Sheets for Premium_Storage
- [ ] Deploy Telegram webhook (or polling)
- [ ] Test Premium request → Telegram notification
- [ ] Test Admin approval flow
- [ ] Test ad visibility toggle
- [ ] Verify existing tests pass
- [ ] Load test ad rendering with 1000+ concurrent users
