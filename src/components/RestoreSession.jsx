import './RestoreSession.css';

export function RestoreSession({ savedAt, onRestore, onDiscard }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="restore-overlay">
      <div className="restore-modal">
        <div className="restore-icon">💾</div>
        <h2>Khôi phục phiên làm việc?</h2>
        <p>
          Chúng tôi đã lưu phiên làm việc trước đó từ <strong>{formatTime(savedAt)}</strong>
        </p>
        <p className="restore-note">
          Bạn có thể tiếp tục chỉnh sửa quiz hoặc bắt đầu lại từ đầu.
        </p>
        
        <div className="restore-actions">
          <button className="btn btn-discard" onClick={onDiscard}>
            Bắt đầu mới
          </button>
          <button className="btn btn-restore" onClick={onRestore}>
            Khôi phục
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestoreSession;
