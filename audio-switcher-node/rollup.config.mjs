import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
// Bare folder name (used for the AppData destination path) vs. where the build actually writes it
// (the repo's top-level directory, alongside audio-switcher-exe/'s own build output and shared/) -
// keep these separate so path.join(...Plugins, sdPluginName) doesn't get corrupted by a ".." segment.
const sdPluginName = "com.morgan-scruggs.audioswitcherplus-node.sdPlugin";
const sdPlugin = `../${sdPluginName}`;

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: "src/plugin.ts",
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
			},
		},
		{
			// The icon PNGs live once in ../shared/AudioDevicesIcons (also used by the C++ plugin's own
			// build), rather than being duplicated into this project - Stream Deck plugins must be
			// self-contained at runtime though, so each build copies them into this plugin's own folder.
			name: "copy-shared-icons",
			buildStart() {
				const src = path.join("..", "shared", "AudioDevicesIcons");
				const dest = path.join(sdPlugin, "AudioDevicesIcons");
				fs.mkdirSync(dest, { recursive: true });
				for (const file of fs.readdirSync(src)) {
					this.addWatchFile(path.join(src, file));
					fs.copyFileSync(path.join(src, file), path.join(dest, file));
				}
			}
		},
		{
			// Stream Deck runs its own copy of the plugin from its Plugins folder, not from this
			// project. If that folder is a symlink back to this project, Stream Deck already sees
			// every build - skip copying (copying a folder onto itself would error). Otherwise,
			// mirror the freshly built plugin into it so a plain `npm run build` stays the only
			// step ever needed.
			name: "sync-to-streamdeck",
			writeBundle() {
				const appData = process.env.APPDATA;
				if (!appData) return;

				const installed = path.join(appData, "Elgato", "StreamDeck", "Plugins", sdPluginName);
				if (!fs.existsSync(path.dirname(installed))) return;

				try {
					if (fs.existsSync(installed) && fs.lstatSync(installed).isSymbolicLink()) return;
					fs.rmSync(installed, { recursive: true, force: true });
					fs.cpSync(sdPlugin, installed, { recursive: true });
					console.log(`Synced plugin to ${installed}`);
				} catch (error) {
					console.warn(`Could not sync plugin to Stream Deck's Plugins folder: ${error.message}`);
				}
			}
		},
		typescript({
			mapRoot: isWatching ? "./" : undefined
		}),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true
		}),
		commonjs(),
		!isWatching && terser(),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			}
		}
	]
};

export default config;
