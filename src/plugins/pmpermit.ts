import { prisma } from '../prisma';
import { BlockUser, sleep } from '../helpers';
import { Api } from 'telegram';
import env from '../env';

const warnuser = (warns: number): string => {
  return (
    `<code>Esta es una respuesta automática</code>\n\n` +
    `<i>Espere a que el maestro apruebe su solicitud de bandeja de entrada\n` +
    `Si sigue enviando spam, será bloqueado y reportado automáticamente</i>\n\n` +
    `<b>Avisos:</b> <code>${warns}</code>`
  );
};

const PMPERMIT: LBPlugin = {
  handler: async (event, client) => {
    if (!event.isPrivate || !event.message.senderId) return;

    const sender = (await event.message.getSender()) as Api.User;
    if (sender.self || sender.verified || sender.bot) return;
    const senderId = sender.id.toString();

    let user = await prisma.pmPermit.findUnique({
      where: { id: senderId }
    });

    if (user?.approved) {
      await prisma.$disconnect();
      return;
    }

    if (!user) {
      user = await prisma.pmPermit.create({
        data: { id: senderId, warns: 1 }
      });
    } else {
      await prisma.pmPermit.update({
        where: { id: senderId },
        data: { warns: ++user.warns }
      });
    }
    await prisma.$disconnect();

    if (user.warns > env.PM_PERMIT_MAX_WARNS) {
      await client.sendMessage(senderId, {
        message: '<code>Ha sido bloqueado</code>'
      });
      await client.invoke(BlockUser(senderId));

      return;
    } else {
    }

    if (env.PM_PERMIT_MODE === 'text') {
      await event.message.reply({
        message: warnuser(user.warns)
      });
      return;
    }

    if (env.PM_PERMIT_MODE === 'media' && env.PM_PERMIT_MEDIA) {
      await event.message.reply({
        file: env.PM_PERMIT_MEDIA,
        forceDocument: false,
        message: warnuser(user.warns)
      });
    }
  },
  incoming: true,
  outgoing: false
};

const PMPERMIT_APPROVE: LBPlugin = {
  handler: async (event) => {
    if (event.isGroup || !event.chatId) {
      await event.message.edit({
        text: '<code>Este comando está permitido en chats privados</code>'
      });
      return;
    }

    const user = await prisma.pmPermit.findFirst({
      where: { id: event.chatId.toString() }
    });

    if (user && user.approved) {
      await event.message.edit({
        text: '<code>El usuario ya está aprobado</code>'
      });
      await prisma.$disconnect();
      return;
    }

    await prisma.pmPermit.upsert({
      where: { id: event.chatId.toString() },
      update: { approved: true, warns: 0 },
      create: {
        id: event.chatId.toString(),
        approved: true
      }
    });
    await prisma.$disconnect();

    await event.message.edit({ text: `<b>El usuario ha sido aprobado</b>` });
    await sleep(2500);
    await event.message.delete({ revoke: true });
  },
  commands: ['a', 'approve']
};

const PMPERMIT_BLOCK: LBPlugin = {
  handler: async (event, client) => {
    if (event.isGroup || !event.chatId) {
      await event.message.edit({
        text: '<code>Este comando está permitido en chats privados</code>'
      });
      return;
    }

    await prisma.pmPermit.upsert({
      where: { id: event.chatId.toString() },
      update: { approved: false },
      create: {
        id: event.chatId.toString(),
        approved: false
      }
    });

    await event.message.delete();
    await client.invoke(BlockUser(event.message.senderId!));
  },
  commands: ['unapprove', 'block']
};

export default [PMPERMIT, PMPERMIT_APPROVE, PMPERMIT_BLOCK];
export const help =
  '<i>El permiso de MD es una función para evitar el spam en la bandeja de entrada y los DM no deseados</i>\n\n' +
  '<b>Comandos Disponibles: </b>\n\n' +
  "• <code>{}a</code> | <code>{}approve</code> : <i>Aprueba el usuario. Ahora no perturbará la conversación.</i>\n" +
  "• <code>{}unapprove</code> | <code>{}block</code> : <i>No acepta el MD y bloquea al usuario.</i>";
