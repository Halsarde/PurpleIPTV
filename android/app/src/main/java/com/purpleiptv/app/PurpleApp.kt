package com.purpleiptv.app

import android.app.Application

class PurpleApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SyncWorker.schedule(this)
    }
}

