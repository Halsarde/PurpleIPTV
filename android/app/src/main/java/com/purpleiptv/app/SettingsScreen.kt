package com.purpleiptv.app

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.remember
import kotlinx.coroutines.launch
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource

@Composable
fun SettingsScreen(onClose: () -> Unit) {
    val ctx = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    val lang by SettingsStore.languageFlow(ctx).collectAsState(initial = "ar")
    val theme by SettingsStore.themeFlow(ctx).collectAsState(initial = "dark")
    val playlist by SettingsStore.playlistFlow(ctx).collectAsState(initial = "")
    val epg by SettingsStore.epgFlow(ctx).collectAsState(initial = "")

    var playlistInput = remember(playlist) { mutableStateOf(playlist) }
    var epgInput = remember(epg) { mutableStateOf(epg) }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(stringResource(id = R.string.settings), color = Color(0xFFEDEAF3))
        Spacer(Modifier.height(16.dp))

        Text(stringResource(id = R.string.language), color = Color(0xFFAAA3BA))
        Row {
            RadioOption("العربية", selected = lang == "ar") {
                scope.launch {
                    SettingsStore.setLanguage(ctx, "ar")
                    applyAppLocale(ctx, "ar")
                }
            }
            Spacer(Modifier.width(12.dp))
            RadioOption("English", selected = lang == "en") {
                scope.launch {
                    SettingsStore.setLanguage(ctx, "en")
                    applyAppLocale(ctx, "en")
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        Text(stringResource(id = R.string.theme), color = Color(0xFFAAA3BA))
        Column {
            RadioOption(stringResource(id = R.string.dark), selected = theme == "dark") { scope.launch { SettingsStore.setTheme(ctx, "dark") } }
            RadioOption(stringResource(id = R.string.light), selected = theme == "light") { scope.launch { SettingsStore.setTheme(ctx, "light") } }
            RadioOption(stringResource(id = R.string.system), selected = theme == "system") { scope.launch { SettingsStore.setTheme(ctx, "system") } }
        }

        Spacer(Modifier.height(24.dp))
        Text("Playlist (M3U URL)", color = Color(0xFFAAA3BA))
        TextField(value = playlistInput.value, onValueChange = { playlistInput.value = it }, modifier = Modifier.fillMaxWidth(), singleLine = true, placeholder = { Text("https://.../playlist.m3u") })
        Spacer(Modifier.height(8.dp))
        Text("EPG URL (اختياري)", color = Color(0xFFAAA3BA))
        TextField(value = epgInput.value, onValueChange = { epgInput.value = it }, modifier = Modifier.fillMaxWidth(), singleLine = true, placeholder = { Text("https://.../epg.json") })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = {
                scope.launch {
                    SettingsStore.setPlaylist(ctx, playlistInput.value)
                    SettingsStore.setEpg(ctx, epgInput.value)
                }
            }) { Text("حفظ") }
            Button(onClick = onClose) { Text(stringResource(id = R.string.close)) }
        }
    }
}

@Composable
private fun RadioOption(label: String, selected: Boolean, onClick: () -> Unit) {
    Row(modifier = Modifier.padding(vertical = 4.dp)) {
        RadioButton(selected = selected, onClick = onClick)
        Spacer(Modifier.width(8.dp))
        Text(label, color = Color(0xFFEDEAF3))
    }
}
