import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ className, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }: CardProps) => (
  <div className={cn('mb-4 flex flex-col space-y-1.5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }: CardProps) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...props }: CardProps) => (
  <p className={cn('text-sm text-white/50', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className, children, ...props }: CardProps) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
);
