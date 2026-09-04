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
 * Sets one specific audio device as the active default (and/or communications) device - ported from
 * the "com.morganscruggs.audioswitcherplus.set" action in AudioSwitcherStreamDeckPlugin.cpp.
 */
@action({ UUID: "com.morgan-scruggs.audioswitcherplus-node.set" })
export class SetDeviceAction extends SingletonAction<ButtonSettings> {
	private unsubscribe = new Map<string, () => void>();

	override async onWillAppear(ev: WillAppearEvent<ButtonSettings>): Promise<void> {
		if (!ev.action.isKey()) return;
		const action = ev.action;
		const settings = ev.payload.settings;

		audioDeviceService.acquire();
		this.unsubscribe.set(
			action.id,
			audioDeviceService.subscribe((snapshot) => updateState(action, "set", settings, snapshot))
		);

		applyIcons(action, "set", settings);
		updateState(action, "set", settings, audioDeviceService.getSnapshot());
		await backfillDeviceInfo(action, settings, audioDeviceService.getSnapshot());
	}

	override onWillDisappear(ev: WillDisappearEvent<ButtonSettings>): void {
		audioDeviceService.release();
		this.unsubscribe.get(ev.action.id)?.();
		this.unsubscribe.delete(ev.action.id);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ButtonSettings>): void {
		if (!ev.action.isKey()) return;
		applyIcons(ev.action, "set", ev.payload.settings);
		updateState(ev.action, "set", ev.payload.settings, audioDeviceService.getSnapshot());
	}

	override async onKeyUp(ev: KeyUpEvent<ButtonSettings>): Promise<void> {
		await performKeyPress(ev.action, "set", ev.payload.settings, ev.payload.state);
	}

	override async onSendToPlugin(ev: SendToPluginEvent<any, ButtonSettings>): Promise<void> {
		const payload = ev.payload as { event?: string } | undefined;
		await handlePropertyInspectorMessage(payload?.event).catch((error) => streamDeck.logger.error("Failed to handle PI message", error));
	}
}
