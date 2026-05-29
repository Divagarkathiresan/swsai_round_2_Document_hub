import NotificationDrawer from './NotificationDrawer';

function Header({
  notifications,
  unreadCount,
  isNotificationOpen,
  onToggleNotifications,
  onMarkAllRead,
  onClearNotifications
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">SWSAI Document Hub</p>
        <h1>Company PDF uploads</h1>
      </div>
      <div className="topbar-actions">
        <NotificationDrawer
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={isNotificationOpen}
          onToggle={onToggleNotifications}
          onMarkAllRead={onMarkAllRead}
          onClearNotifications={onClearNotifications}
        />
        <div className="status-pill">
          <span />
          Upload service
        </div>
      </div>
    </header>
  );
}

export default Header;
