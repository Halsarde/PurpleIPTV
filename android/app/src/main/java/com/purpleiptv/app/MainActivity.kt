package com.purpleiptv.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    val ctx = LocalContext.current
    val theme by SettingsStore.themeFlow(ctx).collectAsState(initial = "dark")
    val dark = when (theme) {
        "dark" -> true
        "light" -> false
        else -> androidx.compose.foundation.isSystemInDarkTheme()
    }
    MaterialTheme(
        colorScheme = if (dark) darkColorScheme(
            primary = Color(0xFF5B2C83),
            secondary = Color(0xFFA469F7),
            background = PurpleThemeTokens.bg,
            surface = PurpleThemeTokens.surface,
            onBackground = Color(0xFFEDEAF3),
            onSurface = Color(0xFFEDEAF3)
        ) else lightColorScheme(
            primary = Color(0xFF5B2C83),
            secondary = Color(0xFFA469F7),
            background = Color(0xFFFFFFFF),
            surface = Color(0xFFF6F5FA),
            onBackground = Color(0xFF151022),
            onSurface = Color(0xFF151022)
        ),
        content = content
    )
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // طلب إذن الإشعارات على أندرويد 13+
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                val launcher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { _ -> }
                launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        // تطبيق اللغة المخزنة على واجهة النظام
        lifecycleScope.launchWhenCreated {
            SettingsStore.languageFlow(this@MainActivity).collect { applyAppLocale(this@MainActivity, it) }
        }
        setContent {
            AppTheme {
                Surface(color = PurpleThemeTokens.bg) {
                    HomeScreen()
                }
            }
        }
    }
}

