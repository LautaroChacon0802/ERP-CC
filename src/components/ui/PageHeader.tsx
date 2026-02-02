import React from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'success';
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  actions?: Action[];
  children?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-700 shadow-sm',
  secondary: 'bg-white text-foreground border border-border hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-red-700',
  success: 'bg-success text-success-foreground hover:bg-green-700',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  onBack,
  actions = [],
  children,
}) => {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-secondary hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary">
                {icon}
              </div>
            )}
            
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {children}
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  ${variantStyles[action.variant || 'secondary']}
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
