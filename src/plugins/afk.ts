import { Api } from 'telegram';
import { afk, sleep, extract, LazyLogger } from '../helpers';

const AFK_HANDLE: LBPlugin = {
  handler: async (event, client) => {
    if (!afk.isAfk) return;

    // isChannel returning true in groups, IDK if it is preferred behaviour.
    if (event.isChannel && !event.isGroup) return;

    if (event.isPrivate && event.message.sender) {
      const user = (await event.message.getSender()) as Api.User;
      if (user.bot || user.verified) return;
      afk.addWatch({ name: user.firstName ?? '', userid: user.id });
    }

    if (event.isGroup) {
      if (!event.message.mentioned) return;
      const group = (await client.getEntity(event.chatId!)) as Api.Channel;
      const user = (await event.message.getSender()) as Api.User;
      if (group.username) {
        afk.addWatch({
          title: group.title,
          link: `https://t.me/${group.username}/${event._messageId}`,
          by: { name: user.firstName ?? '', id: user.id }
        });
      } else {
        afk.addWatch({
          title: group.title,
          link: `https://t.me/c/${group.id}/${event._messageId}`,
          by: { name: user.firstName ?? '', id: user.id }
        });
      }
    }

    const afkInfo = afk.getAfk();
    await event.message.reply({
      message:
        `Actualmente estoy AFK. Por favor, no envíe spam y espere mi respuesta\n\n` +
        `&#9055; <b>Razón:</b> <code>${afkInfo.reason}</code>\n` +
        `&#9055; <b>Ya que:</b> <code>${afkInfo.since}</code>`
    });
  },
  outgoing: false,
  incoming: true
};

const AFK_CMD: LBPlugin = {
  handler: async (event) => {
    const { args } = extract(event.message.message);
    const reason = args || 'No Mencionado';

    await event.message.edit({
      text: `Modo AFK activado\n\n&#9055; <b>Razón:</b> <code>${reason}</code>`
    });

    afk.setAfk(reason);
    await sleep(2500);
    await event.message.delete({ revoke: true });
  },
  commands: 'afk',
  allowArgs: true
};

const AFK_STOP: LBPlugin = {
  handler: async (e, client) => {
    // Don't run on afk command itself as pattern is wild card
    if (e.message.message.match(/afk/)) return;
    await sleep(2500);
    if (!afk.isAfk) return;
    const off = await client.sendMessage(e.message.chatId!, {
      message: 'AFK se ha desactivado...'
    });
    await sleep(500);
    client.deleteMessages(off.chatId, [off.id], { revoke: true });
    await LazyLogger.log(client, afk.WatchList);
    afk.stopAfk();
  },
  pattern: /.*/,
  outgoing: true,
  incoming: false
};

export default [AFK_HANDLE, AFK_CMD, AFK_STOP];
export const help =
  `AFK son las siglas de Away From Keyboard. Si activa el modo AFK antes de desconectarse, cuando alguien PM / lo mencione, se le notificará que está desconectado.\n\n` +
  `<b>Ejemplos: </b>\n\n` +
  `• <code>{}afk</code> : Enciende AFK\n` +
  `• <code>{}afk tengo fiesta</code> : Activa AFK con el motivo establecido en 'tengo fiesta'\n\n` +
  `El modo AFK se desactivará automáticamente si envía cualquier mensaje y las MD/menciones recibidas se registrarán en el chat de log.`;
