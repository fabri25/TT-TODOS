// Notification.js
import React, { useEffect } from 'react';
import '../styles/Notification.css';

const Notification = ({ type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`notification ${type}`}>
            <div className="notification-icon">
                {type === 'success' ? (
                    <i className="bi bi-check-circle-fill"></i>
                ) : (
                    <i className="bi bi-x-circle-fill"></i>
                )}
            </div>
            <div className="notification-message">
                {message}
            </div>
        </div>
    );
};

export default Notification;
