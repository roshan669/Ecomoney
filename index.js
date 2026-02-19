import notifee, { EventType } from '@notifee/react-native';
import 'expo-router/entry';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Background event:', type);
  if (type === EventType.PRESS && detail.notification?.data?.action === 'open_expense_sheet') {
    console.log('Opening app to expense sheet');
    await notifee.cancelNotification(detail.notification.id);
  }
});
