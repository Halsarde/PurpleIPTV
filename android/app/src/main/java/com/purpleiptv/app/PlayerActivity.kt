package com.purpleiptv.app

import android.app.PictureInPictureParams
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.view.KeyEvent
import android.view.ViewGroup
import android.view.WindowManager
import android.app.AlertDialog
import androidx.annotation.StringRes
import androidx.activity.ComponentActivity
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView

class PlayerActivity : ComponentActivity() {
    private var playerView: PlayerView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val pv = PlayerView(this)
        pv.layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        pv.useController = true
        setContentView(pv)
        playerView = pv

        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
    }

    private fun urlFromIntent(): String? = intent?.getStringExtra("url")
    private fun titleFromIntent(): String? = intent?.getStringExtra("title")

    private fun initPlayer() {
        val url = urlFromIntent()
        val title = titleFromIntent() ?: "Purple IPTV"
        if (!url.isNullOrEmpty()) {
            PlaybackService.start(this, url, title)
        }
        attachToServicePlayer()
    }

    private fun attachToServicePlayer(retries: Int = 10) {
        val p = PlaybackService.player()
        if (p != null) {
            playerView?.player = p
        } else if (retries > 0) {
            playerView?.postDelayed({ attachToServicePlayer(retries - 1) }, 100)
        }
    }

    override fun onStart() {
        super.onStart()
        initPlayer()
    }

    override fun onStop() {
        super.onStop()
        // لا نحرر اللاعب؛ الخدمة تدير عمره من أجل التشغيل بالخلفية
        playerView?.player = null
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        val p = PlaybackService.player() ?: return super.onKeyDown(keyCode, event)
        return when (keyCode) {
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                p.playWhenReady = !p.playWhenReady
                true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY -> { p.playWhenReady = true; true }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> { p.playWhenReady = false; true }
            KeyEvent.KEYCODE_CAPTIONS_TOGGLE -> { toggleSubtitles(); true }
            KeyEvent.KEYCODE_M, KeyEvent.KEYCODE_MENU -> { showOptions(); true }
            KeyEvent.KEYCODE_VOLUME_UP, KeyEvent.KEYCODE_VOLUME_DOWN -> false
            else -> super.onKeyDown(keyCode, event)
        }
    }

    private fun showOptions() {
        val items = arrayOf(getString(R.string.quality), getString(R.string.subtitles))
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.options))
            .setItems(items) { _, which ->
                when (which) {
                    0 -> showQualityDialog()
                    1 -> showSubtitlesDialog()
                }
            }.setNegativeButton(android.R.string.cancel, null).show()
    }

    private fun showQualityDialog() {
        val p = PlaybackService.player() ?: return
        val options = arrayOf(getString(R.string.auto), "1080p", "720p", "480p")
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.quality))
            .setItems(options) { _, which ->
                val builder = p.trackSelectionParameters.buildUpon()
                if (which == 0) {
                    builder.clearOverridesOfType(androidx.media3.common.C.TRACK_TYPE_VIDEO)
                    builder.clearVideoSizeConstraints()
                    p.trackSelectionParameters = builder.build()
                    return@setItems
                }
                val targetH = when (which) { 1 -> 1080; 2 -> 720; else -> 480 }
                val tracks = p.currentTracks
                var applied = false
                for (g in tracks.groups) {
                    if (g.type == androidx.media3.common.C.TRACK_TYPE_VIDEO) {
                        val group = g.mediaTrackGroup
                        var bestIndex = -1
                        var bestDelta = Int.MAX_VALUE
                        for (i in 0 until group.length) {
                            val h = group.getFormat(i).height
                            if (h > 0) {
                                val delta = kotlin.math.abs(h - targetH)
                                if (delta < bestDelta) { bestDelta = delta; bestIndex = i }
                            }
                        }
                        if (bestIndex >= 0) {
                            val override = androidx.media3.common.TrackSelectionOverride(group, listOf(bestIndex))
                            builder.clearOverridesOfType(androidx.media3.common.C.TRACK_TYPE_VIDEO)
                            builder.addOverride(override)
                            applied = true
                            break
                        }
                    }
                }
                if (!applied) {
                    // fallback إلى قيود الحجم
                    when (targetH) {
                        1080 -> builder.setMaxVideoSize(1920, 1080)
                        720 -> builder.setMaxVideoSize(1280, 720)
                        else -> builder.setMaxVideoSize(854, 480)
                    }
                }
                p.trackSelectionParameters = builder.build()
            }.setNegativeButton(android.R.string.cancel, null).show()
    }

    private fun showSubtitlesDialog() {
        val p = PlaybackService.player() ?: return
        val tracks = p.currentTracks
        val languages = mutableListOf(getString(android.R.string.cancel))
        val langs = mutableListOf<String?>(null)
        for (g in tracks.groups) {
            val fmt = g.mediaTrackGroup
            for (i in 0 until fmt.length) {
                val lang = fmt.getFormat(i).language
                if (!lang.isNullOrEmpty() && !languages.contains(lang)) {
                    languages.add(lang)
                    langs.add(lang)
                }
            }
        }
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.subtitles))
            .setItems(languages.toTypedArray()) { _, which ->
                val builder = p.trackSelectionParameters.buildUpon()
                val lang = langs[which]
                if (lang == null) {
                    builder.setPreferredTextLanguage(null)
                    builder.setTrackTypeDisabled(androidx.media3.common.C.TRACK_TYPE_TEXT, true)
                } else {
                    builder.setPreferredTextLanguage(lang)
                    builder.setTrackTypeDisabled(androidx.media3.common.C.TRACK_TYPE_TEXT, false)
                }
                p.trackSelectionParameters = builder.build()
            }.setNegativeButton(android.R.string.cancel, null).show()
    }

    private fun toggleSubtitles() {
        val p = PlaybackService.player() ?: return
        val disabled = p.trackSelectionParameters.isTrackTypeDisabled(androidx.media3.common.C.TRACK_TYPE_TEXT)
        val builder = p.trackSelectionParameters.buildUpon()
        builder.setTrackTypeDisabled(androidx.media3.common.C.TRACK_TYPE_TEXT, !disabled)
        p.trackSelectionParameters = builder.build()
    }

    @OptIn(UnstableApi::class)
    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            enterPictureInPictureMode(params)
        }
    }
}
