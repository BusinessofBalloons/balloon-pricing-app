import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadRuntimeConfig } from './lib/config.ts';

// Check if an element is a Radix UI portal (used by Select, Dialog, Popover, etc.)
function isRadixPortal(el: HTMLElement): boolean {
  return (
    el.hasAttribute('data-radix-portal') ||
    el.hasAttribute('data-radix-popper-content-wrapper') ||
    el.getAttribute('role') === 'dialog' ||
    el.hasAttribute('data-state') ||
    el.querySelector('[data-radix-portal]') !== null ||
    el.querySelector('[data-radix-popper-content-wrapper]') !== null
  );
}

// Remove any platform-injected elements outside #root (but keep Radix portals)
function removePlatformOverlays() {
  const body = document.body;
  const children = Array.from(body.children);
  children.forEach((child) => {
    if (
      child.id !== 'root' &&
      child.tagName !== 'SCRIPT' &&
      child.tagName !== 'LINK' &&
      child.tagName !== 'STYLE' &&
      child.tagName !== 'NOSCRIPT' &&
      !isRadixPortal(child as HTMLElement)
    ) {
      const el = child as HTMLElement;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('height', '0', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
      el.style.setProperty('position', 'absolute', 'important');
      el.style.setProperty('top', '-9999px', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    }
  });
}

// Watch for dynamically injected elements and hide them immediately (but skip Radix portals)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) {
      if (
        node instanceof HTMLElement &&
        node.parentElement === document.body &&
        node.id !== 'root' &&
        node.tagName !== 'SCRIPT' &&
        node.tagName !== 'LINK' &&
        node.tagName !== 'STYLE' &&
        node.tagName !== 'NOSCRIPT' &&
        !isRadixPortal(node)
      ) {
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('overflow', 'hidden', 'important');
        node.style.setProperty('position', 'absolute', 'important');
        node.style.setProperty('top', '-9999px', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
      }
    }
  }
});

observer.observe(document.body, { childList: true });

// Also run cleanup on load and after a delay (for late-injected elements)
removePlatformOverlays();
window.addEventListener('DOMContentLoaded', removePlatformOverlays);
window.addEventListener('load', () => {
  removePlatformOverlays();
  setTimeout(removePlatformOverlays, 500);
  setTimeout(removePlatformOverlays, 1500);
  setTimeout(removePlatformOverlays, 3000);
});

// Handle browser back button: redirect to external site instead of atoms.dev
function setupBackButtonRedirect() {
  window.addEventListener('popstate', () => {
    window.location.href = 'https://Balloonman.fun/bizofballoons';
  });

  if (window.history.length <= 1) {
    window.history.pushState({ app: true }, '', window.location.href);
  }
}

setupBackButtonRedirect();

// Load runtime configuration before rendering the app
async function initializeApp() {
  try {
    await loadRuntimeConfig();
    console.log('Runtime configuration loaded successfully');
  } catch (error) {
    console.warn(
      'Failed to load runtime configuration, using defaults:',
      error
    );
  }

  // Render the app
  createRoot(document.getElementById('root')!).render(<App />);
}

// Initialize the app
initializeApp();