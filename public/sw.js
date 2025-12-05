// Service Worker for Accountabili-Bot PWA

const CACHE_NAME = "accountabili-v1";
const OFFLINE_URL = "/offline";

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/journal",
  "/commitments",
  "/strategies",
  "/dashboard",
  "/settings",
  "/manifest.json",
];

// Install event - precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API requests and auth routes
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Try to return cached version
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    // Default actions based on notification type
    let actions = data.actions;
    if (!actions && data.type === "task_reminder") {
      actions = [
        { action: "complete", title: "Done" },
        { action: "snooze", title: "Snooze 15m" },
      ];
    } else if (!actions) {
      actions = [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" },
      ];
    }

    const options = {
      body: data.body || "You have a new notification",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [100, 50, 100],
      tag: data.tag || "default", // Prevents duplicate notifications
      renotify: true,
      requireInteraction: data.type === "task_reminder", // Keep task reminders visible
      data: {
        url: data.url || "/journal",
        taskId: data.taskId,
        type: data.type,
      },
      actions,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Writrospect", options)
    );
  } catch (error) {
    console.error("Push notification error:", error);
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || "/journal";

  // Handle task-specific actions
  if (action === "complete" && data.taskId) {
    // Call API to mark task complete
    event.waitUntil(
      fetch(`/api/tasks/${data.taskId}/complete`, {
        method: "POST",
        credentials: "same-origin",
      }).then(() => {
        // Show confirmation
        self.registration.showNotification("Task Completed", {
          body: "Nice work!",
          icon: "/icons/icon-192.png",
          tag: "task-complete",
        });
      }).catch(() => {
        // On error, just open the app
        clients.openWindow(url);
      })
    );
    return;
  }

  if (action === "snooze" && data.taskId) {
    // Call API to snooze task for 15 minutes
    event.waitUntil(
      fetch(`/api/tasks/${data.taskId}/snooze`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: 15 }),
      }).then(() => {
        self.registration.showNotification("Snoozed", {
          body: "Reminder will come again in 15 minutes",
          icon: "/icons/icon-192.png",
          tag: "task-snooze",
        });
      }).catch(() => {
        clients.openWindow(url);
      })
    );
    return;
  }

  if (action === "dismiss") return;

  // Default: open the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
