import { getUserOfCommand } from '../../../utils/commandsFunctions/getUserMention/getUserOfCommand.js';
import { parseDateForDiscord } from '../../../utils/commandsFunctions/TimeMessageConversor/parseDateForDiscord.js';
import { helpWithASpecificCommand } from '../../everyone/commandsCommon/help.command.js';
import Colors from '../../../utils/commandsFunctions/layoutEmbed/colors.js';
import Icons from '../../../utils/commandsFunctions/layoutEmbed/iconsMessage.js';

export default {
  name: 'unwarn',
  description: `<prefix>unwarn @Usuários/TAGs/Nomes/IDs/Citações <aviso1/ 1 / aviso 1> para remover um aviso de usuários`,
  permissions: ['mods'],
  aliases: ['removewarn', 'removerwarn', 'retirarwarn', 'deswarn'],
  category: 'Moderação ⚔️',
  run: async ({ message, client, args, prefix }) => {
    const { users } = await getUserOfCommand(client, message, prefix);

    if (!args[0] && users.length === 0) {
      const [command] = message.content.slice(prefix.length).split(/ +/);
      helpWithASpecificCommand(command, client, message);
      return;
    }

    if (!users) {
      return message.channel.send({
        content: `${message.author}`,
        embeds: [
          {
            color: Colors.pink_red,
            author: {
              name: message.author.tag,
              icon_url: message.author.displayAvatarURL({ dynamic: true }),
            },
            thumbnail: Icons.erro,
            title: `Não encontrei os usuários!`,
            description: `**Tente usar:\n\`\`${prefix}unwarn @Usuários/TAGs/Nomes/IDs/Citações <aviso 1>\`\`**`,
            timestamp: new Date(),
          },
        ],
      });
    }

    function messageSelectWarn() {
      return {
        color: Colors.pink_red,
        thumbnail: Icons.erro,
        author: {
          name: message.author.tag,
          icon_url: message.author.displayAvatarURL({ dynamic: true }),
        },
        title: `Selecione um aviso!`,
        description: `**Você pode usar:\n\`\`${prefix}unwarn @Usuários/TAGs/Nomes/IDs/Citações aviso 1\`\`**`,
        timestamp: new Date(),
      };
    }
    const guildIdDatabase = new client.Database.table(
      `guild_id_${message.guild.id}`
    );
    users.forEach(async (user) => {
      const memberUser = client.guilds.cache
        .get(message.guild.id)
        .members.cache.get(user.id);
      if (
        memberUser?.roles.highest.position >=
          message.member.roles.highest.position &&
        !(message.member.id === message.guild.ownerId)
      ) {
        return message.channel.send({
          content: `${message.author}`,
          embeds: [
            {
              color: Colors.pink_red,
              thumbnail: Icons.erro,
              author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
              },
              title: `Você não tem permissão para remover o aviso do usuário ${user.tag}`,
              description: `**Você não possui um cargo maior que o usuário ${user.tag} para remover os avisos dele, fale com um moderador maior**`,
              footer: `ID do usuário: ${user.id}`,
              timestamp: new Date(),
            },
          ],
        });
      }
      const warnRemove = isNaN(args[args.length - 1])
        ? args[args.length - 1]
        : Number(args[args.length - 1]) - 1;

      if (guildIdDatabase.has(`user_id_${user.id}`)) {
        if (!args[1]) {
          return message.channel.send({
            content: `${message.author}`,
            embeds: [messageSelectWarn()],
          });
        }

        if (isNaN(warnRemove)) {
          if (warnRemove.toLowerCase() === 'all') {
            guildIdDatabase.delete(`user_id_${user.id}`);

            return message.channel.send({
              content: `${message.author}`,
              embeds: [
                {
                  color: Colors.pink_red,
                  author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL({
                      dynamic: true,
                    }),
                  },
                  thumbnail: client.user.displayAvatarURL({ dynamic: true }),
                  title: `Todos os avisos foram removidos do usuário ${user.tag}!`,
                  description: `**O usuário não possui mais avisos**`,
                  footer: { text: `ID do usuário: ${user.id}` },
                  timestamp: new Date(),
                },
              ],
            });
          }

          return message.channel.send({
            content: `${message.author}`,
            embeds: [messageSelectWarn()],
          });
        }

        const reasons = guildIdDatabase.get(`user_id_${user.id}.reasons`);
        const dates = guildIdDatabase.get(
          `user_id_${user.id}.dataReasonsWarns`
        );
        const autors = guildIdDatabase.get(`user_id_${user.id}.autor`);

        if (reasons.length !== 0) {
          if (warnRemove > reasons.length) {
            return message.channel.send({
              content: `este usuário não possui o aviso ${warnRemove + 1}`,
            });
          }

          const avisoDeleted = reasons[warnRemove];
          const dataDeleted = dates[warnRemove];
          const autorDeleted = autors[warnRemove];
          reasons.splice(warnRemove, 1);
          dates.splice(warnRemove, 1);
          autors.splice(warnRemove, 1);

          guildIdDatabase.delete(`user_id_${user.id}.reasons`);
          guildIdDatabase.set(`user_id_${user.id}.reasons`, reasons);
          guildIdDatabase.delete(`user_id_${user.id}.dataReasonsWarns`);
          guildIdDatabase.set(`user_id_${user.id}.dataReasonsWarns`, dates);
          guildIdDatabase.delete(`user_id_${user.id}.autor`);
          guildIdDatabase.set(`user_id_${user.id}.autor`, autors);

          const channelLog = client.channels.cache.get(
            guildIdDatabase.get('channel_log')
          );
          if (channelLog) {
            channelLog.send({
              content: `${message.author}`,
              embeds: [
                {
                  color: Colors.pink_red,
                  author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL({
                      dynamic: true,
                    }),
                  },
                  thumbnail: client.user.displayAvatarURL({ dynamic: true }),
                  title: `Aviso ${warnRemove + 1} foi removido do usuário`,
                  description: `O usuário ${user.tag} teve um aviso removido! \n
**Punido por**: <@${autorDeleted}>
**Data:** ${parseDateForDiscord(dataDeleted)}
**Motivo:**\n ${avisoDeleted}`,
                  timestamp: new Date(),
                },
              ],
            });
          } else {
            message.channel
              .send({
                content: `${message.author}`,
                embeds: [
                  {
                    color: Colors.pink_red,
                    thumbnail: client.user.displayAvatarURL({ dynamic: true }),
                    author: {
                      name: message.author.tag,
                      icon_url: message.author.displayAvatarURL({
                        dynamic: true,
                      }),
                    },
                    title: `Aviso ${warnRemove + 1} foi removido do usuário`,
                    description: `O usuário ${
                      user.tag
                    } teve um aviso removido! \n
**Punido por**: <@${autorDeleted}>
**Data:** ${parseDateForDiscord(dataDeleted)}
**Motivo** ${avisoDeleted}`,
                    timestamp: new Date(),
                  },
                ],
              })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          }
          return;
        }
      }
      message.channel.send({
        content: `${message.author}`,
        embeds: [
          {
            color: Colors.pink_red,
            thumbnail: user.displayAvatarURL({ dynamic: true }),
            author: {
              name: message.author.tag,
              icon_url: message.author.displayAvatarURL({ dynamic: true }),
            },
            description: `**Para avisar alguém, use o comando:**
> \`\`${prefix}warn @Usuários/TAGs/Nomes/IDs/Citações <motivo>\`\``,
            title: `O Usuário ${user.tag} não possui avisos`,
            timestamp: new Date(),
          },
        ],
      });
    });
  },
};
