# Pickup push notifications (delivery partner)

Remote pickup alerts require a **development build** or release build — **Expo Go on Android does not support remote push** (SDK 53+).

## Setup

1. Create/link an EAS project: `npx eas init` (from this app directory).
2. Copy the project UUID into `app.json` → `expo.extra.eas.projectId`, or set `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env`.
3. Build and install a dev client: `npm run dev:android` or `npm run dev:ios`.
4. Grant notification permission when you go **online** on Home.
5. Backend (optional): set `EXPO_ACCESS_TOKEN` for production Expo push rate limits.

## Behavior

- **Online**: app polls for requests every 5s; new pickups trigger a local alert on any tab. When a store marks an order ready, the backend sends an Expo push to matching online partners.
- **Offline**: polling stops; backend does not target offline partners for pickup push.

## Testing

1. Partner approved + online + push token registered (`POST /delivery-partner/devices`).
2. Mark a sub-order `READY_FOR_PICKUP` from the seller/store app.
3. Confirm notification on device (foreground, background, or after force-quit if FCM is configured for your EAS build).
