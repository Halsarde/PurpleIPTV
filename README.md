# Purple IPTV

This is a modern, sleek IPTV web application with a purple-themed UI.

## Project Setup

This project is now configured with Vite for development and building, and Capacitor for native Android builds.

### Prerequisites

- Node.js and npm
- Android Studio with Android SDK

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

To run the app in a development server with hot-reloading:
```bash
npm run dev
```

## Building for Android

Follow these steps to generate a native Android application (.apk/.aab).

1.  **Build the Web App:**
    This command bundles the web application into the `/dist` directory.
    ```bash
    npm run build
    ```

2.  **Add and Configure the Android Platform:**
    This command uses Capacitor to create a native Android project in the `/android` directory.
    ```bash
    npx cap add android
    ```

3.  **Copy Web Assets:**
    This command copies the built web assets from `/dist` into the native Android project.
    ```bash
    npx cap copy android
    ```

4.  **Open in Android Studio:**
    This command opens the native project in Android Studio, where you can build, run, and sign your application.
    ```bash
    npx cap open android
    ```
    
5.  **Generate Signed APK/AAB in Android Studio:**
    - Inside Android Studio, go to `Build > Generate Signed Bundle / APK...`.
    - Follow the on-screen instructions to create a new keystore or use an existing one.
    - Choose either 'Android App Bundle' (.aab, recommended for Google Play) or 'APK'.
    - Select the 'release' build variant.
    - Once the build is complete, you will find the output file in `/android/app/build/outputs/`.

### Notes

- **Icons & Splash Screen:** Place your `icon.png` (at least 1024x1024) and `splash.png` (at least 2732x2732) in an `assets` folder at the project root. Then, run `npx capacitor-assets generate` to automatically generate all the required platform-specific image sizes.
- **Hardware Acceleration:** This is enabled by default in modern Capacitor projects.
- **Android Version:** The generated project is compatible with Android 9 (API 28) and above by default.
