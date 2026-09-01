/* Copyright (c) 2018-present, Fred Emmott
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file.
 */
#pragma once

#include <AudioDevices/AudioDevices.h>

#include <nlohmann/json.hpp>

using namespace FredEmmott::Audio;

enum class DeviceMatchStrategy {
  ID,
  Fuzzy,
};

enum class ButtonRole {
  DEFAULT,
  COMMUNICATION,
  ALL,
};

struct ButtonSettings {
  AudioDeviceDirection direction = AudioDeviceDirection::INPUT;
  ButtonRole role = ButtonRole::ALL;
  AudioDeviceInfo primaryDevice;
  AudioDeviceInfo secondaryDevice;
  DeviceMatchStrategy matchStrategy = DeviceMatchStrategy::Fuzzy;
  // Lowercase ID of a bright/dark icon pair in AudioDevicesIcons/, or
  // empty to use the plugin's built-in default icon. Used by the "Set"
  // action.
  std::string icon;
  // Used by the "Toggle" action instead of `icon`, since its two states
  // represent two different devices rather than one device's active/inactive
  // state.
  std::string primaryIcon;
  std::string secondaryIcon;

  // Changes if there's a fuzzy match
  std::string VolatilePrimaryID() const;
  std::string VolatileSecondaryID() const;
};

void from_json(const nlohmann::json&, ButtonSettings&);
void to_json(nlohmann::json&, const ButtonSettings&);
