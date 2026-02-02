import React from 'react';

type CardVariant = 'default' | 'elevated' | 'compact' | 'interactive' | 'warning' | 'success';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-card border border-border shadow-card',
  elevated: 'bg-card border border-border shadow-elevated',
  compact: 'bg-card border border-border',
  interactive: 'bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5 cursor-pointer transition-all duration-200',
  warning: 'bg-card border border-border shadow-card border-l-4 border-l-warning',
  success: 'bg-card border border-border shadow-card border-l-4 border-l-success',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  onClick,
  disabled = false,
}) => {
  const baseStyles = 'rounded-card overflow-hidden';
  const interactiveStyles = onClick && !disabled ? 'cursor-pointer' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${disabledStyles} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-border ${className}`}>
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-border bg-muted/50 ${className}`}>
    {children}
  </div>
);

export default Card;
