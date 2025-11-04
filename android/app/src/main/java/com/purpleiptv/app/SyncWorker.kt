package com.purpleiptv.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        return try {
            // حدث الكاش فقط – النتائج تُخزن في ملفات الكاش
            ChannelRepository.loadChannels(applicationContext)
            EPGRepository.load(applicationContext)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    companion object {
        private const val WORK_NAME = "purple_sync"
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val work = PeriodicWorkRequestBuilder<SyncWorker>(4, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                work
            )
        }
    }
}

