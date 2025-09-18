import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  estado?: 'borrador' | 'pendiente' | 'validado' | 'observado' | 'rechazado';
  children: React.ReactNode;
  className?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'default', estado, children, className }, ref) => {
    const getEstadoClasses = (estado: string) => {
      switch (estado) {
        case 'borrador':
          return 'bg-estado-borrador text-white';
        case 'pendiente':
          return 'bg-estado-pendiente text-gray-800';
        case 'validado':
          return 'bg-estado-validado text-white';
        case 'observado':
          return 'bg-estado-observado text-white';
        case 'rechazado':
          return 'bg-estado-rechazado text-white';
        default:
          return '';
      }
    };

    const getVariantClasses = (variant: string) => {
      switch (variant) {
        case 'default':
          return 'bg-gcba-blue text-white';
        case 'secondary':
          return 'bg-gray-100 text-gray-700';
        case 'destructive':
          return 'bg-red-500 text-white';
        case 'success':
          return 'bg-green-500 text-white';
        case 'warning':
          return 'bg-yellow-500 text-gray-800';
        case 'outline':
          return 'border border-gray-300 bg-white text-gray-700';
        default:
          return '';
      }
    };

    const classes = clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      estado ? getEstadoClasses(estado) : getVariantClasses(variant),
      className
    );

    return (
      <div ref={ref} className={classes}>
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