@Composable
fun HomeScreen() {
    val ctx = LocalContext.current
    var data by remember { mutableStateOf<Map<String, List<Channel>>>(emptyMap()) }
    var epg by remember { mutableStateOf<Map<String, EpgNowNext>>(emptyMap()) }
    var loading by remember { mutableStateOf(true) }
    val playlist by SettingsStore.playlistFlow(ctx).collectAsState(initial = "")
    val epgUrl by SettingsStore.epgFlow(ctx).collectAsState(initial = "")

    LaunchedEffect(playlist, epgUrl) {
        loading = true
        data = withContext(Dispatchers.IO) { ChannelRepository.loadChannels(ctx) }
        epg = withContext(Dispatchers.IO) { EPGRepository.load(ctx) }
        loading = false
    }

    var showSettings by remember { mutableStateOf(false) }

    val isTv = ctx.isTelevision()

    Scaffold(
        topBar = {
            SmallTopAppBar(title = { Text(stringResource(id = R.string.app_name)) }, actions = {
                TextButton(onClick = { showSettings = true }) { Text(stringResource(id = R.string.settings)) }
            })
        },
        containerColor = PurpleThemeTokens.bg
    ) { padding ->
        if (showSettings) {
            SettingsScreen(onClose = { showSettings = false })
        } else {
            if (playlist.isBlank()) {
                Onboarding(padding)
            } else if (loading) {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (isTv) {
                TvHome(padding, data, epg)
            } else {
                PhoneHome(padding, data, epg)
            }
        }
    }
}

@Composable
fun ChannelCard(ch: Channel, onClick: () -> Unit, nowNext: EpgNowNext? = null) {
    var focused by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (focused) 1.07f else 1f, label = "focus-scale")
    Card(
        onClick = onClick,
        modifier = Modifier
            .padding(6.dp)
            .size(width = 220.dp, height = 150.dp)
            .graphicsLayer(scaleX = scale, scaleY = scale)
            .onFocusChanged { focused = it.isFocused }
            .focusable(),
        colors = CardDefaults.cardColors(containerColor = PurpleThemeTokens.surface)
    ) {
        Box(Modifier.fillMaxSize()) {
            Column(Modifier.fillMaxSize().padding(12.dp)) {
                if (!ch.logo.isNullOrEmpty()) {
                    AsyncImage(model = ch.logo, contentDescription = ch.title, modifier = Modifier.height(72.dp))
                } else {
                    Spacer(Modifier.height(72.dp))
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(ch.title, color = Color(0xFFEDEAF3), fontWeight = FontWeight.SemiBold, maxLines = 2)
                if (nowNext?.now != null) {
                    Spacer(Modifier.height(6.dp))
                    Text(nowNext.now.title, color = Color(0xFFAAA3BA), fontSize = 11.sp, maxLines = 1)
                    val progress = progressOf(nowNext.now)
                    LinearProgressIndicator(progress = progress, modifier = Modifier.fillMaxWidth().height(4.dp))
                } else {
                    Spacer(Modifier.height(8.dp))
                    Text(stringResource(id = R.string.live), color = Color(0xFFAAA3BA), fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun PurpleTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF5B2C83),
            secondary = Color(0xFFA469F7),
            background = PurpleThemeTokens.bg,
            surface = PurpleThemeTokens.surface,
            onBackground = Color(0xFFEDEAF3),
            onSurface = Color(0xFFEDEAF3)
        ),
        content = content
    )
}

object PurpleThemeTokens {
    val bg = Color(0xFF0E0B14)
    val surface = Color(0xFF151022)
}

@Composable
fun PhoneHome(padding: PaddingValues, data: Map<String, List<Channel>>, epg: Map<String, EpgNowNext> = emptyMap()) {
    val ctx = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PurpleThemeTokens.bg)
            .padding(padding)
            .padding(16.dp)
    ) {
        Text(
            text = stringResource(id = R.string.premium_tagline),
            color = Color(0xFFAAA3BA)
        )
        Spacer(Modifier.height(16.dp))

        // اعرض كل القنوات على شكل شبكة بسيطة
        val flat = data.values.flatten()
        LazyVerticalGrid(columns = GridCells.Adaptive(minSize = 160.dp), content = {
            items(flat) { ch ->
                ChannelCard(ch, nowNext = epg[ch.title]) {
                    val i = Intent(ctx, PlayerActivity::class.java)
                    i.putExtra("url", ch.url)
                    i.putExtra("title", ch.title)
                    ctx.startActivity(i)
                }
            }
        }, modifier = Modifier.fillMaxSize())
    }
}

@Composable
fun TvHome(padding: PaddingValues, data: Map<String, List<Channel>>, epg: Map<String, EpgNowNext> = emptyMap()) {
    val ctx = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PurpleThemeTokens.bg)
            .padding(padding)
            .padding(24.dp)
    ) {
        Text(text = stringResource(id = R.string.premium_tagline), color = Color(0xFFAAA3BA))
        Spacer(Modifier.height(16.dp))
        // صفوف أفقية لكل فئة (أسلوب TV)
        data.forEach { (cat, list) ->
            Text(text = cat, color = Color(0xFFEDEAF3), fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(8.dp))
            androidx.compose.foundation.lazy.LazyRow(
                contentPadding = PaddingValues(horizontal = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(list.size) { idx ->
                    val ch = list[idx]
                    ChannelCard(ch, nowNext = epg[ch.title]) {
                        val i = Intent(ctx, PlayerActivity::class.java)
                        i.putExtra("url", ch.url)
                        i.putExtra("title", ch.title)
                        ctx.startActivity(i)
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

private fun progressOf(item: EpgItem): Float {
    val now = System.currentTimeMillis()
    if (now <= item.start) return 0f
    if (now >= item.end) return 1f
    val total = (item.end - item.start).coerceAtLeast(1)
    val done = now - item.start
    return (done.toFloat() / total.toFloat()).coerceIn(0f, 1f)
}

@Composable
fun Onboarding(padding: PaddingValues) {
    val ctx = LocalContext.current
    var showSettings by remember { mutableStateOf(false) }
    if (showSettings) {
        SettingsScreen(onClose = { showSettings = false })
        return
    }
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PurpleThemeTokens.bg)
            .padding(padding)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = stringResource(id = R.string.app_name), color = Color(0xFFEDEAF3), fontWeight = FontWeight.Bold, fontSize = 24.sp)
        Spacer(Modifier.height(8.dp))
        Text(text = "أضف رابط قائمة تشغيل M3U للبدء", color = Color(0xFFAAA3BA))
        Spacer(Modifier.height(16.dp))
        Button(onClick = { showSettings = true }) { Text(stringResource(id = R.string.settings)) }
    }
}
