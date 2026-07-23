# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Note: this project was briefly on SDK 57, but was downgraded back to SDK 56 (2026-07-19) because expo-modules-jsi@57.0.3 had an unpatched build-breaking bug (missing `deleteProperty` in the JSI bindings, plus a Swift 6.3-only `weak let` compile error). Re-check whether that's fixed upstream before attempting another 57 upgrade.

Note: further downgraded from SDK 56 to SDK 54 (2026-07-22) because the user's Expo Go app (can't be upgraded) only supports SDK 54 — this is now the hard ceiling for local testing, not a bug workaround. Don't bump the SDK without first confirming what the actual test device's Expo Go app supports. This downgrade required two follow-up fixes beyond `expo install --fix`:
- `expo-router/unstable-native-tabs`'s `Label`/`Icon`/`VectorIcon` moved from being sub-properties of `NativeTabs.Trigger` (56.x shape) to top-level named exports of the same module (54.x shape) — see `src/app/(app)/(tabs)/_layout.tsx`.
- `expo-status-bar` was listed in `app.json`'s `plugins` array but has no config plugin at this version, which hard-crashes `expo config`/`expo start`; it's removed from `plugins` (the package is still used as a plain component import, that's unaffected).
- `@react-native/jest-preset` doesn't exist as a standalone package before react-native 0.85 (it's bundled inside `react-native` itself pre-0.85) — don't add it back while on SDK 54's react-native 0.81.x.
