import type { AudioDeviceInfo, DeviceMatchStrategy, DirectionSnapshot } from "./types";

/**
 * Windows likes to replace "Foo" with "2- Foo", either as the whole interface name or embedded as
 * "Endpoint (2- Foo)" - strips that numeric prefix so renumbered devices still fuzzy-match. Ported
 * from ButtonSettings.cpp's FuzzifyInterface().
 */
function fuzzifyInterface(name: string): string {
	const match = /^([0-9]+- )?(.+)$/.exec(name);
	return match ? match[2] : name;
}

/**
 * Resolves a configured device reference to whichever device ID should actually be used right now -
 * ported from ButtonSettings.cpp's GetVolatileID(). With "ID" matching this is just the stored ID.
 * With "Fuzzy" matching, if the stored ID is no longer connected, this looks for a currently-connected
 * device with the same (number-prefix-stripped) interface name and endpoint name, so a device that got
 * renumbered (Windows swapping "Foo" for "2- Foo") is still recognized as the same physical device.
 */
export function getVolatileDeviceId(
	device: AudioDeviceInfo | undefined,
	strategy: DeviceMatchStrategy,
	snapshot: DirectionSnapshot | undefined
): string {
	if (!device || !device.id) return "";

	if (strategy === "ID") return device.id;

	const currentState = snapshot?.devices[device.id]?.state;
	if (currentState === "connected") return device.id;

	if (!snapshot) return device.id;

	const fuzzyInterface = fuzzifyInterface(device.interfaceName);
	for (const other of Object.values(snapshot.devices)) {
		if (other.state !== "connected") continue;
		if (fuzzifyInterface(other.interfaceName) === fuzzyInterface && other.endpointName === device.endpointName) {
			return other.id;
		}
	}

	return device.id;
}
