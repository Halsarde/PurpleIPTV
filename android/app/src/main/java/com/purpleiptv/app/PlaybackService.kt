package com.purpleiptv.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.ui.PlayerNotificationManager

class PlaybackService : MediaSessionService() {
    private var player: ExoPlayer? = null
    private var session: MediaSession? = null
    private var notificationManager: PlayerNotificationManager? = null

    override fun onCreate() {
        super.onCreate()
        player = ExoPlayer.Builder(this).build().apply {
            setSeekBackIncrementMs(10_000)
            setSeekForwardIncrementMs(10_000)
        }
        session = MediaSession.Builder(this, player!!).build()
        AppCtx.holder = PlaybackServiceHolder(player!!)
        createChannel()
        setupNotification()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onDestroy() {
        notificationManager?.setPlayer(null)
        session?.release()
        player?.release()
        session = null
        player = null
        AppCtx.holder = null
        super.onDestroy()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW)
            channel.description = "Media playback controls"
            channel.enableLights(false)
            channel.enableVibration(false)
            channel.lightColor = Color.MAGENTA
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun setupNotification() {
        notificationManager = PlayerNotificationManager.Builder(this, NOTIF_ID, CHANNEL_ID)
            .setMediaDescriptionAdapter(object : PlayerNotificationManager.MediaDescriptionAdapter {
                override fun getCurrentContentTitle(player: androidx.media3.common.Player): CharSequence {
                    return player.mediaMetadata.title ?: "Purple IPTV"
                }

                override fun createCurrentContentIntent(player: androidx.media3.common.Player): PendingIntent? {
                    val intent = Intent(this@PlaybackService, PlayerActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
                    return PendingIntent.getActivity(this@PlaybackService, 1, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
                }

                override fun getCurrentContentText(player: androidx.media3.common.Player): CharSequence? {
                    return player.mediaMetadata.subtitle
                }

                override fun getCurrentLargeIcon(player: androidx.media3.common.Player, callback: PlayerNotificationManager.BitmapCallback): android.graphics.Bitmap? {
                    return null
                }
            })
            .setSmallIconResourceId(R.drawable.ic_notification)
            .build()

        notificationManager?.setUseFastForwardAction(true)
        notificationManager?.setUseRewindAction(true)
        notificationManager?.setPlayer(player)
        notificationManager?.setPriority(NotificationCompat.PRIORITY_LOW)
        notificationManager?.setNotificationListener(object : PlayerNotificationManager.NotificationListener {
            override fun onNotificationPosted(notificationId: Int, notification: Notification, ongoing: Boolean) {
                if (ongoing) {
                    startForeground(notificationId, notification)
                } else {
                    stopForeground(false)
                }
            }

            override fun onNotificationCancelled(notificationId: Int, dismissedByUser: Boolean) {
                stopForeground(true)
                stopSelf()
            }
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val url = intent?.getStringExtra(EXTRA_URL)
        val title = intent?.getStringExtra(EXTRA_TITLE)
        if (!url.isNullOrEmpty()) {
            val media = MediaItem.Builder()
                .setUri(url)
                .setMediaMetadata(
                    androidx.media3.common.MediaMetadata.Builder()
                        .setTitle(title ?: "Purple IPTV")
                        .setSubtitle("Live")
                        .build()
                )
                .build()
            player?.setMediaItem(media)
            player?.prepare()
            player?.playWhenReady = true
        }
        return START_STICKY
    }

    companion object {
        const val CHANNEL_ID = "purple_playback"
        const val NOTIF_ID = 1001
        const val EXTRA_URL = "url"
        const val EXTRA_TITLE = "title"

        fun start(context: Context, url: String, title: String) {
            val i = Intent(context, PlaybackService::class.java)
            i.putExtra(EXTRA_URL, url)
            i.putExtra(EXTRA_TITLE, title)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(i)
            } else {
                context.startService(i)
            }
        }

        fun player(): ExoPlayer? {
            // حقن بسيط للوصول إلى اللاعب من النشاط
            // ملاحظة: يمكن استبداله بربط (bind) إن رغبت لاحقًا
            return (AppCtx.holder as? PlaybackServiceHolder)?.player
        }
    }
}

// حامل بسيط لإتاحة مرجع الخدمة/المشغل بدون ربط معقّد
object AppCtx {
    var holder: Any? = null
}

class PlaybackServiceHolder(val player: ExoPlayer)
