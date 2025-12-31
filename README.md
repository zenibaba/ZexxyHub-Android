# ⚡ ZEXXY HUB - Mobile Account Generator

![Zexxy Hub Banner](assets/banner.png)

**Zexxy Hub** is a premium, high-performance Android application designed for mass account generation and management. Built with modern web technologies on React Native, it combines a sleek, futuristic UI with robust automation capabilities.

## 🚀 Key Features

### 🔐 Security & Authentication
*   **KeyAuth System**: Secure login with HWID locking and expiration management.
*   **Encrypted Storage**: Credentials are persisted securely using `AsyncStorage`.
*   **Device Locking**: Soft HWID binding prevents unauthorized sharing.

### ⚙️ Generator Engine
*   **Multi-Threaded**: Run up to 10 threads explicitly, capable of generating 600+ accounts/minute.
*   **Zero-Delay Mode**: Optimized loops for maximum throughput.
*   **Proxy Rotation**: Intelligent proxy management with auto-retry and 403 handling.
*   **Region Selection**: Support for multiple game regions (EU, NA, US, etc.).

### 📊 Analytics & Dashboard
*   **Real-Time Tracking**: Monitor Success, Fail, and Total rates live.
*   **Lifetime Stats**: Persistent counters for total generated accounts across sessions.
*   **Results Manager**: View, search, and filter generated accounts. Export to clipboard.

### 🎮 Interactive Features
*   **Music Player**: Integrated background music player with playback controls.
*   **Garena Clicker**: Fun mini-game to pass time during generation w/ sound effects.
*   **Flight Mode Tool**: Quick access to device settings for IP changing.

## 🛠️ Tech Stack

*   **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
*   **Styling**: [NativeWind (TailwindCSS)](https://www.nativewind.dev/)
*   **Language**: TypeScript
*   **State**: React Hooks & Context
*   **Audio**: Expo AV

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/zenibaba/ZexxyHub-Android.git
    cd ZexxyHub-Android
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the app**
    ```bash
    npx expo start
    ```

## 📱 Build for Android

To generate the Android source code or APK:

```bash
# Generate Android Folder (Project Source)
npx expo prebuild --platform android

# Build APK (requires EAS CLI)
eas build -p android --profile preview --local
```

## 📄 License

Distributed under the **MIT License**.

---
*Developer: @MASTERZENI*
