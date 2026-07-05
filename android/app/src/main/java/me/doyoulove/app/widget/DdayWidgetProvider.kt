package me.doyoulove.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import me.doyoulove.app.R
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * Home-screen widget that shows "D+N" since the couple's start date.
 *
 * Data source: the value written by the WebView via @capacitor/preferences,
 * which lands in SharedPreferences file "CapacitorStorage" under key "dday"
 * as JSON: { "startDate": "YYYY-MM-DD", "dayCount": N, "updatedAt": ms }.
 *
 * The widget recomputes the day count itself and re-renders every midnight via
 * AlarmManager (D-Day changes once a day → no battery drain). Uses Calendar
 * (not java.time) so it works on older minSdk without desugaring.
 */
class DdayWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) renderWidget(context, appWidgetManager, id)
        scheduleMidnightUpdate(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_MIDNIGHT_UPDATE) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                ComponentName(context, DdayWidgetProvider::class.java)
            )
            for (id in ids) renderWidget(context, mgr, id)
            scheduleMidnightUpdate(context)
        }
    }

    private fun renderWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.dday_widget)
        val startMillis = readStartMillis(context)

        if (startMillis != null) {
            val days = dayCountFrom(startMillis)
            views.setTextViewText(R.id.widget_dday, "D+$days")
            views.setTextViewText(R.id.widget_label, "우리가 만난 지")
        } else {
            views.setTextViewText(R.id.widget_dday, "D+—")
            views.setTextViewText(R.id.widget_label, "앱을 열어 연결해 주세요")
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun readStartMillis(context: Context): Long? {
        return try {
            val prefs =
                context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("dday", null) ?: return null
            val startDate = JSONObject(raw).optString("startDate", "")
            if (startDate.isBlank()) return null
            SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(startDate)?.time
        } catch (e: Exception) {
            null
        }
    }

    private fun dayCountFrom(startMillis: Long): Long {
        val start = midnight(Calendar.getInstance().apply { timeInMillis = startMillis })
        val today = midnight(Calendar.getInstance())
        val diff = today.timeInMillis - start.timeInMillis
        // "met day = day 1" convention
        return diff / 86_400_000L + 1
    }

    private fun midnight(c: Calendar): Calendar {
        c.set(Calendar.HOUR_OF_DAY, 0)
        c.set(Calendar.MINUTE, 0)
        c.set(Calendar.SECOND, 0)
        c.set(Calendar.MILLISECOND, 0)
        return c
    }

    private fun scheduleMidnightUpdate(context: Context) {
        val alarmManager =
            context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, DdayWidgetProvider::class.java).apply {
            action = ACTION_MIDNIGHT_UPDATE
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val nextMidnight = midnight(Calendar.getInstance()).apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.SECOND, 5)
        }

        // Inexact alarm — no SCHEDULE_EXACT_ALARM permission needed (Android 12+),
        // and D-Day tolerates a few minutes of drift after midnight.
        alarmManager.set(
            AlarmManager.RTC,
            nextMidnight.timeInMillis,
            pendingIntent
        )
    }

    companion object {
        const val ACTION_MIDNIGHT_UPDATE = "me.doyoulove.app.widget.MIDNIGHT_UPDATE"
    }
}
