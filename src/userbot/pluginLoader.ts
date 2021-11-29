import fs from 'fs';
import path from 'path';
import { validate, getPatternFromCmd, extract } from '../utils';
import { TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { LazyHelp } from './helpLoader';

class PluginLoader {
  private commands: Map<string, LGPlugin['handler']>;

  constructor() {
    this.commands = new Map<string, LGPlugin['handler']>();
  }

  addPlugin(plugin: LGPlugin, client: TelegramClient) {
    const handler = async (event: NewMessageEvent) => {
      try {
        await plugin.handler(event, client);
      } catch (error) {
        console.log('[LazyGram][Error] => ' + error);
      }
    };

    client.addEventHandler(
      handler,
      new NewMessage({
        outgoing: plugin.outgoing ?? true,
        incoming: plugin.incoming ?? false,
        pattern: plugin.commands
          ? getPatternFromCmd(plugin.commands, plugin.allowArgs)
          : plugin.pattern
      })
    );
  }

  async load(client: TelegramClient) {
    console.info('[LazyGram] => Looking For Plugins...');
    const pluginFiles = fs
      .readdirSync(
        path.join(
          process.cwd(),
          __dirname.includes('/src/') ? 'src' : 'build',
          'plugins'
        )
      )
      .filter((file) => ['ts', 'js'].includes(file.slice(-2)));

    console.info(`[LazyGram] => Found ${pluginFiles.length} Plugin Files...\n`);

    console.info('[LazyGram] => Loading Plugins...');
    for (const file of pluginFiles) {
      const filename = file.slice(0, -3);
      let xdplug = await import(
        path.join(
          process.cwd(),
          __dirname.includes('/src/') ? 'src' : 'build',
          'plugins',
          filename
        )
      );

      let plugin = xdplug.default as LGPlugin | LGPlugin[];
      let help =
        xdplug.help || '<code>No Docs Provided by Plugin Developer</code>';

      if (!Array.isArray(plugin)) {
        plugin = [plugin];
      }

      for (let pl of plugin) {
        if (!validate(pl)) return;
        this.addPlugin(pl, client);
      }

      LazyHelp.addHelp(filename, help);
      console.info('[LazyGram] => Loaded Plugin File - ' + filename);
    }
  }
}

export const plugins = new PluginLoader();
