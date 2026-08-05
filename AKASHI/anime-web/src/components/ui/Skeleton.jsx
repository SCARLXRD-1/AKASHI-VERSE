import PropTypes from 'prop-types';

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
);

Skeleton.propTypes = {
  className: PropTypes.string
};

export const AnimeCardSkeleton = () => (
  <div className="flex flex-col gap-3">
    <Skeleton className="aspect-[2/3] rounded-[2rem]" />
    <div className="px-2 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <Skeleton className="w-full h-[70vh] rounded-[3rem]" />
);

export const AnimeDetailSkeleton = () => (
  <div className="min-h-screen bg-background-main pb-24 animate-in fade-in duration-1000">
    <div className="relative h-[60vh] lg:h-[75vh] w-full overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background-main via-transparent to-transparent z-10" />
      <div className="absolute inset-0 z-20 flex items-end pb-12 lg:pb-24">
        <div className="container px-4 lg:px-12 flex flex-col lg:flex-row gap-12 items-end">
          <Skeleton className="hidden lg:block w-72 aspect-[2/3] rounded-[2.5rem] border-4 border-white/5" />
          <div className="flex-1 space-y-6 w-full">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-16 w-3/4 max-w-2xl" />
            <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-full" /><Skeleton className="h-8 w-24 rounded-full" /></div>
            <div className="flex gap-4 pt-6"><Skeleton className="h-14 w-48 rounded-2xl" /><Skeleton className="h-14 w-40 rounded-2xl" /></div>
          </div>
        </div>
      </div>
    </div>
    <div className="container px-4 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
      <div className="lg:col-span-8 space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
        </div>
      </div>
      <div className="lg:col-span-4">
        <Skeleton className="h-96 w-full rounded-[2.5rem]" />
      </div>
    </div>
  </div>
);

export const WatchSkeleton = () => (
  <div className="container px-4 lg:px-12 py-8 animate-in fade-in duration-1000">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="w-full aspect-video rounded-3xl" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 mb-6" />
        {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    </div>
  </div>
);
