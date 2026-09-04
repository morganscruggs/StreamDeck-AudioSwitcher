import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyUpEvent,
	SendToPluginEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from "@elgato/streamdeck";
import { applyIcons } from "../apply-icon";
import { audioDeviceService } from "../audio-device-service";
import { handlePropertyInspectorMessage } from "../pi-bridge";
import { backfillDeviceInfo, performKeyPress, updateState } from "../state-sync";
import type { ButtonSettings } from "../types";

/**
 * Toggles between two configured audio devices - ported from the
 * "com.morganscruggs.audioswitcherplus.toggle" action in AudioSwitcherStreamDeckPlugin.cpp.
 */
@action({ UUID: "com.morgan-scruggs.audioswitcherplus-node.toggle" })
export class ToggleDeviceAction extends SingletonAction<ButtonSettings> {
	private unsubscribe = new Map<string, () => void>();

	override async onWillAppear(ev: WillAppearEvent<ButtonSettings>): Promise<void> {
		if (!ev.action.isKey()) return;
		const action = ev.action;
		const settings = ev.payload.settings;

		audioDeviceService.acquire();
		this.unsubscribe.set(
			action.id,
			audioDeviceService.subscribe((snapshot) => updateState(action, "toggle", settings, snapshot))
		);

		applyIcons(action, "toggle", settings);
		updateState(action, "toggle", settings, audioDeviceService.getSnapshot());
		await backfillDeviceInfo(action, settings, audioDeviceService.getSnapshot());
	}

	override onWillDisappear(ev: WillDisappearEvent<ButtonSettings>): void {
		audioDeviceService.release();
		this.unsubscribe.get(ev.action.id)?.();
		this.unsubscribe.delete(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ButtonSettings>): void {
		if (!ev.action.isKey()) return;
		applyIcons(ev.action, "toggle", ev.payload.settings);
		updateState(ev.action, "toggle", ev.payload.settings, audioDeviceService.getSnapshot());
	}

	override async onKeyUp(ev: KeyUpEvent<ButtonSettings>): Promise<void> {
		await performKeyPress(ev.action, "toggle", ev.payload.settings, ev.payload.state);
	}

	override async onSendToPlugin(ev: SendToPluginEvent<any, ButtonSettings>): Promise<void> {
		const payload = ev.payload as { event?: string } | undefined;
		await handlePropertyInspectorMessage(payload?.event).catch((error) => streamDeck.logger.error("Failed to handle PI message", error));
	}
}
