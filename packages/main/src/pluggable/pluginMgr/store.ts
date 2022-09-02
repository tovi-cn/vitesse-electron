/**
 * Provides access to the plugins stored by Pluggable Electron
 * @namespace pluginManager
 */

import { writeFileSync } from 'fs'
import Plugin from './Plugin'
import { getPluginsFile } from './globals'

// Register of installed plugins
/**
 * @private
 * @typedef plugins
 * @param {...Plugin} plugin - List of installed plugins
 */
const plugins: any = {}

/**
 * Get a plugin from the stored plugins.
 * @param {string} name Name of the plugin to retrieve
 * @returns {Plugin} Retrieved plugin
 * @alias pluginManager.getPlugin
 */
export function getPlugin(name: string) {
  // eslint-disable-next-line no-prototype-builtins
  if (!plugins.hasOwnProperty(name)) {
    throw new Error(`Plugin ${name} does not exist`)
  }

  return plugins[name]
}

/**
 * Get list of all plugin objects.
 * @returns {Array.<Plugin>} All plugin objects
 * @alias pluginManager.getAllPlugins
 */
export function getAllPlugins() { return Object.values<any>(plugins) }

/**
 * Get list of active plugin objects.
 * @returns {Array.<Plugin>} Active plugin objects
 * @alias pluginManager.getActivePlugins
 */
export function getActivePlugins() {
  return Object.values(plugins).filter((plugin: any) => plugin._active)
}

/**
 * @private
 * Remove plugin from store and maybe save stored plugins to file
 * @param {string} name Name of the plugin to remove
 * @param {boolean} persist Whether to save the changes to plugins to file
 * @returns {boolean} Whether the delete was successful
 */
export function removePlugin(name: string, persist = true) {
  const del = delete plugins[name]
  if (persist) persistPlugins()
  return del
}

/**
 * @private
 * Add plugin to store and maybe save stored plugins to file
 * @param {Plugin} plugin Plugin to add to store
 * @param {boolean} persist Whether to save the changes to plugins to file
 * @returns {void}
 */
export function addPlugin(plugin: any, persist = true) {
  plugins[plugin.name] = plugin
  if (persist) {
    persistPlugins()
  }
  plugin.subscribe(persistPlugins)
}

/**
 * @private
 * Save stored plugins to file
 * @returns {void}
 */
export function persistPlugins() {
  const persistData: any = {}
  for (const name in plugins) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _listeners, dependencies, ...plugin } = plugins[name]
    persistData[name] = plugin
  }
  writeFileSync(getPluginsFile(), JSON.stringify(persistData), 'utf8')
}

/**
 * Create and install a new plugin for the given specifier.
 * @param {String} spec The specifier used to locate the package (from NPM or local file)
 * @param {Object} [options] Optional options passed to {@link https://www.npmjs.com/package/pacote|pacote} to fetch the manifest
 * @param {boolean} [store=true] Whether to store the installed plugin in the store
 * @returns {Plugin} New plugin
 * @alias pluginManager.installPlugin
 */
export async function installPlugin(spec: string, options: object, store = true) {
  const plugin = new Plugin(spec, options)
  await plugin._install()
  if (store) addPlugin(plugin)
  return plugin
}


/**
 * This function is executed when a plugin is installed to verify that the user indeed wants to install the plugin.
 * @function confirmInstall
 * @param {string} plg The specifier used to locate the package (from NPM or local file)
 * @returns {Promise<boolean>} Whether to proceed with the plugin installation
 */
export let confirmInstall = function () {
  return new Error(
    'The facade.confirmInstall callback needs to be set in when initializing Pluggable Electron in the main process.',
  )
}

export function setConfirmInstall(cb: () => Error) { confirmInstall = cb }
