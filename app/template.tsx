import { ViewTransition } from 'react';

const routeTransitionClasses = {
  'nav-forward': 'route-forward',
  'nav-back': 'route-back',
  'nav-switch': 'route-switch',
  default: 'route-crossfade',
};

export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransition enter={routeTransitionClasses} exit={routeTransitionClasses} default="none">
      <div className="route-content">{children}</div>
    </ViewTransition>
  );
}
