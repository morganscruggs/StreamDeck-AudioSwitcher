//==============================================================================
/**
@file       AudioSwitcherStreamDeckPlugin.cpp

@brief      CPU plugin

@copyright  (c) 2018, Corsair Memory, Inc.
@copyright  (c) 2018-present, Fred Emmott.
@copyright  (c) 2026-present, Morgan Scruggs.
      This source code is licensed under the MIT-style license found in the
LICENSE file.

      Forked from Fred Emmott's original Audio Switcher plugin:
      https://github.com/fredemmott/StreamDeck-AudioOutputSwitcher
      All credit for the original plugin and design goes to Fred Emmott
      (https://github.com/fredemmott).

**/
//==============================================================================

#include "AudioSwitcherStreamDeckPlugin.h"

#include <AudioDevices/AudioDevices.h>
#include <StreamDeckSDK/EPLJSONUtils.h>
#include <StreamDeckSDK/ESDConnectionManager.h>
#include <StreamDeckSDK/ESDLogger.h>

#include <atomic>
#include <functional>
#include <mutex>

#ifdef _MSC_VER
#include <objbase.h>
#endif

#include "audio_json.h"

using namespace FredEmmott::Audio;
using json = nlohmann::json;

namespace {

ButtonRole ButtonRoleFromAudioDeviceRole(const AudioDeviceRole role) {
  switch (role) {
    case AudioDeviceRole::COMMUNICATION:
      return ButtonRole::COMMUNICATION;
    case AudioDeviceRole::DEFAULT:
      return ButtonRole::DEFAULT;
  }
  return ButtonRole::DEFAULT;
}

AudioDeviceRole AudioDeviceRoleFromButtonRole(const ButtonRole role) {
  switch (role) {
    case ButtonRole::COMMUNICATION:
      return AudioDeviceRole::COMMUNICATION;
    case ButtonRole::ALL:
    case ButtonRole::DEFAULT:
    default:
      return AudioDeviceRole::DEFAULT;
  }
}

bool IsRoleActive(
  const ButtonSettings& settings,
  const std::string& deviceID,
  const std::string& defaultDeviceID = {}) {
  if (settings.role == ButtonRole::ALL) {
    const auto defaultID = defaultDeviceID.empty()
      ? GetDefaultAudioDeviceID(settings.direction, AudioDeviceRole::DEFAULT)
      : defaultDeviceID;
    const auto communicationID = GetDefaultAudioDeviceID(
      settings.direction,
      AudioDeviceRole::COMMUNICATION);
    return deviceID == defaultID || deviceID == communicationID;
  }
  return deviceID == GetDefaultAudioDeviceID(
    settings.direction,
    AudioDeviceRoleFromButtonRole(settings.role));
}

constexpr std::string_view SET_ACTION_ID{
  "com.morganscruggs.audioswitcherplus.set"};
constexpr std::string_view TOGGLE_ACTION_ID{
  "com.morganscruggs.audioswitcherplus.toggle"};

bool FillAudioDeviceInfo(AudioDeviceInfo& di) {
  if (di.id.empty()) {
    return false;
  }
  if (!di.displayName.empty()) {
    return false;
  }

  const auto devices = GetAudioDeviceList(di.direction);
  if (!devices.contains(di.id)) {
    return false;
  }
  di = devices.at(di.id);
  return true;
}

}// namespace

AudioSwitcherStreamDeckPlugin::AudioSwitcherStreamDeckPlugin() {
#ifdef _MSC_VER
  CoInitializeEx(
    NULL, COINIT_MULTITHREADED);// initialize COM for the main thread
#endif
  mCallbackHandle = AddDefaultAudioDeviceChangeCallback(std::bind_front(
    &AudioSwitcherStreamDeckPlugin::OnDefaultDeviceChanged, this));
}

AudioSwitcherStreamDeckPlugin::~AudioSwitcherStreamDeckPlugin() {
  mCallbackHandle = {};
}

