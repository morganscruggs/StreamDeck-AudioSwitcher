import { PNG } from "pngjs";

/** Parses "#RRGGBB" or "RRGGBB"; returns undefined for anything else (including empty/missing input). */
function parseHexColor(hex: string | undefined): { r: number; g: number; b: number } | undefined {
	if (!hex) return undefined;
	const match = /^#?([0-9a-fA-F]{6})$/.exec(hex);
	if (!match) return undefined;
	const value = parseInt(match[1], 16);
	return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

/**
 * Replaces the RGB of every pixel with `colorHex`, leaving alpha untouched - the source icons are
 * monochrome silhouettes, so this recolors the shape while preserving its edge antialiasing. Ported
 * from RecolorPngAsBase64/ParseHexColor in AudioSwitcherStreamDeckPlugin.cpp, using pngjs (pure JS, no
 * native compile step) instead of stb_image. An empty/invalid colorHex returns the icon's own
 * original, unmodified color - matching ParseHexColor's nullopt case.
 */
export function recolorPngToDataUri(pngBytes: Buffer, colorHex: string | undefined): string {
	const color = parseHexColor(colorHex);
	if (!color) return `data:image/png;base64,${pngBytes.toString("base64")}`;

	const png = PNG.sync.read(pngBytes);
	const pixelCount = png.width * png.height;
	for (let i = 0; i < pixelCount; i++) {
		png.data[i * 4 + 0] = color.r;
		png.data[i * 4 + 1] = color.g;
		png.data[i * 4 + 2] = color.b;
	}

	const out = PNG.sync.write(png);
	return `data:image/png;base64,${out.toString("base64")}`;
}
