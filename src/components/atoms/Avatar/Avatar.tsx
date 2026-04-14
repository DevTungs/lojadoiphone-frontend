import React from 'react';
import styles from './Avatar.module.css';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  src?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', src, className = '' }) => {
  const classNames = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  return (
    <div className={classNames} aria-label={name} title={name}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={styles.image}
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.textContent = getInitials(name);
            }
          }}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};

export default Avatar;
