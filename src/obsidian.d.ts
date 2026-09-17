export {};

declare global {
  interface Window {
    createFragment(callback?: (fragment: DocumentFragment) => void): DocumentFragment;
  }
}
