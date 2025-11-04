package com.purpleiptv.app

import android.content.Context
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.flow.first

data class EpgItem(val title: String, val start: Long, val end: Long)
data class EpgNowNext(val now: EpgItem?, val next: EpgItem?)

object EPGRepository {
    private val client = OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).build()
    private const val CACHE_FILE = "epg_cache.json"
    private val CACHE_TTL_MS = TimeUnit.HOURS.toMillis(2)

    suspend fun load(ctx: Context): Map<String, EpgNowNext> {
        val epgUrl = SettingsStore.epgFlow(ctx).first()
        if (epgUrl.isBlank()) return emptyMap()
        val cache = File(ctx.cacheDir, CACHE_FILE)
        val net = runCatching { fetchRemote(epgUrl) }.getOrNull()
        if (net != null) { cache.writeText(net); return parse(net) }
        if (cache.exists()) return parse(cache.readText())
        return emptyMap()
    }

    private fun fetchRemote(url: String): String {
        val req = Request.Builder().url(url).get().build()
        client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) throw IllegalStateException("HTTP ${resp.code}")
            return resp.body?.string() ?: throw IllegalStateException("Empty body")
        }
    }

    // صيغة JSON مقترحة: { "Purple News HD": {"now":{"title":"...","start":"2025-01-01T12:00:00Z","end":"2025-01-01T13:00:00Z"}, "next":{...}}, ... }
    private fun parse(json: String): Map<String, EpgNowNext> = try {
        val root = JSONObject(json)
        val out = HashMap<String, EpgNowNext>()
        val keys = root.keys()
        while (keys.hasNext()) {
            val chName = keys.next()
            val obj = root.getJSONObject(chName)
            val now = obj.optJSONObject("now")?.let { toItem(it) }
            val next = obj.optJSONObject("next")?.let { toItem(it) }
            out[chName] = EpgNowNext(now, next)
        }
        out
    } catch (e: Exception) {
        Log.e("EPGRepository", "parse error", e)
        emptyMap()
    }

    private fun toItem(o: JSONObject): EpgItem? {
        val title = o.optString("title", null) ?: return null
        val start = parseTime(o.optString("start"))
        val end = parseTime(o.optString("end"))
        if (start == 0L || end == 0L) return null
        return EpgItem(title, start, end)
    }

    private fun parseTime(s: String?): Long {
        if (s.isNullOrBlank()) return 0
        val patterns = arrayOf(
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
        )
        patterns.forEach { p ->
            try {
                val fmt = SimpleDateFormat(p, Locale.US)
                if (p.contains("XXX")) {
                    fmt.timeZone = TimeZone.getTimeZone("UTC") // offset مضمّن
                } else {
                    fmt.timeZone = TimeZone.getTimeZone("UTC")
                }
                val d = fmt.parse(s)
                if (d != null) return d.time
            } catch (_: Throwable) {}
        }
        return 0
    }
}
