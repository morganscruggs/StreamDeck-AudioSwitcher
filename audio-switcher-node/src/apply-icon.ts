import type { KeyAction } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import fs from "node:fs";
import { findIconFile } from "./icon-registry";
import { recolorPngToDataUri } from "./png-recolor";
import type { ButtonSettings } from "./types";
import type { ActionKind } from "./state-sync";

function applyStateImage(action: KeyAction<ButtonSettings>, iconId: string, colorHex: string | undefined, state: 0 | 1): void {
	const file = findIconFile(iconId);
	if (!file) return;

	let bytes: Buffer;
	try {
		bytes = fs.readFileSync(file);
	} catch (error) {
		streamDeck.logger.error(`Failed to read icon file for "${iconId}"`, error);
		return;
	}

	const dataUri = recolorPngToDataUri(bytes, colorHex);
	action.setImage(dataUri, { state }).catch((error) => streamDeck.logger.error("Failed to set image", error));
}

/**
 * Applies both states' icons for an action - ported from ApplyIcon() in
 * AudioSwitcherStreamDeckPlugin.cpp. "Set" recolors one icon bright/dark for active/inactive (dark
 * defaults to grey #606060 when unset); "Toggle" uses two different icons, one per device, each with
 * its own optional color (no forced default - an empty color keeps the icon's own original color).
 */
export function applyIcons(action: KeyAction<ButtonSettings>, kind: ActionKind, settings: ButtonSettings): void {
	if (kind === "set") {
		const iconId = settings.icon || "headphones";
		applyStateImage(action, iconId, settings.iconBrightColor, 0);
		applyStateImage(action, iconId, settings.iconDarkColor || "#606060", 1);
		return;
	}

	const primaryIconId = settings.primaryIcon || "headphones";
	const secondaryIconId = settings.secondaryIcon || "speaker";
	applyStateImage(action, primaryIconId, settings.primaryIconColor, 0);
	applyStateImage(action, secondaryIconId, settings.secondaryIconColor, 1);
}
