import React from 'react';
import {
  Link as RouterLink,
  useNavigate,
  useParams as useRouterParams,
  useLocation,
} from 'react-router-dom';

export function Link({
  href,
  to,
  children,
  className,
  onClick,
  ...props
}: any) {
  const target = href || to || '#';

  // Handle in-page anchors
  if (typeof target === 'string' && target.startsWith('#')) {
    return (
      <a href={target} className={className} onClick={onClick} {...props}>
        {children}
      </a>
    );
  }

  // Handle external URLs
  if (typeof target === 'string' && (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:'))) {
    return (
      <a href={target} className={className} onClick={onClick} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={target} className={className} onClick={onClick} {...props}>
      {children}
    </RouterLink>
  );
}

export function Image({
  src,
  alt,
  className,
  width,
  height,
  fill,
  priority,
  unoptimized,
  referrerPolicy,
  ...props
}: any) {
  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      referrerPolicy={referrerPolicy || 'no-referrer'}
      {...props}
    />
  );
}

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
    refresh: () => window.location.reload(),
  };
}

export function useParams() {
  return useRouterParams();
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  return {
    get: (key: string) => searchParams.get(key),
    getAll: (key: string) => searchParams.getAll(key),
    has: (key: string) => searchParams.has(key),
    toString: () => searchParams.toString(),
  };
}

export function notFound() {
  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl font-extrabold mb-4 font-mono text-sky-400">404</h1>
      <h2 className="text-2xl font-bold mb-2">Creator Pass Not Found</h2>
      <p className="text-slate-400 max-w-md mb-8">
        The creator pass or page you are looking for does not exist or has been removed.
      </p>
      <Link href="/" className="btn-chq-primary px-8 py-3 text-sm font-bold">
        Return to Directory
      </Link>
    </div>
  );
}

export default Link;
