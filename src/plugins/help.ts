import { extract, LazyHelp } from '../helpers';

const HELP: LBPlugin = {
  handler: async (event) => {
    const { args } = extract(event.message.message);
    if (!args) {
      await event.message.edit({
        text:
          `<b><u>Asistente de ayuda del bot</u></b>\n\n` +
          `<b>Uso:</b> <code>.help plugin</code>\n\n` +
          `<b>Plugins Disponibles</b>\n` +
          `<code>` +
          LazyHelp.getPluginList().reduce(
            (prev, current) => prev + ', ' + current
          ) +
          `</code>`
      });
      return;
    }

    await event.message.edit({
      text:
        `<b>Plugin: </b><code>${args}</code>\n\n` +
        LazyHelp.getHelp(args.trim())
    });
  },
  allowArgs: true,
  commands: 'help'
};

export default [HELP];
export const help =
  '<b>Ejemplos</b>\n\n' +
  '• <code>{}help</code> : <i>Muestra este menú de ayuda</i>\n' +
  '• <code>{}help plugin</code> : <i>Muestra ayuda sobre el plugin mencionado</i>';
