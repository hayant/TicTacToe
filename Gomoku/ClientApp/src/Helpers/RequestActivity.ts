// Tracks the number of in-flight HTTP requests so the UI can show a global
// loading indicator. HttpHelpers bumps the counter around every fetch; the
// LoadingOverlay component subscribes to render a spinner while count > 0.

type Listener = (count: number) => void;

let inFlight = 0;
const listeners = new Set<Listener>();

const notify = () => {
    listeners.forEach((listener) => listener(inFlight));
};

export const RequestActivity = {
    /** Mark a request as started. */
    begin(): void {
        inFlight += 1;
        notify();
    },

    /** Mark a request as finished. */
    end(): void {
        inFlight = Math.max(0, inFlight - 1);
        notify();
    },

    /** Current number of in-flight requests. */
    getCount(): number {
        return inFlight;
    },

    /** Subscribe to changes; returns an unsubscribe function. */
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
