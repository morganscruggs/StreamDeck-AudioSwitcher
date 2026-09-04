export type AudioDeviceDirection = "input" | "output";

export type AudioDeviceRole = "default" | "communication";

export type AudioDeviceState = "connected" | "device_not_present" | "device_disabled" | "device_present_no_connection";

export type AudioDeviceInfo = {
	id: string;
	interfaceName: string;
	endpointName: string;
	displayName: string;
	direction: AudioDeviceDirection;
	state: AudioDeviceState;
};

/** One direction's worth of live audio state, as returned by the PowerShell bridge. */
export type DirectionSnapshot = {
	devices: Record<string, AudioDeviceInfo>;
	defaultDeviceId: string;
	communicationsDeviceId: string;
};

export type AudioSnapshot = {
	input: DirectionSnapshot;
	output: DirectionSnapshot;
};

export type DeviceMatchStrategy = "ID" | "Fuzzy";

export type ButtonRole = "default" | "communication" | "all";

/** Mirrors ButtonSettings.h/.cpp - the persisted settings shape shared by both actions. */
export type ButtonSettings = {
	direction: AudioDeviceDirection;
	role: ButtonRole;
	primary?: AudioDeviceInfo;
	primaryLabel?: string;
	secondary?: AudioDeviceInfo;
	secondaryLabel?: string;
	matchStrategy: DeviceMatchStrategy;
	hideUnavailable?: boolean;
	hideDeviceType?: boolean;
	// "Set" action only.
	icon?: string;
	iconBrightColor?: string;
	iconDarkColor?: string;
	// "Toggle" action only.
	primaryIcon?: string;
	secondaryIcon?: string;
	primaryIconColor?: string;
	secondaryIconColor?: string;
};
