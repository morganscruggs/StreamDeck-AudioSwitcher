import streamDeck from "@elgato/streamdeck";
import { getSnapshot, setDefaultDevice as bridgeSetDefaultDevice } from "./audio-device-bridge";
import type { AudioDeviceRole, AudioSnapshot } from "./types";

/**
 * Each poll/refresh spawns a real powershell.exe process (there's no cheap native call here, unlike
 * node-audio-volume-mixer's addon), so this is a single shared interval for every visible button
 * rather than one per button - mirrors the polling pattern in volume-control.ts, but centralized.
 */
const POLL_INTERVAL_MS = 5000;

type Listener = (snapshot: AudioSnapshot) => void;

class AudioDeviceService {
	private snapshot: AudioSnapshot | undefined;
	private visibleCount = 0;
	private timer: ReturnType<typeof setInterval> | undefined;
	private listeners = new Set<Listener>();
	private refreshInFlight: Promise<AudioSnapshot> | undefined;

	getSnapshot(): AudioSnapshot | undefined {
		return this.snapshot;
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/** Call when a button becomes visible; pairs with {@link release}. Starts polling on the 0->1 edge. */
	acquire(): void {
		this.visibleCount++;
		if (this.visibleCount === 1) {
			this.refresh().catch((error) => streamDeck.logger.error("Initial audio device refresh failed", error));
			this.timer = setInterval(() => {
				this.refresh().catch((error) => streamDeck.logger.error("Audio device poll failed", error));
			}, POLL_INTERVAL_MS);
		}
	}

	/** Call when a button stops being visible; pairs with {@link acquire}. Stops polling on the 1->0 edge. */
	release(): void {
		this.visibleCount = Math.max(0, this.visibleCount - 1);
		if (this.visibleCount === 0 && this.timer) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
	}

	/** Forces a fresh snapshot now rather than waiting for the next poll tick, de-duplicating concurrent calls. */
	async refresh(): Promise<AudioSnapshot> {
		if (this.refreshInFlight) return this.refreshInFlight;

		this.refreshInFlight = (async () => {
			const next = await getSnapshot();
			this.snapshot = next;
			for (const listener of this.listeners) listener(next);
			return next;
		})();

		try {
			return await this.refreshInFlight;
		} finally {
			this.refreshInFlight = undefined;
		}
	}

	/** Sets the default device for a role, then immediately refreshes so buttons reflect it right away. */
	async setDefaultDevice(role: AudioDeviceRole, deviceId: string): Promise<boolean> {
		const ok = await bridgeSetDefaultDevice(role, deviceId);
		await this.refresh().catch((error) => streamDeck.logger.error("Post-set audio device refresh failed", error));
		return ok;
	}
}

export const audioDeviceService = new AudioDeviceService();
