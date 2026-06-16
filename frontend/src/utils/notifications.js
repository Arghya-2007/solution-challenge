export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }
    
    if (Notification.permission === "granted") {
        return true;
    }
    
    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }
    
    return false;
};

export const sendNotification = (title, options = {}) => {
    if (!("Notification" in window)) return;
    
    // Only send if permission is granted and document is hidden (user minimized or changed tab)
    if (Notification.permission === "granted" && document.visibilityState === "hidden") {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            ...options
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
};
