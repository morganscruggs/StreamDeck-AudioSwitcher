{
  "Actions": [
    {
      "States": [
        {
          "Image": "AudioDevicesIcons/headphones_bright"
        },
        {
          "Image": "AudioDevicesIcons/speaker_bright"
        }
      ],
      "SupportedInMultiActions": false,
      "Icon": "AudioDevicesIcons/headphones_bright",
      "Name": "Toggle Audio Device",
      "Tooltip": "Switch between two audio devices.",
      "UUID": "com.morganscruggs.audioswitcherplus.toggle"
    },
    {
      "SupportedInMultiActions": true,
      "Icon": "AudioDevicesIcons/headphones_bright",
      "Name": "Set Audio Device",
      "Tooltip": "Set a specific audio device",
      "UUID": "com.morganscruggs.audioswitcherplus.set",
      "States": [
        {
          "Image": "AudioDevicesIcons/headphones_bright"
        },
        {
          "Image": "AudioDevicesIcons/headphones_dark"
        }
      ]
    }
  ],
  "Author": "Morgan Scruggs",
  "CodePathMac": "sdaudioswitchplus",
  "CodePathWin": "sdaudioswitchplus.exe",
  "Description": "Toggle or set the active audio devices. Fork of Fred Emmott's Audio Switcher (github.com/fredemmott).",
  "Name": "Audio Switcher Plus",
  "PropertyInspectorPath": "propertyinspector/index.html",
  "Icon": "headphones",
  "Category": "Audio Devices Plus",
  "CategoryIcon": "glyphicons-basic-140-adjust",
  "Version": "${CMAKE_PROJECT_VERSION}",
  "OS": [
    {
      "Platform": "windows",
      "MinimumVersion": "10"
    },
    {
      "Platform": "mac",
      "MinimumVersion": "${CMAKE_OSX_DEPLOYMENT_TARGET}"
    }
  ],
  "SDKVersion": 2,
  "Software": {
    "MinimumVersion": "4.1"
  }
}
