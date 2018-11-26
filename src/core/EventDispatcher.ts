/**
 * Abstract class that can emit message to listeners.
 */
export default class EventDispatcher {
    events: Map<string, Array<(data: any) => void>>

    constructor() {
        this.events = new Map<string, Array<(data: any) => void>>()
    }

    addListener(event: string, callback: (data: any) => void) {
        if (!this.events.has(event)) {
            this.events.set(event, [])
        }
        this.events.get(event).push(callback);
    }

    removeListener(event: string, callback: (data: any) => void) {
        // Check if this event not exists
        // -> assume the most common case is removing an existing event
        if (this.events.has(event)) {
            const _listeners = this.events.get(event).filter(listener => {
                return listener.toString() !== callback.toString();
            })
            this.events.set(event, _listeners)
        } else {
            console.warn(`[EventDispatcher]::removeListener - event '${event}' does not exists.`);
        }
    }

    dispatch(event: string, details: any) {
        // Check if this event not exists
        if (this.events.has(event)) {
            this.events.get(event).forEach((listener) => {
                listener(details);
            })
        } else {
            console.error(`This event: ${event} does not exist`);
        }
    }
}