## Description

StreamDeck-AudioSwitcherPlus is an Elgato Stream Deck plugin for setting the default Windows audio device. **Windows only** - macOS is not supported.

> **This is a fork** of [Fred Emmott](https://github.com/fredemmott)'s original [StreamDeck-AudioOutputSwitcher](https://github.com/fredemmott/StreamDeck-AudioOutputSwitcher), extended with additional features (hiding disabled/unplugged devices, hiding device-type suffixes, an "All" button role, stripped Windows device-name prefixes, and per-button custom icons with color selection). All credit for the original plugin, its design, and the underlying audio-switching approach goes to Fred Emmott — please check out [his other Stream Deck plugins](https://github.com/fredemmott) as well.

## Two implementations, one plugin

This repo contains two separate, independently-installable builds of the same plugin concept - same feature set (device direction, default/communication/"all" role, fuzzy device matching, custom icons/colors), different underlying tech:

| | [`audio-switcher-exe/`](audio-switcher-exe/) | [`audio-switcher-node/`](audio-switcher-node/) |
|---|---|---|
| Runtime | Native C++, compiled to its own `sdaudioswitchplus.exe` | Node.js, running inside Stream Deck's own bundled Node runtime |
| Device switching | Direct in-process COM calls | The same COM calls, via inline C# run through `powershell.exe` |
| Responsiveness | Fast - real-time, in-process | Noticeably slower - each switch/poll is a fresh `powershell.exe` process |
| Windows Smart App Control | **Can be blocked** - it's a freshly-compiled, unsigned, no-reputation executable | Not affected - never launches its own executable, so there's nothing for Smart App Control to flag |
| Status | Original, most mature | Newer, built specifically to sidestep the Smart App Control issue |

Both install and run completely independently (different plugin UUIDs, different install folders), so you can have either or both active at once. If Smart App Control isn't a problem for you, the exe version is the more responsive choice; otherwise the Node version trades some responsiveness for not being blocked. See each folder's own README for setup, features, and its own troubleshooting guide.

Shared, non-code assets (currently just the button icons) live in [`shared/`](shared/) and are pulled in by both projects' build steps rather than duplicated.

## Notes

This uses undocumented and unsupported Windows APIs (the same ones, either way). These have apparently worked since Windows 7, but they might stop working at any time or have unexpected side effects.

This fork does not support macOS - the upstream project did, but maintaining and testing a Mac build isn't something this fork can commit to. If you're on a Mac, use [the original StreamDeck-AudioOutputSwitcher](https://github.com/fredemmott/StreamDeck-AudioOutputSwitcher) instead.

## Getting Help

Check the relevant troubleshooting guide ([exe](audio-switcher-exe/TROUBLESHOOTING.md) / [node](audio-switcher-node/TROUBLESHOOTING.md)). I make this for my own use, and share in the hope that others find it useful - I am unable to offer support, or to act on bug reports or feature requests. Do not contact me for help via any means, including GitHub, Discord, Twitter, Reddit, or email. This software is used by many, and I do generally fix it when something changes to break it, but I do not guarantee this, and I'm not able to help with anyone's specific issues.

If 'fuzzy matching' is required - or not functioning properly for you - ask your device manufacturer to fix their device/drivers to not change device IDs; Microsoft requires that these do not change.

## Thanks

- Thanks to [Fred Emmott](https://github.com/fredemmott) for creating the original [StreamDeck-AudioOutputSwitcher](https://github.com/fredemmott/StreamDeck-AudioOutputSwitcher) that this project is forked from.
- Thanks to "EreTIk" for finding/documenting the COM interface both implementations here rely on.
- Thanks to "LordValgor" for the idea of making this plugin.

## License

This project is [MIT-licensed](LICENSE)
