# Pickup push notifications (delivery partner)

Remote pickup alerts require a **development build** or release build — **Expo Go on Android does not support remote push** (SDK 53+).

## Setup

1. Create/link an EAS project: `npx eas init` (from this app directory).
2. Copy the project UUID into `app.json` → `expo.extra.eas.projectId`, or set `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env`.
3. Build and install a dev client: `npm run dev:android` or `npm run dev:ios`.
4. Grant notification permission when you go **online** on Home.
5. Backend (optional): set `EXPO_ACCESS_TOKEN` for production Expo push rate limits.

## Behavior

- **Online**: app polls for requests every 5s. New pickups trigger a **full-screen in-app alert** (Accept / Decline) and a **local system notification** with the same actions.
- **Background / killed**: backend sends an Expo push when an order is ready (broadcast) or when a pending assignment is created for you. Notifications include **Accept** and **Decline** action buttons (iOS category `delivery_request`). Tapping the notification body opens the Requests tab.
- **Offline**: polling stops; backend does not target offline partners for pickup push.
- Accept / Decline from a notification uses the same APIs as the Requests screen. You must be **online** and **approved**. If the push only has `subOrderId`, the app refreshes requests first to create or resolve the pending assignment, then accepts or declines.

## Testing

1. Partner approved + online + push token registered (`POST /delivery-partner/devices`).
2. Mark a sub-order `READY_FOR_PICKUP` from the seller/store app.
3. **Foreground**: confirm in-app modal + local notification; Accept starts the trip.
4. **Background**: confirm remote push with Accept / Decline; Accept opens the trip screen.
5. **Force-quit**: open app via Accept on the push; trip should start after cold start.
6. Decline removes the pending request from the list.
7. **Mock API**: in-app modal and local notifications work; remote push is not available in Expo Go on Android.
