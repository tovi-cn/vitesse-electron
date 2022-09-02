declare module 'xno' {

  export const version: string;

  export interface Command {
		/**
		 * 命令的标题，例如 `save`.
		 */
		title: string;

		/**
		 * 实际命令处理程序的标识符.
		 * @see {@link commands.registerCommand}
		 */
		command: string;

		/**
		 * 命令的工具提示，在 UI 中表示时.
		 */
		tooltip?: string;

		/**
		 * 命令处理程序应该被调用的参数
		 */
		arguments?: any[];
	}
}
