'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { Bell, Check, Info } from 'lucide-react';
import { Button } from '../ui/Button';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markNotificationRead } = useAppStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-10 h-10 rounded-full p-0 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-risk-high rounded-full animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-panel border border-border-glass rounded-card shadow-xl overflow-hidden z-50 backdrop-blur-xl">
          <div className="px-4 py-3 border-b border-border-glass flex justify-between items-center bg-panel/80">
            <h4 className="font-display font-medium text-sm">Notifications</h4>
            <span className="text-xs text-secondary">{unreadCount} unread</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-secondary text-sm">
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-border-glass">
                {notifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-4 transition-colors hover:bg-panel/50 ${!notification.read ? 'bg-accent-cyan/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info className={`w-4 h-4 ${!notification.read ? 'text-accent-cyan' : 'text-secondary'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? 'text-primary font-medium' : 'text-secondary'}`}>
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <button 
                            onClick={() => markNotificationRead(notification.id)}
                            className="mt-2 text-xs flex items-center text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                          >
                            <Check className="w-3 h-3 mr-1" /> Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
