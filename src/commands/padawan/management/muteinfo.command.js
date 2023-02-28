import Discord from 'discord.js';
import { helpWithASpecificCommand } from '../../everyone/commandsCommon/help.command.js';
import { parseDateForDiscord } from '../../../utils/commandsFunctions/TimeMessageConversor/parseDateForDiscord.js';
import { getUserOfCommand } from '../../../utils/commandsFunctions/getUserMention/getUserOfCommand.js';
import Colors from '../../../utils/commandsFunctions/layoutEmbed/colors.js';
import Icons from '../../../utils/commandsFunctions/layoutEmbed/iconsMessage.js';

export default {
  name: 'muteinfo',
  description: `<prefix>muteinfo @Usuários/TAGs/Nomes/IDs/Citações para saber o motivo de membros terem sidos mutados`,
  permissions: ['padawans'],
  aliases: ['vermute', 'viewmute', 'muteuser', 'infomute'],
  category: 'Moderação ⚔️',
  run: async ({ message, client, args, prefix }) => {
    const { users } = await getUserOfCommand(client, message, prefix);

    if (!args[0] && users.length === 0) {
      const [command] = message.content.slice(prefix.length).split(/ +/);
      helpWithASpecificCommand(command, client, message);
      return;
    }

    if (!users) {
      return message.channel
        .send({
          content: `${message.author}`,
          embeds: [
            {
              color: Colors.pink_red,
              thumbnail: Icons.erro,
              author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
              },
              title: `Não encontrei o usuário !`,
              description: `**Tente usar**\`\`\`${prefix}muteinfo @Usuários/TAGs/Nomes/IDs/Citações\`\`\``,
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }
    users.forEach((user) => {
      const tableTemporarilyMutated = new client.Database.table(
        `tableTemporarilyMutated`
      );
      const guildUndefinedMutated = new client.Database.table(
        `guild_users_mutated_${message.guild.id}`
      );

      const userMuted =
        tableTemporarilyMutated.get(
          `guild_id_${message.guild.id}_user_id_${user.id}`
        ) || guildUndefinedMutated.get(`user_id_${user.id}`);

      function messageUserNotMutated() {
        return message.channel.send({
          content: `${message.author}`,
          embeds: [
            {
              color: Colors.pink_red,
              thumbnail: user.displayAvatarURL({ dynamic: true }),
              author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
              },
              title: `Usuário ${user.tag} não está mutado!`,
              footer: { text: `ID do usuário: ${user.id}` },
              timestamp: new Date(),
            },
          ],
        });
      }
      if (!userMuted) {
        messageUserNotMutated();
        return;
      }
      const muterole = message.guild.roles.cache.find(
        (muteroleObj) => muteroleObj.name === 'MutedBallebot'
      );
      const userHasRoleMuted = client.guilds.cache
        .get(message.guild.id)
        .members.cache.get(userMuted.id)
        .roles.cache.some((role) => role.id === muterole.id);

      if (userHasRoleMuted) {
        const dataForMessage = userMuted.dateMuted
          ? parseDateForDiscord(userMuted.dateMuted)
          : '`<indefinido>`';

        const authorValidation = /(Punido por )(.*)\n/;
        const authorOfMute = authorValidation.test(userMuted.reason)
          ? userMuted.reason
              .match(authorValidation)[0]
              .replace(/(Punido por )|(\n)/g, '')
              .replace(/(\d{18})/, `<@$1>`)
          : `<sem autor>`;

        const descriptionMute = userMuted.reason
          ? userMuted.reason
              .replace(authorValidation, '')
              .replace('— Motivo: ', '')
          : '<Descrição ou motivo não especificado>';

        const inviteMessage = `**Data final do mute: ${dataForMessage}**\n**Punido por: ${authorOfMute}**\n**Motivo: **${descriptionMute} \n`;
        message.channel
          .send({
            content: `${message.author}`,
            embeds: [
              {
                color: Colors.pink_red,
                thumbnail: user.displayAvatarURL({ dynamic: true }),
                author: {
                  name: message.author.tag,
                  icon_url: message.author.displayAvatarURL({ dynamic: true }),
                },
                title: `Informações sobre o mute do usuário: ${user.tag} `,
                description: inviteMessage,
                footer: { text: `ID do usuário: ${userMuted.id}` },
                timestamp: new Date(),
              },
            ],
          })
          .catch(() => {
            const buffer = Buffer.from(inviteMessage);
            const attachment = new Discord.MessageAttachment(
              buffer,
              `ban_of_${user.tag}.txt`
            );
            message.channel.send({
              content: `${user} O usuário possui um motivo muito grande e por esse motivo enviei um arquivo para você ver todo o motivo`,
              files: [attachment],
            });
          });
        return;
      }
      if (guildUndefinedMutated.has(`user_id_${user.id}`)) {
        guildUndefinedMutated.delete(`user_id_${user.id}`);
      } else if (
        tableTemporarilyMutated.has(
          `guild_id_${message.guild.id}_user_id_${user.id}`
        )
      ) {
        tableTemporarilyMutated.delete(
          `guild_id_${message.guild.id}_user_id_${user.id}`
        );
      }
      messageUserNotMutated();
    });
  },
};
