import { getInitials } from '@/lib/utils';
import type { AvatarVM } from './types';

type AvatarListProps = {
  avatars: AvatarVM[];
  maxVisible?: number;
};

/**
 * Displays a list of user avatars with overflow indicator
 * Shows first N avatars and "+X" badge for remaining
 */
export default function AvatarList({ avatars, maxVisible = 5 }: AvatarListProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = Math.max(0, avatars.length - maxVisible);

  if (avatars.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {visibleAvatars.map((avatar) => {
        const borderColor = avatar.isCreator 
          ? 'border-yellow-400 ring-2 ring-yellow-400/30' 
          : 'border-card';
        const title = avatar.isCreator 
          ? `${avatar.fullName || 'Unknown user'} (Twórca grupy)` 
          : avatar.fullName || 'Unknown user';
        
        return (
          <div
            key={avatar.profileId}
            className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 ${borderColor} bg-secondary/30 text-xs font-semibold text-primary shadow-sm`}
            title={title}
          >
            {avatar.avatarUrl ? (
              <img
                src={avatar.avatarUrl}
                alt={avatar.fullName || 'User avatar'}
                className="h-full w-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span aria-label={avatar.fullName || 'Unknown user'}>
                {getInitials(avatar.fullName)}
              </span>
            )}
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground shadow-sm"
          title={`${remainingCount} more member${remainingCount !== 1 ? 's' : ''}`}
          aria-label={`${remainingCount} more member${remainingCount !== 1 ? 's' : ''}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

