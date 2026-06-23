# Requirements Document: Premium Enygma Cine

## Introduction

El Sistema Premium Enygma Cine es una solución de suscripción que permite a usuarios eliminar publicidades mediante pago (USD 3 o ARS 4000 por transferencia bancaria, con soporte futuro para crypto USDT BNB/TRON). El sistema gestiona el flujo completo: desde la solicitud de usuario, notificación al administrador, aprobación, y control centralizado de visualización de publicidades para usuarios premium.

## Glossary

- **Usuario**: Persona que accede a la aplicación Enygma Cine
- **Usuario_Premium**: Usuario que ha pagado la suscripción y fue aprobado por el administrador
- **Administrador**: Persona autorizada para aprobar solicitudes y gestionar usuarios premium
- **Premium_Service**: Servicio que gestiona solicitudes y estado de premium
- **Ad_Control_System**: Sistema centralizado que controla la visualización de publicidades
- **Ad_Manager**: Componente que gestiona la visualización de anuncios en cada sección
- **Telegram_Notifier**: Servicio que envía notificaciones a Telegram
- **Premium_Storage**: Base de datos o Google Sheets que almacena usuarios premium
- **Admin_Panel**: Interfaz de administración para gestionar usuarios premium
- **Payment_Methods**: Métodos de pago disponibles (transferencia bancaria y criptomonedas)
- **Premium_Form**: Formulario para solicitar suscripción premium
- **Premium_Request**: Solicitud de usuario para contratar premium

## Requirements

### Requirement 1: Page Premium Visible to User

**User Story:** Como usuario, quiero acceder a una página de Premium para poder solicitar la suscripción, de manera que pueda eliminar publicidades.

#### Acceptance Criteria

1. WHEN the application loads, THE Ad_Manager SHALL display a "Contratar Premium" button or link accessible from the main navigation
2. WHEN the user clicks the "Contratar Premium" button, THE Premium_Service SHALL navigate to the Premium page
3. THE Premium page SHALL display the benefits of Premium subscription (ad-free experience)
4. THE Premium page SHALL display pricing information (USD 3 or ARS 4000)
5. THE Premium page SHALL display available payment methods (bank transfer and future crypto options)
6. WHILE the user is on the Premium page, THE Ad_Manager SHALL still display regular ads (user is not yet premium)

### Requirement 2: Premium Form Submission

**User Story:** Como usuario, quiero rellenar un formulario con mis datos para solicitar Premium, de manera que el administrador pueda validar mi identidad.

#### Acceptance Criteria

1. THE Premium_Service SHALL display a form with the following required fields: nombre (full name) and usuario (username)
2. WHEN the user submits the form with valid data, THE Premium_Service SHALL validate that both fields contain non-empty values
3. IF the form contains empty required fields, THEN THE Premium_Service SHALL display an error message indicating which fields are missing
4. WHEN the user submits a valid form, THE Premium_Service SHALL store the request with a timestamp in the Premium_Storage
5. WHEN the user submits a valid form, THE Premium_Service SHALL return a confirmation message to the user indicating the request was received
6. WHEN the user submits a valid form, THE Telegram_Notifier SHALL send a notification to the configured admin number (+54 3417195165)

### Requirement 3: Telegram Notification to Admin

**User Story:** Como administrador, quiero recibir notificaciones en Telegram cuando un usuario solicite Premium, de manera que pueda revisar y aprobar rápidamente.

#### Acceptance Criteria

1. WHEN a user submits a valid Premium request, THE Telegram_Notifier SHALL send a message to the phone number +54 3417195165
2. THE notification message SHALL contain the user's full name (nombre), username (usuario), and timestamp of the request
3. THE notification message SHALL contain a link or reference to access the Admin Panel to approve the request
4. IF the Telegram notification fails to send, THEN THE Premium_Service SHALL log the error and retry up to 3 times within the next 5 minutes
5. IF all retries fail, THEN THE Premium_Service SHALL send an email notification to the configured admin email as a fallback

### Requirement 4: Admin Approval via Telegram and Dashboard

