function PostSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex gap-3">
        {/* Vote skeleton */}
        <div className="hidden sm:flex flex-col items-center gap-1 pt-1 w-8">
          <div className="w-6 h-6 rounded skeleton" />
          <div className="w-6 h-4 rounded skeleton" />
          <div className="w-6 h-6 rounded skeleton" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Meta */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 rounded skeleton" />
            <div className="h-3 w-24 rounded skeleton" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-5 w-full rounded skeleton" />
            <div className="h-5 w-3/4 rounded skeleton" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-6 w-24 rounded skeleton" />
            <div className="h-6 w-16 rounded skeleton" />
            <div className="h-6 w-14 rounded skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostSkeleton;