void AudioSwitcherStreamDeckPlugin::OnDefaultDeviceChanged(
  AudioDeviceDirection direction,
  AudioDeviceRole role,
  const std::string& device) {
  std::scoped_lock lock(mVisibleContextsMutex);
  for (const auto& [context, button] : mButtons) {
    if (button.settings.direction != direction) {
      continue;
    }
    const auto buttonRole = ButtonRoleFromAudioDeviceRole(role);
    if (button.settings.role != ButtonRole::ALL
        && button.settings.role != buttonRole) {
      continue;
    }
    UpdateState(context, device);
  }
}

void AudioSwitcherStreamDeckPlugin::KeyDownForAction(
  const std::string& inAction,
  const std::string& inContext,
  const json& inPayload,
  const std::string& inDeviceID) {
  const auto state = EPLJSONUtils::GetIntByName(inPayload, "state");
}

void AudioSwitcherStreamDeckPlugin::KeyUpForAction(
  const std::string& inAction,
  const std::string& inContext,
  const json& inPayload,
  const std::string& inDeviceID) {
  ESDDebug("{}: {}", __FUNCTION__, inPayload.dump());
  std::scoped_lock lock(mVisibleContextsMutex);

  if (!inPayload.contains("settings")) {
    return;
  }
  auto& settings = mButtons[inContext].settings;
  settings = inPayload.at("settings");
  FillButtonDeviceInfo(inContext);

  const auto state = EPLJSONUtils::GetIntByName(inPayload, "state");
  // this looks inverted - but if state is 0, we want to move to state 1, so
  // we want the secondary devices. if state is 1, we want state 0, so we want
  // the primary device
  const auto deviceID = (state != 0 || inAction == SET_ACTION_ID)
    ? settings.VolatilePrimaryID()
    : settings.VolatileSecondaryID();
  if (deviceID.empty()) {
    ESDDebug("Doing nothing, no device ID");
    return;
  }

  const auto deviceState = GetAudioDeviceState(deviceID);
  if (deviceState != AudioDeviceState::CONNECTED) {
    if (inAction == SET_ACTION_ID) {
      mConnectionManager->SetState(1, inContext);
    }
    mConnectionManager->ShowAlertForContext(inContext);
    return;
  }

  if (inAction == SET_ACTION_ID) {
    if (settings.role == ButtonRole::ALL) {
      const auto alreadySet = deviceID == GetDefaultAudioDeviceID(
                                settings.direction,
                                AudioDeviceRole::DEFAULT)
        && deviceID == GetDefaultAudioDeviceID(
          settings.direction,
          AudioDeviceRole::COMMUNICATION);
      if (alreadySet) {
        // We already have the correct device, undo the state change
        mConnectionManager->SetState(state, inContext);
        ESDDebug("Already set, nothing to do");
        return;
      }
    } else if (
      deviceID
      == GetDefaultAudioDeviceID(
        settings.direction,
        AudioDeviceRoleFromButtonRole(settings.role))) {
      mConnectionManager->SetState(state, inContext);
      ESDDebug("Already set, nothing to do");
      return;
    }
  }

  ESDDebug("Setting device to {}", deviceID);
  if (settings.role == ButtonRole::ALL) {
    SetDefaultAudioDeviceID(
      settings.direction,
      AudioDeviceRole::DEFAULT,
      deviceID);
    SetDefaultAudioDeviceID(
      settings.direction,
      AudioDeviceRole::COMMUNICATION,
      deviceID);
    return;
  }
  SetDefaultAudioDeviceID(
    settings.direction,
    AudioDeviceRoleFromButtonRole(settings.role),
    deviceID);
}

void AudioSwitcherStreamDeckPlugin::WillAppearForAction(
  const std::string& inAction,
  const std::string& inContext,
  const json& inPayload,
  const std::string& inDeviceID) {
  std::scoped_lock lock(mVisibleContextsMutex);
  // Remember the context
  mVisibleContexts.insert(inContext);
  auto& button = mButtons[inContext];
  button = {inAction, inContext};

  if (!inPayload.contains("settings")) {
    return;
  }
  button.settings = inPayload.at("settings");

  UpdateState(inContext);
  FillButtonDeviceInfo(inContext);
}

