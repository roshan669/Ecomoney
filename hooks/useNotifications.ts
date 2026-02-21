import { ToastAndroid } from "react-native";
import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from "@notifee/react-native";

export const useNotifications = () => {
  const setupDailyReminder = async () => {
    const existingNotifications = await notifee.getTriggerNotificationIds();
    if (existingNotifications.length > 0) {
      console.log("Notification already scheduled");
      return;
    }

    const channelId = await notifee.createChannel({
      id: "expense-reminders",
      name: "Expense Reminders",
    });

    const triggerDate = new Date();
    triggerDate.setHours(19);
    triggerDate.setMinutes(10);
    triggerDate.setSeconds(0);

    if (triggerDate.getTime() <= Date.now()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: true,
    };

    await notifee.createTriggerNotification(
      {
        id: "daily-expense-reminder",
        title: "💰 Track Your Expenses",
        body: "Don't forget to log today's expenses!",
        android: {
          channelId,
          smallIcon: "ic_notification",
          color: "#4F46E5",
          pressAction: {
            id: "default",
          },
        },
        data: {
          action: "open_expense_sheet",
        },
      },
      trigger,
    );

    ToastAndroid.show(
      `Daily reminder set for ${triggerDate.toLocaleTimeString()}`,
      ToastAndroid.SHORT,
    );
  };

  return { setupDailyReminder };
};
