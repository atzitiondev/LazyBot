/**
 * This plugin is ported from - https://github.com/GramUS/GramUS/blob/29d3aba2c5932d1c5d886a90eb16ec606cbab212/src/handlers/sh.ts
 * Credits to the originial devs.
 */

import { extract, LazyFileHelper } from '../helpers';
import { exec } from 'child_process';
import { createHash } from 'crypto';
import { escape } from 'html-escaper';

const SH: LBPlugin = {
  handler: async (event) => {
    const { args: command } = extract(event.message.message);
    event.message.edit({ text: '<code>...</code>' });

    exec(command, async (err, stdout, stderr) => {
      stdout = stdout.trim() || 'None';
      stderr = stderr.trim() || 'None';

      if (err) {
        await event.message.edit({
          text: '<code>[≈]</code> ' + escape(err.name + ': ' + err.message)
        });
      } else if (stdout === 'None' && stderr === 'None') {
        await event.message.edit({ text: '<code>[×]</code> No hay salida' });
      } else {
        const message =
          `<code>[&#955;]</code> cmd:<code> ${command}</code>\n\n` +
          `<code>[≈]</code> stdout:<code>\n${escape(stdout)}</code>\n\n` +
          `<code>[×]</code> stderr:\n<code>${escape(stderr)}</code>`;

        if (message.length > 4000) {
          const data = `stdout:\n${stdout}\n\nstderr:\n${stderr}`;
          const filename = `output-${createHash('md5')
            .update(data)
            .digest('hex')}.txt`;
          LazyFileHelper.saveFile(data, filename);
          await event.message.reply({
            file: LazyFileHelper.getFilePath(filename),
            message: ''
          });
          LazyFileHelper.deleteFile(filename);
        } else {
          await event.message.edit({ text: message });
        }
      }
    });
  },
  commands: ['sh', 'bash'],
  allowArgs: true
};

export default [SH];
export const help =
  `Ejecuta comandos de Shell. <b><u>No lo use si no comprende las secuencias de comandos de shell</u></b>\n\n` +
  `<b>Comandos Disponibles:</b>\n\n` +
  `• <code>{}sh comando</code> : Ejecuta el comando`;
