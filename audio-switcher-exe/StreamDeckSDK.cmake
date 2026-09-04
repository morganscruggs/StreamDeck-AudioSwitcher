include(FetchContent)

FetchContent_Declare(
  StreamDeckSDK
  GIT_REPOSITORY https://github.com/fredemmott/StreamDeck-CPPSDK
  GIT_TAG 2652cbddee10bea56f19484ddd074c26e9f179de
  DOWNLOAD_EXTRACT_TIMESTAMP ON
)

FetchContent_GetProperties(StreamDeckSDK)
if(NOT streamdecksdk_POPULATED)
  FetchContent_Populate(StreamDeckSDK)
  add_subdirectory("${streamdecksdk_SOURCE_DIR}" "${streamdecksdk_BINARY_DIR}" EXCLUDE_FROM_ALL)
endif()

if(APPLE)
  set(
    STREAMDECK_PLUGIN_DIR
    "$ENV{HOME}/Library/Application Support/com.elgato.StreamDeck/Plugins"
  )
elseif(WIN32)
  string(
    REPLACE
    "\\"
    "/"
    STREAMDECK_PLUGIN_DIR
    "$ENV{appdata}/Elgato/StreamDeck/Plugins"
  )
endif()

set(
  STREAMDECK_PLUGIN_DIR
  ${STREAMDECK_PLUGIN_DIR}
  CACHE PATH "Path to this system's streamdeck plugin directory"
)

function(set_default_install_dir_to_streamdeck_plugin_dir)
  if(CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
    set(
      CMAKE_INSTALL_PREFIX
      "${STREAMDECK_PLUGIN_DIR}/${CMAKE_PROJECT_NAME}"
      CACHE PATH "See cmake documentation"
      FORCE
    )
  endif()
endfunction()

# Installs into the repo's top-level directory (alongside audio-switcher-exe/, audio-switcher-node/,
# shared/) rather than Stream Deck's own Plugins folder - mirrors where the Node project's build output
# lands relative to the repo. Pair with sync_install_to_streamdeck_plugin_dir() to still have Stream
# Deck pick up the build automatically, the same way the Node project's rollup config does.
function(set_default_install_dir_to_repo_root)
  if(CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT)
    set(
      CMAKE_INSTALL_PREFIX
      "${CMAKE_SOURCE_DIR}/../${CMAKE_PROJECT_NAME}"
      CACHE PATH "See cmake documentation"
      FORCE
    )
  endif()
endfunction()

# Registers a final install step that mirrors CMAKE_INSTALL_PREFIX's assembled plugin folder into
# Stream Deck's real Plugins directory. Must be called after every other install() rule in the project
# (install() rules run in declaration order), so Stream Deck always sees a complete, consistent copy.
function(sync_install_to_streamdeck_plugin_dir)
  install(CODE "
    file(REMOVE_RECURSE \"${STREAMDECK_PLUGIN_DIR}/${CMAKE_PROJECT_NAME}\")
    file(COPY \"${CMAKE_INSTALL_PREFIX}/\" DESTINATION \"${STREAMDECK_PLUGIN_DIR}/${CMAKE_PROJECT_NAME}\")
    message(STATUS \"Synced plugin to ${STREAMDECK_PLUGIN_DIR}/${CMAKE_PROJECT_NAME}\")
  ")
endfunction()
