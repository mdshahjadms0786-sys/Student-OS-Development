import * as React from 'react';
import { cn } from '@student-os/ui';
import { Loader2 } from 'lucide-react';

export function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 className={cn("animate-spin text-blue-600 dark:text-blue-400", className)} {...props} />;
}
