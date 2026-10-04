# Quiick Delivery Partner

Expo (React Native) app for Android and iOS — delivery partner onboarding, online shifts, trip flow, earnings, and mock API for local development.

## Setup

```bash
cd QuiickDeliveryPartnerApp
cp .env.example .env
npm install
```

## Run

```bash
npm start              # Metro
npm run start:phone    # Dev client + LAN
npm run android        # Native Android build
npm run ios            # Native iOS build (macOS + Xcode)
npm run typecheck
```

## Mock mode (default)

Set in `.env`:

```
EXPO_PUBLIC_USE_MOCK_API=true
```

- Login with any 10-digit phone, accept terms, OTP **`123456`**
- Complete onboarding → on pending screen tap **Demo: Approve partner (mock)**
- Go **online** on Home → open **Requests** → accept a delivery → complete trip steps

## Backend later

Set `EXPO_PUBLIC_USE_MOCK_API=false` and `EXPO_PUBLIC_API_BASE_URL` to your API. Service stubs live in `src/services/api/index.ts` under `/delivery-partner/*` and auth with `userType: DELIVERY_PARTNER`.

## App IDs

| Platform | Identifier |
|----------|------------|
| Android | `com.quiick.deliverypartner` |
| iOS | `com.quiick.deliverypartner` |
| URL scheme | `quiickdeliverypartner` |
