import { PushNotifications } from '@capacitor/push-notifications';

export async function registerNativePush() {
  let permStatus = await PushNotifications.checkPermissions();
  if (permStatus.receive !== 'granted') {
    permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') return;
  }
  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    console.log('Push token:', token.value);
    // TODO: send token to your server (Supabase Edge Function)
  });
  PushNotifications.addListener('registrationError', (err) => {
    console.warn('Push registration error', err);
  });
  PushNotifications.addListener('pushNotificationReceived', (notif) => {
    console.log('Push received', notif);
  });
}
