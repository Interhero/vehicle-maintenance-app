self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    if (event.data) {
        let data = {};
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: "Notification", body: event.data.text() };
        }

        const options = {
            body: data.body || "You have a new vehicle alert.",
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [100, 50, 100],
            tag: 'vehicle-alert', // This helps Android consolidate multiple alerts
            renotify: true,
            data: {
                dateOfArrival: Date.now(),
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title || "Vehicle Alert", options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
