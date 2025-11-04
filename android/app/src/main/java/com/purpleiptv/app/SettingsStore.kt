package com.purpleiptv.app

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "settings")

object SettingsStore {
    private val KEY_LANG = stringPreferencesKey("lang")
    private val KEY_THEME = stringPreferencesKey("theme") // dark|light|system
    private val KEY_PLAYLIST = stringPreferencesKey("playlist_url")
    private val KEY_EPG = stringPreferencesKey("epg_url")

    fun languageFlow(ctx: Context): Flow<String> = ctx.dataStore.data.map { it[KEY_LANG] ?: "ar" }
    fun themeFlow(ctx: Context): Flow<String> = ctx.dataStore.data.map { it[KEY_THEME] ?: "dark" }
    fun playlistFlow(ctx: Context): Flow<String> = ctx.dataStore.data.map { it[KEY_PLAYLIST] ?: "" }
    fun epgFlow(ctx: Context): Flow<String> = ctx.dataStore.data.map { it[KEY_EPG] ?: "" }

    suspend fun setLanguage(ctx: Context, lang: String) {
        ctx.dataStore.edit { it[KEY_LANG] = lang }
    }
    suspend fun setTheme(ctx: Context, theme: String) {
        ctx.dataStore.edit { it[KEY_THEME] = theme }
    }
    suspend fun setPlaylist(ctx: Context, url: String) {
        ctx.dataStore.edit { it[KEY_PLAYLIST] = url.trim() }
    }
    suspend fun setEpg(ctx: Context, url: String) {
        ctx.dataStore.edit { it[KEY_EPG] = url.trim() }
    }
}