**User Story:** Como administrador, quiero poder aprobar solicitudes de Premium directamente desde Telegram o desde el Admin Panel, de manera que pueda gestionar eficientemente las suscripciones.

#### Acceptance Criteria

1. THE Telegram notification SHALL include an inline button or command to approve the Premium request
2. WHEN the admin clicks the approval button in Telegram, THE Premium_Service SHALL mark the user as Premium in the Premium_Storage
3. WHEN the admin marks a user as Premium via Telegram, THE Telegram_Notifier SHALL send a confirmation message to the admin
4. THE Admin_Panel SHALL display a list of pending Premium requests with user details (nombre, usuario, request timestamp)
5. WHEN the admin clicks an "Approve" button in the Admin_Panel for a specific request, THE Premium_Service SHALL mark the user as Premium in the Premium_Storage
6. WHEN the admin marks a user as Premium via the Admin_Panel, THE Admin_Panel SHALL display a success confirmation

### Requirement 5: Toggle "Sin Publicidades" in Admin Panel

**User Story:** Como administrador, quiero activar un toggle "Sin publicidades" por usuario en el Admin Panel, de manera que pueda controlar explícitamente quién ve anuncios.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a list of all users with their Premium status
2. FOR each user marked as Premium, THE Admin_Panel SHALL display a toggle labeled "Sin publicidades" that is enabled by default
3. WHEN the admin clicks the toggle to disable it, THE Premium_Service SHALL update the Premium_Storage to set the user's ad visibility to enabled
4. WHEN the admin clicks the toggle to enable it, THE Premium_Service SHALL update the Premium_Storage to set the user's ad visibility to disabled
5. THE Admin_Panel SHALL persist all toggle changes immediately to the Premium_Storage
6. THE toggle changes SHALL take effect within 5 seconds on the user's active session

### Requirement 6: Centralized Ad Control System

**User Story:** Como arquitecto del sistema, quiero tener un sistema centralizado de control de publicidades, de manera que todas las publicidades se gestionen desde una única fuente de verdad.

#### Acceptance Criteria

1. THE Ad_Control_System SHALL maintain a single source of truth for determining if a user should see ads
2. THE Ad_Control_System SHALL check the user's Premium status from the Premium_Storage before rendering any ad
3. WHEN a user is marked as Premium AND the toggle "Sin publicidades" is enabled, THE Ad_Control_System SHALL signal to all Ad_Managers that ads should be hidden for this user
4. WHEN a user is not marked as Premium, THE Ad_Control_System SHALL signal to all Ad_Managers that ads should be displayed
5. IF the Premium_Storage is temporarily unavailable, THE Ad_Control_System SHALL fall back to displaying ads to be fail-safe

### Requirement 7: Ad Manager Hides Ads for Premium Users

**User Story:** Como desarrollador de componentes, quiero que cada Ad_Manager respete la decisión centralizada de ocultar anuncios, de manera que el sistema sea consistente.

#### Acceptance Criteria

1. WHEN a component renders an ad, THE Ad_Manager SHALL query the Ad_Control_System to determine if ads should be displayed for the current user
2. IF the Ad_Control_System indicates ads should be hidden, THEN THE Ad_Manager SHALL not render the ad element and shall leave no empty space
3. IF the Ad_Control_System indicates ads should be displayed, THEN THE Ad_Manager SHALL render the ad normally
4. WHILE the user is viewing content, IF their Premium status changes, THE Ad_Manager SHALL automatically update within 5 seconds without requiring a page reload
5. THE Ad_Manager SHALL handle the case where the Ad_Control_System is unavailable and SHALL display ads as the safe default

### Requirement 8: Prevent Breakage of Existing Features

**User Story:** Como product manager, quiero asegurar que la implementación de Premium no rompa ninguna funcionalidad existente, de manera que el sistema sea estable.

#### Acceptance Criteria

