import { LazyInfoHelper } from '../helpers';

export default {
  handler: async (event) => {
    await event.message.edit({
      text: await LazyInfoHelper.getInfo()
    });
  },
  commands: 'alive'
} as LBPlugin;
export const help =
  `Un complemento solo para verificar si el bot está activado\n\n` +
  `<b>Comandos Disponibles:</b>\n\n` +
  `• <code>{}alive</code> - Muestra el bot y algo de información del sistema`;
