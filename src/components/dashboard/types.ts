export interface BaseWidgetProps {
  id: string;
  title?: string;
  config?: any;
  className?: string;
  onConfigChange?: (config: any) => void;
  onRemove?: () => void;
}