1. WHEN a new user (not premium) accesses the application, THE existing user profile functionality SHALL work exactly as before
2. WHEN a user navigates the application, THE navigation system SHALL remain fully functional and unchanged
3. WHEN a user watches content, THE player functionality SHALL remain fully functional and unchanged
4. WHEN a premium user watches content, THE player functionality SHALL work exactly as for non-premium users (only ads are hidden)
5. IF the Premium_Service fails or is disabled, THE entire application SHALL continue functioning with ads displayed for all users
6. WHEN existing tests run, ALL existing test suites SHALL pass without modification

### Requirement 9: Payment Methods Configuration

**User Story:** Como administrador, quiero tener claridad sobre los métodos de pago disponibles, de manera que pueda comunicar opciones a los usuarios.

#### Acceptance Criteria

1. THE Premium page SHALL display that bank transfer (USD 3 or ARS 4000) is currently the primary payment method
2. THE Premium page SHALL indicate that cryptocurrency payment (USDT BNB/TRON) is "coming soon"
3. THE Premium_Service SHALL store payment method preference for future when crypto is implemented
4. WHEN a user submits a Premium request, THE Premium_Service SHALL record which payment method the user intends to use
5. THE Admin_Panel SHALL display the payment method preference for each pending request to help admin validate payment

### Requirement 10: User Session Persistence

**User Story:** Como usuario, quiero que mi estado de Premium persista durante mi sesión, de manera que no tenga que reconectar.

#### Acceptance Criteria

1. WHEN a user logs in, THE Ad_Control_System SHALL load their Premium status from Premium_Storage
2. WHILE the user maintains an active session, THE Ad_Control_System SHALL cache the Premium status locally
3. IF the user's Premium status is updated by the admin, THE Ad_Control_System SHALL fetch the updated status within 30 seconds
4. WHEN the user logs out and logs in again, THE Ad_Control_System SHALL fetch the latest Premium status from Premium_Storage
5. THE session cache SHALL be cleared when the user logs out

### Requirement 11: Error Handling and Logging

**User Story:** Como desarrollador, quiero que el sistema maneje errores gracefully y registre todos los eventos importantes, de manera que pueda depurar problemas.

#### Acceptance Criteria

1. IF a database or API call fails, THE Premium_Service SHALL log the error with timestamp, operation type, and error details
2. IF a Telegram notification fails, THE Premium_Service SHALL log the failure and attempt retry logic
3. WHEN an error occurs, THE user-facing application SHALL display a user-friendly error message without exposing technical details
4. WHEN an admin operation fails in the Admin_Panel, THE system SHALL display an error message and log the failure
5. THE Premium_Service SHALL maintain an error log accessible for debugging purposes
6. IF the Ad_Control_System encounters an error, IT SHALL default to showing ads rather than hiding them (fail-safe behavior)

### Requirement 12: Performance Requirements

**User Story:** Como usuario, quiero que la verificación de estado Premium sea rápida, de manera que no afecte el rendimiento de la aplicación.

#### Acceptance Criteria

1. WHEN a page loads, THE Ad_Control_System SHALL determine ad visibility status within 200ms
2. WHEN the Ad_Manager renders an ad component, THE ad visibility check SHALL complete within 50ms
3. IF the Premium_Storage lookup takes longer than 500ms, THE Ad_Control_System SHALL fall back to displaying ads
4. WHILE multiple components are rendering simultaneously, THE Ad_Control_System SHALL handle concurrent requests without blocking

## Non-Functional Requirements

### Security
- Premium request data SHALL be transmitted over HTTPS
- Admin operations SHALL require proper authentication
- Telegram notifications SHALL use secure API tokens stored in environment variables
- The Admin_Panel SHALL require admin authentication

### Data Storage
- Premium user information SHALL be stored in either a database or Google Sheets with backup capability
- Premium_Storage SHALL be readonly from the frontend (all writes go through the Premium_Service backend)
- All Premium status changes SHALL include audit logs with timestamp, admin user, and change type

### Compatibility
- The system SHALL not require database schema migrations that break existing functionality
- The system SHALL be compatible with the existing frontend stack (React/Vue)
- The system SHALL not require changes to existing API contracts
