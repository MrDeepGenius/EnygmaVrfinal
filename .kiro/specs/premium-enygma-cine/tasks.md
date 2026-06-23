# Tasks: Premium Enygma Cine

## Task 1: Create Premium_Storage Google Sheets

**Status:** `todo`
**Depends on:** None
**Priority:** Critical
**Effort:** 0.5h

### Description
Create a new Google Sheets document to store premium user information. This will be the single source of truth for premium status.

### Subtasks
- [ ] Create new Google Sheet named "ENYGMA Premium Users"
- [ ] Add columns: id, usuario, nombre, email, estado_premium, sin_publicidades, metodo_pago, timestamp_solicitud, timestamp_aprobacion, aprobado_por, notas, activo
- [ ] Set up CSV export URL
- [ ] Add to environment variables as `PREMIUM_SHEET_URL`
- [ ] Share sheet access with API server service account

### Acceptance Criteria
- [ ] Sheet exists and is accessible via CSV export
- [ ] All columns are present and correctly formatted
- [ ] Environment variable is set and API server can read it

---

## Task 2: Create Premium Service Backend

**Status:** `todo`
**Depends on:** Task 1
**Priority:** Critical
**Effort:** 3h

### Description
Implement the Premium_Service backend that handles all premium-related operations: creating requests, checking status, approving/rejecting, and toggling ads.

### Subtasks
- [ ] Create `/src/lib/premium-service.ts` in api-server
- [ ] Implement `createRequest()` method
- [ ] Implement `getPremiumStatus()` method
- [ ] Implement `approvePremium()` method
- [ ] Implement `rejectPremium()` method
- [ ] Implement `toggleAds()` method
- [ ] Implement `listPendingRequests()` method
- [ ] Implement `listApprovedUsers()` method
- [ ] Add error handling and logging

### Acceptance Criteria
- [ ] All methods work correctly with Google Sheets storage
- [ ] Data is properly parsed and formatted
- [ ] Errors are logged with context
- [ ] Unit tests pass for all methods

---

## Task 3: Create Telegram Bot Integration

**Status:** `todo`
**Depends on:** Task 2
**Priority:** Critical
**Effort:** 2h

### Description
Implement Telegram bot integration to send notifications to the admin when users request premium, and allow admin to approve/reject via inline buttons.

### Subtasks
- [ ] Create `/src/lib/telegram-notifier.ts` in api-server
- [ ] Implement `notifyPremiumRequest()` method
- [ ] Set up Telegram webhook or polling
- [ ] Handle inline button callbacks (approve/reject)
- [ ] Implement retry logic (3 retries with exponential backoff)
- [ ] Add fallback error notification
- [ ] Test sending to +54 3417195165

### Acceptance Criteria
- [ ] Notification sends to admin on premium request
- [ ] Admin can approve via inline button
- [ ] Approval updates Premium_Storage correctly
- [ ] Error handling works (retry + fallback)
- [ ] Message format is clear and actionable

---

## Task 4: Create Premium API Endpoints

**Status:** `todo`
**Depends on:** Task 2, Task 3
**Priority:** Critical
**Effort:** 2h

### Description
Create all REST API endpoints for premium functionality: submit request, check status, approve, toggle ads, and list requests/users.

### Subtasks
- [ ] Create `POST /api/premium/request` endpoint
- [ ] Create `GET /api/premium/status` endpoint
- [ ] Create `PUT /api/premium/approve/:requestId` endpoint
- [ ] Create `PUT /api/premium/toggle-ads/:usuario` endpoint
- [ ] Create `GET /api/premium/list` endpoint
- [ ] Add proper authentication (bearer token, admin role)
- [ ] Add input validation
- [ ] Add error responses with proper HTTP codes

### Acceptance Criteria
- [ ] All endpoints respond with correct HTTP codes
- [ ] Authentication works correctly
- [ ] Input validation prevents invalid data
- [ ] Error messages are descriptive
- [ ] API documentation is updated

---

## Task 5: Create Ad_Manager System

**Status:** `todo`
**Depends on:** Task 2
**Priority:** Critical
**Effort:** 2h

### Description
Implement the centralized Ad_Manager system that checks premium status and determines if ads should be shown.

### Subtasks
- [ ] Create `/src/lib/ad-manager.ts` in frontend
- [ ] Implement `checkAdVisibility()` method
- [ ] Implement local caching with 30-second TTL
- [ ] Implement cache invalidation
- [ ] Implement session refresh logic
- [ ] Implement error handling (fail-safe to show ads)
- [ ] Add TypeScript types

### Acceptance Criteria
- [ ] Checks premium status correctly
- [ ] Cache works and auto-expires after 30s
- [ ] Defaults to showing ads if Premium API unavailable
- [ ] Performance is < 50ms per check
- [ ] No memory leaks from cache

---

## Task 6: Create Premium Page

**Status:** `todo`
**Depends on:** Task 4
**Priority:** High
**Effort:** 2h

### Description
Create the user-facing Premium page with benefits, pricing, and premium request form.

### Subtasks
- [ ] Create `/src/pages/premium.tsx`
- [ ] Design page layout (benefits, pricing, form)
- [ ] Implement form with nombre + usuario fields
- [ ] Add payment method selector (transferencia / crypto coming soon)
- [ ] Implement form validation
- [ ] Add submit handler (call POST /api/premium/request)
- [ ] Add success/error messages
- [ ] Style with premium cinematographic design
- [ ] Add to navigation menu

