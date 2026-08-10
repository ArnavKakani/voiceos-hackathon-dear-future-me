import { type ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  grid?: boolean;
}

export function PageWrapper({ children, className = '', grid = true }: PageWrapperProps) {
  return (
    <main className={`min-h-screen ${grid ? 'bg-grid' : ''} bg-[#F9F5ED] ${className}`}>
      {children}
    </main>
  );
}