void AudioSwitcherStreamDeckPlugin::FillButtonDeviceInfo(
  const std::string& context) {
  auto& settings = mButtons.at(context).settings;

  const auto filledPrimary = FillAudioDeviceInfo(settings.primaryDevice);
  const auto filledSecondary = FillAudioDeviceInfo(settings.secondaryDevice);
  if (filledPrimary || filledSecondary) {
    ESDDebug("Backfilling settings to {}", json(settings).dump());
    mConnectionManager->SetSettings(settings, context);
  }
}

void AudioSwitcherStreamDeckPlugin::WillDisappearForAction(
  const std::string& inAction,
  const std::string& inContext,
  const json& inPayload,
  const std::string& inDeviceID) {
  // Remove the context
  std::scoped_lock lock(mVisibleContextsMutex);
  mVisibleContexts.erase(inContext);
  mButtons.erase(inContext);
}

void AudioSwitcherStreamDeckPlugin::SendToPlugin(
  const std::string& inAction,
  const std::string& inContext,
  const json& inPayload,
  const std::string& inDeviceID) {
  json outPayload;

  const auto event = EPLJSONUtils::GetStringByName(inPayload, "event");
  ESDDebug("Received event {}", event);

  if (event == "getDeviceList") {
    const auto outputList = GetAudioDeviceList(AudioDeviceDirection::OUTPUT);
    const auto inputList = GetAudioDeviceList(AudioDeviceDirection::INPUT);
    mConnectionManager->SendToPropertyInspector(
      inAction,
      inContext,
      json({
        {"event", event},
        {"outputDevices", outputList},
        {"inputDevices", inputList},
      }));
    return;
  }
}

void AudioSwitcherStreamDeckPlugin::UpdateState(
  const std::string& context,
  const std::string& optionalDefaultDevice) {
  const auto button = mButtons[context];
  const auto action = button.action;
  const auto settings = button.settings;
  const auto primaryID = settings.VolatilePrimaryID();
  const auto secondaryID = settings.VolatileSecondaryID();

  std::string activeDevice;
  if (!optionalDefaultDevice.empty()) {
    activeDevice = optionalDefaultDevice;
  } else if (settings.role == ButtonRole::ALL) {
    activeDevice = GetDefaultAudioDeviceID(
      settings.direction,
      AudioDeviceRole::DEFAULT);
    if (activeDevice.empty() || activeDevice == secondaryID || activeDevice == primaryID) {
      activeDevice = GetDefaultAudioDeviceID(
        settings.direction,
        AudioDeviceRole::COMMUNICATION);
    }
  } else {
    activeDevice = GetDefaultAudioDeviceID(
      settings.direction,
      AudioDeviceRoleFromButtonRole(settings.role));
  }

  std::scoped_lock lock(mVisibleContextsMutex);
  if (action == SET_ACTION_ID) {
    mConnectionManager->SetState(
      activeDevice == primaryID || (settings.role == ButtonRole::ALL && activeDevice == primaryID)
        ? 0
        : 1,
      context);
    return;
  }

  if (activeDevice == primaryID) {
    mConnectionManager->SetState(0, context);
    return;
  }

  if (activeDevice == secondaryID) {
    mConnectionManager->SetState(1, context);
    return;
  }

  mConnectionManager->ShowAlertForContext(context);
}

void AudioSwitcherStreamDeckPlugin::DeviceDidConnect(
  const std::string& inDeviceID,
  const json& inDeviceInfo) {
  // Nothing to do
}

void AudioSwitcherStreamDeckPlugin::DeviceDidDisconnect(
  const std::string& inDeviceID) {
  // Nothing to do
}

void AudioSwitcherStreamDeckPlugin::DidReceiveGlobalSettings(
  const json& inPayload) {
}

void AudioSwitcherStreamDeckPlugin::DidReceiveSettings(
  const std::string& inAction,
  const std::string& inContext,
  const json& inPayload,
  const std::string& inDeviceID) {
  WillAppearForAction(inAction, inContext, inPayload, inDeviceID);
}
