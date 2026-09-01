## Description

StreamDeck-AudioSwitcherPlus is a C++ plugin for the Elgato StreamDeck for setting the default audio device.

> **This is a fork** of [Fred Emmott](https://github.com/fredemmott)'s original [StreamDeck-AudioOutputSwitcher](https://github.com/fredemmott/StreamDeck-AudioOutputSwitcher), extended with additional features (hiding disabled/unplugged devices, hiding device-type suffixes, an "All" button role, stripped Windows device-name prefixes, and per-button custom icons with color selection). All credit for the original plugin, its design, and the underlying audio-switching approach goes to Fred Emmott — please check out [his other Stream Deck plugins](https://github.com/fredemmott) as well.

It supports:
(original)
- setting input or output device
- setting default device or communication device
- either one-button-per-device, or one button to toggle between two devices
(new)
- ability to set both default device **and** communication device
- choosing a custom icon per button(headphones, earbuds, speaker, mic)
- choosing custom colors for icons in both On and Off modes
- simplified device selecton 
  - ability to remove unplugged devices
  - ability to remove device type (which windows gets wrong often) from selection box


For example, this can be useful to switch between headphones and speakers if they are on different sound cards (e.g. USB speakers or USB headphones).

By default, new buttons use fuzzy device matching and the "All" role (affecting both the default and communication device) - both can be changed per-button in the property inspector.

## Custom Icons & Colors

Both "Set Audio Device" and "Toggle Audio Device" buttons let you pick an icon (Earbuds, Headphones, Mic, or Speaker) instead of the plugin's default images, plus a color for each of the button's states:

- **Set Audio Device** has one icon with two colors - "On" (shown when the configured device is the active one) and "Off" (shown otherwise, defaulting to a dimmed grey).
- **Toggle Audio Device** has two icons - one per device it switches between - each with its own color, defaulting to white.

Icon choices are picked up automatically from `AudioDevicesIcons/` inside the plugin folder; each file must be a white silhouette on a transparent background (the colors above are applied by recoloring the shape at runtime, not by swapping images), and its filename becomes the option's name in the picker. Drop in a new `<name>.png` file to add another choice without any code changes.

# Release 0.1.0

This is the first release of Audio Switcher Plus as its own product, forked and rebranded from Fred Emmott's original Audio Switcher. The core device-switching logic is unchanged from the upstream project and has years of real-world use behind it; everything listed above under "(new)" - custom icons/colors, hiding disabled devices, hiding device type, and the "All" role - is new in this release and hasn't had the same amount of testing yet. If something regresses, [check the troubleshooting guide](TROUBLESHOOTING.md) or open an issue.

**A note on Windows App Control:** this build is not yet code-signed. On Windows 11 systems with **Smart App Control** enabled (Settings > Privacy & security > Windows Security > App & browser control), an unsigned, newly-built executable like this one can be blocked from running entirely - Stream Deck will show the button, but the plugin itself never actually starts, so device lists stay empty and buttons never update. This isn't a bug in the plugin so much as a Windows security feature reacting to the lack of a signature; see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for how to confirm it and your options. Proper code signing is planned for a future release.

# Video Demo

[![YouTube Demo Video](https://img.youtube.com/vi/Y5avo5WrwwM/0.jpg)](https://www.youtube.com/watch?v=Y5avo5WrwwM)

# Installation

Download the `com.morganscruggs.audioswitcherplus.streamDeckPlugin` file from [the releases page](https://github.com/morganscruggs/StreamDeck-AudioSwitcher/releases), and double-click it.

# Notes

This uses undocumented and unsupported Windows APIs. These have apparently worked since Windows 7, but they
might stop working at any time or have unexpected side effects.

## MacOS: "Sound effects" aren't changing, or are changing when I don't want them to

This is a MacOS bug that only Apple can fix.

# Getting Help

Check [the troubleshooting guide](TROUBLESHOOTING.md) guide. I make this for my own use, and share in the hope that others find it useful - I am unable to offer support, or to act on bug reports or feature requests. Do not contact me for help via any means, including GitHub, Discord, Twitter, Reddit, or email. This software is used by many, and I do generally fix it when something changes to break it, but I do not guarantee this, and I'm not able to help with anyone's specific issues.

If 'fuzzy matching' is required - or not functioning properly for you - ask your device manufacturer to fix their device/drivers to not change device IDs; Microsoft requires that these do not change.

# Thanks

- Thanks to [Fred Emmott](https://github.com/fredemmott) for creating the original [StreamDeck-AudioOutputSwitcher](https://github.com/fredemmott/StreamDeck-AudioOutputSwitcher) that this project is forked from.
- Thanks to "EreTIk" for finding/documenting the COM interface.
- Thanks to "LordValgor" for the idea of making this plugin.

# License

This project is [MIT-licensed](LICENSE)
