const Ping: LBPlugin = {
  handler: async (event) => {
    const toSubtract = new Date().getTime();
    await event.message.edit({
      text: 'Pong...'
    });
    await event.message.edit({
      text:
        '<b>Pong =></b> <code>' +
        (new Date().getTime() - toSubtract) +
        '</code> ms'
    });
  },
  commands: 'ping',
  outgoing: true
};

export default [Ping];
export const help =
  '<i>Comprueba el tiempo de ping con el servidor Telegram</i>\n\n' +
  '<b>Comandos Disponibles: </b>\n\n' +
  '• <code>{}ping</code>';