### Acceptance Criteria
- [ ] Page loads without errors
- [ ] Form submits correctly to API
- [ ] Success message appears after submission
- [ ] Design matches ENYGMA premium aesthetic
- [ ] Responsive on mobile/tablet/desktop
- [ ] Ad_Manager allows ads to show on this page (user not premium yet)

---

## Task 7: Modify All Ad Components

**Status:** `todo`
**Depends on:** Task 5
**Priority:** High
**Effort:** 2.5h

### Description
Modify all existing ad components to respect the Ad_Manager system and hide ads for premium users.

### Subtasks
- [ ] Find all ad-related components (AdsBanner300x250, AdsBanner-full, etc.)
- [ ] Import Ad_Manager in each component
- [ ] Add `sinPublicidades` check before rendering
- [ ] Return null if ads should be hidden (no empty space)
- [ ] Test rendering with both premium and non-premium users
- [ ] Ensure no visual flicker when toggling

### Components to modify
- [ ] `/src/components/ads-banner-300x250.tsx`
- [ ] `/src/components/ads-banner-full.tsx` (if exists)
- [ ] Any other ad-related components

### Acceptance Criteria
- [ ] All ad components check Ad_Manager before rendering
- [ ] Premium users see no ads
- [ ] Non-premium users see ads normally
- [ ] No layout shift when ads hidden
- [ ] Build succeeds without errors

---

## Task 8: Create Admin Premium Management Panel

**Status:** `todo`
**Depends on:** Task 4, Task 7
**Priority:** High
**Effort:** 3h

### Description
Implement the admin panel for managing premium users: viewing requests, approving/rejecting, and toggling ads per user.

### Subtasks
- [ ] Extend existing `/src/pages/admin.tsx` with Premium tab
- [ ] Implement "Solicitudes Pendientes" section
- [ ] Implement "Usuarios Premium" section
- [ ] Add approve/reject buttons for pending requests
- [ ] Add toggle switch for "Sin publicidades"
- [ ] Add remove premium button
- [ ] Implement API calls to fetch/update data
- [ ] Add loading states and error handling
- [ ] Style consistently with existing admin panel

### UI Components needed
- [ ] Request list with approve/reject buttons
- [ ] Premium user list with toggles
- [ ] Confirmation dialogs
- [ ] Success/error notifications

### Acceptance Criteria
- [ ] Admin can view pending premium requests
- [ ] Admin can approve requests (updates Premium_Storage)
- [ ] Admin can reject requests (deletes from sheet)
- [ ] Admin can toggle "Sin publicidades" per user
- [ ] All changes persist and take effect within 5 seconds
- [ ] Admin authentication required
- [ ] Build succeeds without errors

---

## Task 9: Integrate Premium Status into User Sessions

**Status:** `todo`
**Depends on:** Task 5
**Priority:** Medium
**Effort:** 1.5h

### Description
Extend existing user session/authentication system to include premium status.

### Subtasks
- [ ] Extend user context to include `isPremium` and `sinPublicidades`
- [ ] Load premium status on user login
- [ ] Cache premium status in session
- [ ] Invalidate cache on logout
- [ ] Auto-refresh premium status every 30 seconds
- [ ] Handle premium status changes without page reload

### Acceptance Criteria
- [ ] Premium status loads with user profile
- [ ] Cache updates automatically
- [ ] Status changes reflect within 30 seconds
- [ ] No performance regression

---

## Task 10: Testing & Verification

**Status:** `todo`
**Depends on:** All other tasks
**Priority:** High
**Effort:** 3h

### Description
Comprehensive testing of the entire premium system end-to-end.

### Test Cases
- [ ] User submits premium request → appears in admin panel
- [ ] Request notification arrives in Telegram
- [ ] Admin approves via Telegram → user becomes premium
- [ ] Admin approves via admin panel → user becomes premium
- [ ] Premium user sees no ads across all pages
- [ ] Non-premium user sees ads normally
- [ ] Admin toggles "Sin publicidades" → takes effect within 5 seconds
- [ ] Admin can reject/remove premium → ads reappear
- [ ] Existing functionality not broken (navigation, player, favorites, etc.)
- [ ] Performance is acceptable (< 200ms page load impact)

### Acceptance Criteria
- [ ] All test cases pass
- [ ] No errors in console
- [ ] Existing tests still pass
- [ ] Performance is acceptable

---

## Task 11: Documentation & Deployment

**Status:** `todo`
**Depends on:** Task 10
**Priority:** Medium
**Effort:** 1h

### Description
Create user documentation and deployment guide.

### Subtasks
- [ ] Create user-facing documentation for Premium feature
- [ ] Create admin guide for managing premium users
- [ ] Document Telegram bot setup
- [ ] Create deployment checklist
- [ ] Add environment variables documentation
- [ ] Create troubleshooting guide

### Acceptance Criteria
- [ ] Documentation is clear and complete
- [ ] Deployment can be done by following checklist
- [ ] All environment variables documented

---

## Summary

- **Total Effort:** ~19.5 hours
- **Critical Path:** Task 1 → Task 2 → Task 4 → Task 6
- **Parallel Work:** Tasks can be done in parallel after Task 2
- **Testing:** Continuous throughout, formal testing in Task 10
- **Deployment:** Can deploy after all tasks + Task 11
