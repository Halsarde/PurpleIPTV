# Keep Media3 service/session classes
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }

# OkHttp/Okio keep (usually safe without, but explicit)
-dontwarn okhttp3.**
-dontwarn okio.**

# Coil
-dontwarn coil.**

