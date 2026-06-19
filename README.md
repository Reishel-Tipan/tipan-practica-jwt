# Autenticación Stateless y Simulación de Microservicios con JWT

Sistema de autenticación basado en tokens JWT con firma asimétrica RS256, simulando un entorno distribuido de microservicios independientes.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  Cliente                                                    │
│   POST /auth/token  →  Identity Server (firma con RSA)      │
│   GET /v1/service-alpha/private  →  Microservicio Alpha     │
│   GET /v1/service-beta/private   →  Microservicio Beta      │
└─────────────────────────────────────────────────────────────┘
          ↕ JWT (RS256)
┌─────────────────────────────────────────────────────────────┐
│  Servidor                                                   │
│  ┌──────────────┐   ┌───────────────┐   ┌────────────────┐ │
│  │ auth.routes  │   │resource.routes│   │  auth.middleware│ │
│  └──────┬───────┘   └──────┬────────┘   └───────┬────────┘ │
│         │                  │                     │          │
│  ┌──────▼───────┐          │              ┌──────▼────────┐ │
│  │AuthController│          │              │  JwtService   │ │
│  └──────────────┘   ┌──────▼────────┐    │  (RS256 verify│ │
│                     │ResourceControl│    │   public key) │ │
│                     └───────────────┘    └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Configuración e instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Generar par de llaves criptográficas (RSA 2048 bits)
bash keypair.sh

# 3. Crear archivo de entorno (.env)
PORT=3000
JWT_ALGORITHM=RS256
PRIVATE_KEY_PATH=./private.pem
PUBLIC_KEY_PATH=./public.pem

# 4. Ejecutar el servidor
node index.js
```

## Endpoints

### POST /auth/token
Genera un JWT firmado con RS256.

**Body:**
```json
{ "username": "admin", "password": "admin123" }
```

**Respuesta:**
```json
{
  "access_token": "<JWT>",
  "token_type": "Bearer",
  "expires_in": 60,
  "algorithm": "RS256"
}
```

### GET /v1/service-alpha/private
Recurso protegido del Microservicio Alpha. Requiere `Authorization: Bearer <token>`.

### GET /v1/service-beta/private
Recurso protegido del Microservicio Beta. Requiere `Authorization: Bearer <token>`.

---

## Investigación Teórica: Integración de Refresh Tokens

### 1. ¿Cómo resuelve el Refresh Token la experiencia del usuario con JWT de corta duración?

En esta práctica, el `exp` del Access Token se establece exactamente en **60 segundos**. Desde la perspectiva de la arquitectura Stateless, esto es correcto: reduce la ventana de abuso si un token es interceptado. Sin embargo, obligar al usuario a re-autenticarse cada minuto es inviable en producción.

El patrón **Refresh Token** soluciona esto con un flujo de dos tokens:

| Token | Propósito | Tiempo de vida | Almacenamiento |
|---|---|---|---|
| **Access Token (JWT)** | Autoriza peticiones a microservicios | Corto (1–15 min) | Memoria del cliente |
| **Refresh Token** | Obtiene un nuevo Access Token | Largo (7–30 días) | Cookie HttpOnly segura |

**Flujo técnico:**
1. El cliente recibe ambos tokens al autenticarse.
2. Adjunta el Access Token en cada petición como `Authorization: Bearer <token>`.
3. Cuando el Access Token expira, el microservicio responde `401 TOKEN_EXPIRED`.
4. El cliente envía automáticamente el Refresh Token al endpoint `/auth/refresh` (sin interacción del usuario).
5. El Identity Server valida el Refresh Token, emite un nuevo par, e invalida el Refresh Token usado (rotación).
6. El cliente reintenta la petición original de manera transparente.

Esto preserva la seguridad (el Access Token sigue siendo de corta vida) sin interrumpir la sesión del usuario.

### 2. ¿Dónde almacenar y gestionar el ciclo de vida del Refresh Token?

Según las mejores prácticas de OWASP y RFC 6749, el Refresh Token **debe almacenarse en el servidor (Servidor) y transmitirse mediante una Cookie HttpOnly Secure**.

**¿Por qué no en el cliente (localStorage / sessionStorage)?**

- `localStorage` y `sessionStorage` son accesibles desde JavaScript, lo que los hace vulnerables a ataques **XSS** (Cross-Site Scripting). Un script malicioso inyectado puede extraer el token completo.
- El Access Token de corta vida puede residir en memoria del cliente (variable JS) porque su ventana de compromiso es mínima.

**Configuración recomendada de la Cookie:**

```http
Set-Cookie: refresh_token=<valor>;
  HttpOnly;        /* Inaccesible desde JS */
  Secure;          /* Solo HTTPS */
  SameSite=Strict; /* Protección CSRF */
  Path=/auth/refresh; /* Scope mínimo */
  Max-Age=604800   /* 7 días */
```

**Ciclo de vida en el servidor:**

El Refresh Token debe persistirse en una base de datos o almacén seguro (ej. Redis) junto a:
- ID del usuario asociado
- Fecha de emisión y expiración
- Estado (activo / revocado)
- IP o User-Agent de emisión (para detección de anomalías)

Esto permite la **revocación inmediata** en caso de cierre de sesión explícito, cambio de contraseña, o detección de uso sospechoso; algo imposible con JWT puramente stateless.

**Patrón de rotación (Refresh Token Rotation):**

Cada uso del Refresh Token genera uno nuevo e invalida el anterior. Si un token ya usado vuelve a presentarse, se asume compromiso y se revocan **todos** los tokens de esa sesión. Este mecanismo detecta ataques de replay.

**Resumen arquitectónico:**

```
Cliente                           Servidor
  |                                   |
  |-- POST /auth/refresh (Cookie) --> |
  |                            valida en DB
  |                         emite nuevo par
  |<-- new access_token (body)        |
  |<-- new refresh_token (Set-Cookie) |
  |    (anterior invalidado en DB)    |
```

La combinación de JWT de corta vida + Refresh Token en cookie HttpOnly + rotación en servidor es el estándar de facto para arquitecturas de microservicios seguras y con buena experiencia de usuario.
