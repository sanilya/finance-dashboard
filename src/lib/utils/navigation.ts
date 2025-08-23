// Navigation events for cross-component communication

// Event for when data changes in a component that might affect others
export const createNavigationEvent = (source: string, detail: any = {}) => {
  // Using custom event to communicate between components
  const event = new CustomEvent('finance-app-navigation', {
    bubbles: true,
    detail: {
      source,
      timestamp: Date.now(),
      ...detail
    }
  });
  
  // Dispatch the event
  window.dispatchEvent(event);
};

// Event listener for navigation events
export const listenToNavigationEvents = (
  callback: (event: CustomEvent) => void
) => {
  const handler = (e: Event) => {
    callback(e as CustomEvent);
  };
  
  window.addEventListener('finance-app-navigation', handler);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('finance-app-navigation', handler);
  };
};
