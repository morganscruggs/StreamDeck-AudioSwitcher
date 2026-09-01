# Troubleshooting

## No property page, or does not work

1. 32-bit Windows is not supported. Neither is macOS - this fork is Windows-only.
2. If you can see the property page, open the device list; if your device is listed multiple times, you usually want the first one, but try every entry.
3. Try fully quitting the StreamDeck software and re-opening it. To fully quit, right click on the system tray icon, and select "Quit Stream Deck".
4. Check your anti-virus or other anti-malware history to make sure it has not modified it.
5. Try removing the action/icon and re-adding it.
6. Try uninstalling and re-installing the plugin. If this fixes the issue, check your anti-virus/anti-malware software again.

## The plugin's process never starts (Windows), or Stream Deck keeps restarting it

If Stream Deck shows the action, but the plugin never actually connects (device lists stay empty, buttons never update), check whether **Windows Smart App Control** is blocking it: Settings → Privacy & security → Windows Security → App & browser control → Smart App Control. This build isn't code-signed yet, and Smart App Control blocks unsigned executables it has no reputation for - including ones you compiled yourself. You can confirm this is the cause via Event Viewer, under `Microsoft-Windows-CodeIntegrity/Operational`: a block shows up as event ID 3077/3033, naming `sdaudioswitchplus.exe` and citing "did not meet the Enterprise signing level requirements."

If that's what you're hitting, your options are:
- Turn Smart App Control off (Settings → Smart App Control). On recent Windows 11 builds (March/April 2026 cumulative updates or later) this can be turned back on again afterward without a full reset; on older builds it can't, so check your build first.
- Build/test on a machine or VM where Smart App Control isn't in enforcing mode.
- Wait for a properly code-signed release - unsigned local builds will keep hitting this on any machine with Smart App Control enabled.

## Devices are listed multiple times in the properties page

The plugin will remember the exact Windows device that it was configured with, and this will always appear in the list. The same physical device may sometimes be considered a different device by Windows, e.g. if plugged into a different USB port. In this case, the list will show both the original device (even if not currently present), and all currently present devices, which may appear twice.

This is expected even if fuzzy matching is enabled; if fuzzy matching is enabled, the plugin will first attempt to match the original device exactly, and only resort to fuzzy matching if that fails.

## The plugin doesn't work when I plug/unplug the device or reboot

Try enabling fuzzy matching - this will match by name instead. On Windows, this will still require USB sound cards to
be plugged in the same port they were originally plugged into.
