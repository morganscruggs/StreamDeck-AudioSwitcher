import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// This file compiles to <sdPlugin>/bin/plugin.js, so the plugin's own root is one directory up.
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICONS_DIR = path.join(PLUGIN_ROOT, "AudioDevicesIcons");

/**
 * Icon files live as `<id>.png` (plus a `<id>@2x.png` retina pair, which is intentionally excluded
 * here since its stem already ends in "@2x" and won't match a bare id) - ported from FindIconFile/
 * GetAvailableIconSets in AudioSwitcherStreamDeckPlugin.cpp. Built once at startup since this icon
 * set is static plugin content, not per-user data.
 */
function buildIconFileMap(): Map<string, string> {
	const map = new Map<string, string>();
	let entries: string[];
	try {
		entries = fs.readdirSync(ICONS_DIR);
	} catch {
		return map;
	}

	for (const entry of entries) {
		if (path.extname(entry).toLowerCase() !== ".png") continue;
		const stem = path.basename(entry, path.extname(entry)).toLowerCase();
		map.set(stem, path.join(ICONS_DIR, entry));
	}
	return map;
}

const iconFilesByStem = buildIconFileMap();

export function findIconFile(iconId: string): string | undefined {
	return iconFilesByStem.get(iconId.toLowerCase());
}

export type IconSetOption = { id: string; label: string };

/**
 * The pickable icon set for the property inspector's icon grid. Each icon has a "foo.png"/"foo@2x.png"
 * pair for Stream Deck's retina displays; both must collapse to the same "foo" id here or the @2x file
 * shows up as a bogus extra icon in the picker - ported from GetAvailableIconSets() in
 * AudioSwitcherStreamDeckPlugin.cpp (missed in the initial port, causing every icon to appear twice).
 */
export function listIconSets(): IconSetOption[] {
	const ids = new Set<string>();
	for (const stem of iconFilesByStem.keys()) {
		ids.add(stem.endsWith("@2x") ? stem.slice(0, -"@2x".length) : stem);
	}

	return Array.from(ids)
		.sort()
		.map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }));
}
