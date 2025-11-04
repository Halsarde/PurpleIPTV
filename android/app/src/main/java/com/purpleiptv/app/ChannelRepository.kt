package com.purpleiptv.app

import android.content.Context
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.flow.first

data class Channel(val title: String, val url: String, val logo: String?, val category: String)

object ChannelRepository {
    private val client = OkHttpClient.Builder()
        .callTimeout(15, TimeUnit.SECONDS)
        .build()

    private const val CACHE_FILE = "channels_cache.m3u"
    private val CACHE_TTL_MS = TimeUnit.HOURS.toMillis(6)

    suspend fun loadChannels(ctx: Context): Map<String, List<Channel>> {
        // اقرأ رابط الـ M3U من الإعدادات
        val playlistUrl = SettingsStore.playlistFlow(ctx).first()
        if (playlistUrl.isBlank()) return emptyMap()

        val now = System.currentTimeMillis()
        val cache = File(ctx.cacheDir, CACHE_FILE)

        // جرّب الشبكة أولاً بشكل خفيف؛ وإلا استخدم الكاش إن صالح
        val net = runCatching { fetchRemote(playlistUrl) }.getOrNull()
        if (net != null) {
            cache.writeText(net)
            return parseM3U(net)
        }

        if (cache.exists() && now - cache.lastModified() < CACHE_TTL_MS) {
            return parseM3U(cache.readText())
        }

        // آخر محاولة: إن وُجد كاش قديم
        if (cache.exists()) {
            return parseM3U(cache.readText())
        }

        return emptyMap()
    }

    private fun fetchRemote(url: String): String {
        val req = Request.Builder().url(url).get().build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IllegalStateException("HTTP " + resp.code)
            return resp.body?.string() ?: throw IllegalStateException("Empty body")
        }
    }

    private fun parseM3U(text: String): Map<String, List<Channel>> {
        val out = LinkedHashMap<String, MutableList<Channel>>()
        var lastInf: String? = null
        text.lineSequence().forEach { raw ->
            val line = raw.trim()
            if (line.isEmpty()) return@forEach
            if (line.startsWith("#EXTINF", ignoreCase = true)) {
                lastInf = line
            } else if (!line.startsWith("#")) {
                // هذا سطر URL للقناة
                val url = line
                val meta = parseExtInf(lastInf)
                val title = meta["title"] ?: meta["tvg-name"] ?: "Channel"
                val logo = meta["tvg-logo"]
                val group = meta["group-title"] ?: "Other"
                out.getOrPut(group) { mutableListOf() }.add(Channel(title = title, url = url, logo = logo, category = group))
                lastInf = null
            }
        }
        return out
    }

    // parse attributes like: #EXTINF:-1 tvg-id="..." tvg-name="...",Channel Name
    private fun parseExtInf(ext: String?): Map<String, String> {
        val map = HashMap<String, String>()
        if (ext == null) return map
        try {
            // split header and title after comma
            val idx = ext.indexOf(',')
            if (idx >= 0 && idx < ext.length - 1) {
                map["title"] = ext.substring(idx + 1).trim()
            }
            val head = if (idx > 0) ext.substring(0, idx) else ext
            // find key="value" pairs
            val regex = Regex("(\\w+)=\"([^\"]*)\"")
            regex.findAll(head).forEach { m ->
                map[m.groupValues[1]] = m.groupValues[2]
            }
        } catch (e: Exception) {
            Log.w("ChannelRepository", "EXTINF parse error", e)
        }
        return map
    }
}
