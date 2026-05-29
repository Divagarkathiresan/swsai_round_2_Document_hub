import { BellIcon, CheckIcon } from './Icons';
import { formatTime } from '../utils/formatters';

function NotificationDrawer({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onMarkAllRead,
  onClearNotifications
}) {
  return (
    <>
      <button
        className="notification-button"
        type="button"
        aria-label="Open notifications"
        title="Notifications"
        onClick={onToggle}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-drawer">
          <div className="notification-header">
            <strong>Notifications</strong>
            <div>
              <button type="button" onClick={onMarkAllRead} disabled={!unreadCount}>
                Mark all read
              </button>
              <button type="button" onClick={onClearNotifications} disabled={!notifications.length}>
                Clear all
              </button>
            </div>
          </div>
          {notifications.length ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  className={`notification-item ${notification.type} ${notification.read ? 'is-read' : ''}`}
                  key={notification._id}
                >
                  <span className="notification-status-icon">
                    <CheckIcon />
                  </span>
                  <div>
                    <p>{notification.message}</p>
                    <time>{formatTime(notification.createdAt)}</time>
                  </div>
                  {!notification.read && <span className="unread-dot" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="notification-empty">No notifications yet.</div>
          )}
        </div>
      )}
    </>
  );
}

export default NotificationDrawer;
