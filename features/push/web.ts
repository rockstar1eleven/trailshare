export async function registerWebPush(vapidPublicKey?: string) {
  if (!('serviceWorker' in navigator)) return;
  if (!('PushManager' in window)) return;
  if (!vapidPublicKey) return;
  const reg = await navigator.serviceWorker.ready;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  } catch (e) {
    console.warn('Web push subscribe failed', e);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
