import { Link } from 'react-router-dom';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useVote } from '../context/VoteContext';
import { useAuth } from '../context/AuthContext';

function PostCard({ post, compact = false }) {
  const formattedDate = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  const { vote, getVote, getAdjustedScore } = useVote();
  const { isAuthenticated } = useAuth();

  const currentVote = getVote(post.id);
  const adjustedScore = getAdjustedScore(post.id, post.score);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      // Could show a tooltip or redirect to login
      return;
    }
    await vote(post.id, 'up');
  };

  const handleDownvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }
    await vote(post.id, 'down');
  };

  return (
    <article className="glass-card glass-card-hover p-4 animate-fade-in">
      <div className="flex gap-3">
        {/* Vote buttons - Desktop */}
        <div className="hidden sm:flex flex-col items-center gap-1 pt-1">
          <button
            onClick={handleUpvote}
            className={`p-1 rounded transition-colors ${
              currentVote === 'up'
                ? 'bg-orange-500/20 text-orange-400'
                : 'hover:bg-white/10 text-gray-400 hover:text-orange-400'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isAuthenticated ? 'Upvote' : 'Sign in to vote'}
          >
            <ArrowBigUp className={`w-6 h-6 ${currentVote === 'up' ? 'fill-current' : ''}`} />
          </button>
          <span className={`text-sm font-semibold ${
            currentVote === 'up' ? 'text-orange-400' :
            currentVote === 'down' ? 'text-blue-400' :
            adjustedScore > 0 ? 'text-orange-400' :
            adjustedScore < 0 ? 'text-blue-400' : 'text-gray-400'
          }`}>
            {formatScore(adjustedScore)}
          </span>
          <button
            onClick={handleDownvote}
            className={`p-1 rounded transition-colors ${
              currentVote === 'down'
                ? 'bg-blue-500/20 text-blue-400'
                : 'hover:bg-white/10 text-gray-400 hover:text-blue-400'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isAuthenticated ? 'Downvote' : 'Sign in to vote'}
          >
            <ArrowBigDown className={`w-6 h-6 ${currentVote === 'down' ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta info */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <a
              href={`https://lemmy.world/c/${post.community}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-presearch hover:underline"
            >
              c/{post.community}
            </a>
            <span>•</span>
            <span>Posted by u/{post.author}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          {/* Title */}
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <h2 className={`font-semibold text-white group-hover:text-presearch transition-colors ${compact ? 'text-sm line-clamp-2' : 'text-lg'}`}>
              {post.title}
              <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
            </h2>
          </a>

          {/* Excerpt/Preview */}
          {!compact && post.excerpt && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Thumbnail */}
          {!compact && post.thumbnail && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3"
            >
              <img
                src={post.thumbnail}
                alt=""
                className="max-h-80 rounded-lg object-cover hover:opacity-90 transition-opacity"
              />
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-3">
            {/* Mobile vote */}
            <div className="flex sm:hidden items-center gap-1 mr-2">
              <button
                onClick={handleUpvote}
                className={`p-1.5 rounded transition-colors ${
                  currentVote === 'up'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'hover:bg-white/10 text-gray-400 hover:text-orange-400'
                } ${!isAuthenticated ? 'opacity-50' : ''}`}
              >
                <ArrowBigUp className={`w-5 h-5 ${currentVote === 'up' ? 'fill-current' : ''}`} />
              </button>
              <span className={`text-xs font-semibold min-w-6 text-center ${
                currentVote === 'up' ? 'text-orange-400' :
                currentVote === 'down' ? 'text-blue-400' :
                adjustedScore > 0 ? 'text-orange-400' : 'text-gray-400'
              }`}>
                {formatScore(adjustedScore)}
              </span>
              <button
                onClick={handleDownvote}
                className={`p-1.5 rounded transition-colors ${
                  currentVote === 'down'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-white/10 text-gray-400 hover:text-blue-400'
                } ${!isAuthenticated ? 'opacity-50' : ''}`}
              >
                <ArrowBigDown className={`w-5 h-5 ${currentVote === 'down' ? 'fill-current' : ''}`} />
              </button>
            </div>

            <ActionButton icon={<MessageSquare className="w-4 h-4" />} label={`${post.commentCount} comments`} />
            <ActionButton icon={<Share2 className="w-4 h-4" />} label="Share" />
            <ActionButton icon={<Bookmark className="w-4 h-4" />} label="Save" />
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({ icon, label }) {
  return (
    <button className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function formatScore(score) {
  if (score >= 10000) return `${(score / 1000).toFixed(0)}k`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return score.toString();
}

export default PostCard;
