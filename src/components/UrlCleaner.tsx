"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function UrlCleaner() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/modal' || pathname === '/modal/photo') {
      router.replace('/');
    }
  }, [pathname, router]);

  return null;
}
