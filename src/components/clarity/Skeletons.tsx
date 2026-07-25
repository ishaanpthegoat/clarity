// Clarity — screen-shaped loading states.
//
// Each skeleton mirrors the real layout it stands in for, so nothing jumps when
// the content lands. They only appear where there is genuinely something to
// wait for — rehydrating history off disk, a grade coming back from the model.
// A skeleton over instant content just adds a flicker.
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/** Home: ring, task card, the three stat tiles, one content card. */
export function HomeSkeleton() {
  return (
    <div className="absolute inset-0 px-[18px] pt-[178px]" aria-busy="true" aria-label="Loading your day">
      <div className="mb-6 flex flex-col items-center gap-4">
        <Skeleton className="h-[188px] w-[188px] rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="sietch-card mb-3.5 p-5">
        <Skeleton className="mb-3.5 h-2.5 w-24" />
        <Skeleton className="h-[22px] w-[78%]" />
        <Skeleton className="mt-2.5 h-3 w-[56%]" />
      </div>
      <div className="mb-3.5 grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sietch-card grid place-items-center gap-2 px-3 py-4">
            <Skeleton className="h-5 w-12" style={{ animationDelay: `${i * 0.08}s` }} />
            <Skeleton className="h-2 w-10" style={{ animationDelay: `${i * 0.08}s` }} />
          </div>
        ))}
      </div>
      <div className="sietch-card p-5">
        <Skeleton className="mb-3.5 h-2.5 w-28" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

/** A list of cards — projects, ideas, sessions. */
export function CardListSkeleton({ count = 3, height = 84 }: { count?: number; height?: number }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-full rounded-[18px]"
          style={{ height, animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  );
}

/** The public-ideas feed: avatar, two lines, a chip row. */
export function IdeaFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading ideas">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sietch-card p-[18px]" style={{ opacity: 1 - i * 0.16 }}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-[14px]" style={{ animationDelay: `${i * 0.07}s` }} />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-[42%]" style={{ animationDelay: `${i * 0.07}s` }} />
              <Skeleton className="mt-2 h-2.5 w-[62%]" style={{ animationDelay: `${i * 0.07}s` }} />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-3.5 h-3 w-[86%]" />
        </div>
      ))}
    </div>
  );
}

/** The article body, while the read is being pulled. */
export function ArticleSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading today's read">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[26px] w-[26px] rounded-full" style={{ animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="mt-3 h-[26px] w-[85%]" />
      <Skeleton className="mt-2.5 h-[26px] w-[55%]" />
      <Skeleton className="mt-3 h-3 w-24" />
      <div className="mt-6 flex flex-col gap-5">
        <SkeletonText lines={4} />
        <SkeletonText lines={3} />
        <SkeletonText lines={4} />
      </div>
    </div>
  );
}

/** The grade card, while the model is looking at the photo. */
export function GradeSkeleton() {
  return (
    <div className="sietch-card p-5" aria-busy="true" aria-label="Grading your project">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[62px] w-[62px] rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="mt-2.5 h-3 w-[45%]" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-2.5 w-16" style={{ animationDelay: `${i * 0.08}s` }} />
            <Skeleton className="h-2 flex-1 rounded-full" style={{ animationDelay: `${i * 0.08}s` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
