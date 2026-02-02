import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning-foreground border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  outline: 'bg-transparent border-border text-foreground',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
