import "./DeleteServiceModal.css";

const DeleteServiceModal = ({ serviceName, onConfirm, onCancel }) => {
  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div
        className="delete-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          delete service pop up
        </div>

        <div className="delete-modal-body">
          <h2>Delete Service?</h2>
          <p>Are you sure you want to delete "{serviceName}"?</p>
        </div>

        <div className="delete-modal-actions">
          <button
            className="delete-modal-btn delete-modal-yes"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="delete-modal-btn delete-modal-no"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteServiceModal;