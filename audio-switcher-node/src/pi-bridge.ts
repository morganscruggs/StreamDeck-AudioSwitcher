import streamDeck from "@elgato/streamdeck";
import { audioDeviceService } from "./audio-device-service";
import { listIconSets } from "./icon-registry";

/**
 * Handles the property inspector's "getDeviceList"/"getIconList" requests - ported from SendToPlugin()
 * in AudioSwitcherStreamDeckPlugin.cpp. Only one property inspector is ever visible at a time, so
 * `streamDeck.ui.sendToPropertyInspector` (unscoped) reaches the right one regardless of which action
 * type sent the request.
 */
export async function handlePropertyInspectorMessage(event: string | undefined): Promise<void> {
	if (event === "getDeviceList") {
		let snapshot = audioDeviceService.getSnapshot();
		if (!snapshot) {
			snapshot = await audioDeviceService.refresh().catch((error) => {
				streamDeck.logger.error("Failed to refresh audio devices for property inspector", error);
				return undefined;
			});
		}
		await streamDeck.ui.sendToPropertyInspector({
			event,
			outputDevices: snapshot?.output.devices ?? {},
			inputDevices: snapshot?.input.devices ?? {}
		});
		return;
	}

	if (event === "getIconList") {
		await streamDeck.ui.sendToPropertyInspector({ event, icons: listIconSets() });
	}
}
