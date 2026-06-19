package me.doyoulove.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import me.doyoulove.app.R
import org.json.JSONObject
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.Calendar

/**
 * Home-screen widget that shows "D+N" since the couple's start date.
 *
 * Data source: the value written by the WebView via @capacitor/preferences,
 * which lands in SharedPreferences file "CapacitorStorage" under key "dday"
 * as JSON: { "startDate": "YYYY-MM-DD", "dayCount": N, "updatedAt": ms }.
 *
 * The widget recomputes the day count itself (so it stays correct even if the
 * app hasn't been opened that day) and re-renders every midnight via
 * AlarmManager — D-Day only changes once a day, so we avoid battery drain.
 */
class DdayWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            renderWidget(context, appWidgetManager, id)
        }
        scheduleMidnightUpdate(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_MIDNIGHT_UPDATE) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                android.content.ComponentName(context, DdayWidgetProvider::class.java)
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
        val startDate = readStartDate(context)

        if (startDate != null) {
            val days = ChronoUnit.DAYS.between(startDate, LocalDate.now()) + 1
            views.setTextViewText(R.id.widget_dday, "D+$days")
            views.setTextViewText(R.id.widget_label, "우리가 만난 지")
        } else {
            views.setTextViewText(R.id.widget_dday, "D+—")
            views.setTextViewText(R.id.widget_label, "앱을 열어 연결해 주세요")
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun readStartDate(context: Context): LocalDate? {
        return try {
            val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
            val raw = prefs.getString("dday", null) ?: return null
            val startDate = JSONObject(raw).optString("startDate", "")
            if (startDate.isBlank()) null else LocalDate.parse(startDate)
        } catch (e: Exception) {
            null
        }
    }

    private fun scheduleMidnightUpdate(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, DdayWidgetProvider::class.java).apply {
            action = ACTION_MIDNIGHT_UPDATE
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val nextMidnight = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 5)
        }

        alarmManager.setExact(
            AlarmManager.RTC,
            nextMidnight.timeInMillis,
            pendingIntent
        )
    }

    companion object {
        const val ACTION_MIDNIGHT_UPDATE = "me.doyoulove.app.widget.MIDNIGHT_UPDATE"
    }
}
