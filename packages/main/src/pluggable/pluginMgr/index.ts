import { existsSync, readFileSync, rmdirSync } from 'fs'
import { protocol } from 'electron'
import { normalize, resolve } from 'path'

import Plugin from './Plugin'
import { setConfirmInstall, getAllPlugins as _getAllPlugins, removePlugin, persistPlugins, installPlugin as _installPlugin, getPlugin as _getPlugin, getActivePlugins as _getActivePlugins, addPlugin } from './store'
import { pluginsPath as _pluginsPath, setPluginsPath, getPluginsFile } from './globals'
import router from './router'

/**
 * Sets up the required communication between the main and renderer processes.
 * Additionally sets the plugins up using {@link usePlugins} if a pluginsPath is provided.
 * @param {Object} facade configuration for setting up the renderer facade.
 * @param {confirmInstall} facade.confirmInstall Function to validate that a plugin should be installed.
 * @param {Boolean} [facade.use=true] Whether to make a facade to the plugins available in the renderer.
 * @param {string} [pluginsPath] Optional path to the plugins folder.
 * @returns {pluginManager} A set of functions used to manage the plugin lifecycle.
 * @function
 */
export function init(facade: any, pluginsPath: any) {
  // eslint-disable-next-line no-prototype-builtins
  if (!facade.hasOwnProperty('use') || facade.use) {
    // Store the confirmInstall function
    setConfirmInstall(facade.confirmInstall)
    // Enable IPC to be used by the facade
    router()
  }

  // Create plugins protocol to serve plugins to renderer
  registerPluginProtocol()

  // perform full setup if pluginsPath is provided
  if (pluginsPath) {
    return usePlugins(pluginsPath)
  }

  return {}

}

/**
 * @private
 * Create plugins protocol to provide plugins to renderer
 * @returns {boolean} Whether the protocol registration was successful
 */
const registerPluginProtocol = () => {
  return protocol.registerFileProtocol('plugin', (request, callback) => {
    const entry = request.url.substr(8)
    const url = normalize(_pluginsPath + entry)
    callback({ path: url })
  })
}

/**
 * Set Pluggable Electron up to run from the pluginPath folder if it is provided and
 * load plugins persisted in that folder. Will just return the plugin lifecycle functions if no pluginsPath is provided.
 * @param {string} [pluginsPath] Path to the plugins folder. Required if not yet set up.
 * @returns {pluginManager} A set of functions used to manage the plugin lifecycle.
 */
export function usePlugins(pluginsPath: string) {
  if (!pluginsPath && !_pluginsPath) throw Error('A path to the plugins folder is required to use Pluggable Electron')
  if (pluginsPath) {
    // Store the path to the plugins folder
    setPluginsPath(pluginsPath)

    // Remove any registered plugins
    for (const plugin of _getAllPlugins()) {
      removePlugin(plugin.name, false)
    }

    // Read plugin list from plugins folder
    if (existsSync(getPluginsFile())) {
      const plugins = JSON.parse(readFileSync(getPluginsFile()) as any)
      try {
        // Create and store a Plugin instance for each plugin in list
        for (const p in plugins) {
          loadPlugin(plugins[p])
        }
        persistPlugins()

      } catch (error) {
        // Throw meaningful error if plugin loading fails
        throw new Error('Could not successfully rebuild list of installed plugins. Please check the plugins.json file in the plugins folder')
      }
    }

    // Return the plugin lifecycle functions
  }
  return {
    installPlugin: _installPlugin,
    getPlugin: _getPlugin,
    getAllPlugins: _getAllPlugins,
    getActivePlugins: _getActivePlugins,
  }
}

/**
 * @private
 * Check the given plugin object. If it is marked for uninstalling, the plugin files are removed.
 * Otherwise a Plugin instance for the provided object is created and added to the store.
 * @param {Object} plg Plugin info
 */
const loadPlugin = (plg: any) => {
  if (plg._toUninstall) {
    // Remove plugin if it is set to be uninstalled
    const plgPath = resolve(_pluginsPath, plg.name)
    rmdirSync(plgPath, { recursive: true })

  } else {
    // Create new plugin, populate it with plg details and save it to the store
    const plugin = new Plugin() as any

    for (const key in plg) {
      plugin[key] = plg[key]
    }

    addPlugin(plugin, false)
  }
}
