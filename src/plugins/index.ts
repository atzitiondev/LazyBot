import fs from 'fs';
import path from 'path';
import { getPatternFromCmd, LazyHelp } from '../helpers';
import { TelegramClient } from 'telegram';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import env from '../env';

class PluginLoader {
  private commands: Map<string, LBPlugin['handler']>;

  constructor() {
    this.commands = new Map<string, LBPlugin['handler']>();
  }

  private validate(plugin: LBPlugin, filename: string) {
    if (!('handler' in plugin)) {
      console.warn(`[Bot] => Plugin no Válido - No se ha encontrado ningún controlador`);
      return false;
    }

    if (typeof plugin.handler !== 'function') {
      console.warn(`[Bot] => Plugin no Válido - Controlador no válido`);
      return false;
    }

    if (plugin.outgoing && !(plugin.commands || plugin.pattern)) {
      console.warn(
        `[Bot] => Plugin no Válido - Comandos/patrón necesarios para este plugin`
      );
      return false;
    }

    return true;
  }

  addPlugin(plugin: LBPlugin, client: TelegramClient) {
    const handler = async (event: NewMessageEvent) => {
      try {
        return await plugin.handler(event, client);
      } catch (e) {
        const error =
          e instanceof Error
            ? `<b>[${e.name}] =></b> <code>${e.message}</code>`
            : `<code>${String(e)}</code>`;
        try {
          event.message.edit({
            text: error
          });
          client.sendMessage(env.LOG_CHAT_ID, { message: error });
        } catch (e) {
          console.log('[Bot][Error] => ' + String(e));
        }
      }
    };

    client.addEventHandler(
      handler,
      new NewMessage({
        outgoing: plugin.outgoing ?? true,
        incoming: plugin.incoming ?? false,
        forwards: plugin.forwards ?? false,
        pattern: plugin.commands
          ? getPatternFromCmd(plugin.commands, plugin.allowArgs)
          : plugin.pattern
      })
    );
  }

  async load(client: TelegramClient) {
    console.info('[LazyBot] => Buscando Plugins...');
    const pluginFiles = fs
      .readdirSync(__dirname)
      .filter(
        (file) =>
          file.slice(0, -3) !== 'index' && ['ts', 'js'].includes(file.slice(-2))
      );

    console.info(`[Bot] => Found ${pluginFiles.length} Archivos de Plugin...\n`);

    console.info('[Bot] => Cargando Plugins...');
    for (const file of pluginFiles) {
      const filename = file.slice(0, -3);
      let xdplug = await import(path.join(__dirname, filename));

      let plugin = xdplug.default as LBPlugin | LBPlugin[];
      if (!plugin) {
        return console.log('[Bot] => Error al cargar el plugin - ' + filename);
      }

      let help = xdplug.help as string;
      if (!help) {
        help = '<code>No hay documentos proporcionados por el desarrollador de plugins</code>';
      }

      if (!Array.isArray(plugin)) {
        plugin = [plugin];
      }

      for (let pl of plugin) {
        if (!this.validate(pl, filename)) return;
        this.addPlugin(pl, client);
      }

      LazyHelp.addHelp(filename, help.replace(/{}/g, env.CMD_PREFIX));
      console.info('[Bot] => Cargado archivo de plugin - ' + filename);
    }
  }
}

export const plugins = new PluginLoader();
