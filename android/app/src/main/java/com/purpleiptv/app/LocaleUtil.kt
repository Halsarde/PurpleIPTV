package com.purpleiptv.app

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat

fun applyAppLocale(context: Context, lang: String) {
    val tag = when (lang.lowercase()) { "ar" -> "ar"; "en" -> "en"; else -> "" }
    val locales = if (tag.isEmpty()) LocaleListCompat.getEmptyLocaleList() else LocaleListCompat.forLanguageTags(tag)
    AppCompatDelegate.setApplicationLocales(locales)
}

