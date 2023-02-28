import Discord from 'discord.js';
import { getUserOfCommand } from '../../../utils/commandsFunctions/getUserMention/getUserOfCommand.js';
import { confirmMessage } from '../../../utils/commandsFunctions/confirmMessage/confirmMessage.js';
import { helpWithASpecificCommand } from '../../everyone/commandsCommon/help.command.js';
import Icons from '../../../utils/commandsFunctions/layoutEmbed/iconsMessage.js';
import Colors from '../../../utils/commandsFunctions/layoutEmbed/colors.js';
import { uploadImage } from '../../../services/APIs/uploadImageImgur/uploadImage.js';
import { verifyWarnCountUser } from '../../../utils/verifications/verifyWarnCountUser/verifyWarnCountUser.js';

export default {
  name: 'warn',
  description: `<prefix>warn @Usuários/TAGs/Nomes/IDs/Citações <motivo> para alertar e punir usuários`,
  permissions: ['padawans'],
  aliases: ['addwarn', 'advertencia', 'avisar'],
  category: 'Moderação ⚔️',
  run: async ({ message, client, args, prefix }) => {
    const { users, restOfMessage } = await getUserOfCommand(
      client,
      message,
      prefix
    );

    if (!args[0] && !users) {
      const [command] = message.content.slice(prefix.length).split(/ +/);
      helpWithASpecificCommand(command, client, message);
      return;
    }

    if (users === undefined) {
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
              title: `Não encontrei o usuário!`,
              description: `*Tente usar**\`\`\`${prefix}warn @Usuários/TAGs/Nomes/IDs/Citações <motivo>\`\`\``,
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }

    let reason = `${restOfMessage}` || '<Motivo não especificado>';
    const attachmentsLinks = message.attachments.map((anex) => anex.url);

    if (attachmentsLinks.length > 0) {
      if (attachmentsLinks.length > 3) {
        return message.channel.send({
          content: `${message.author} Você pode enviar no máximo 3 imagens como prova`,
        });
      }
      reason += `\n**Arquivos anexados**: ${attachmentsLinks.join('\n')}`;
    }

    const messageAnt = await message.channel.send({
      embeds: [
        {
          color: Colors.pink_red,
          thumbnail: Icons.warn,
          author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL({ dynamic: true }),
          },
          title: `Você está preste a avisar os Usuários:`,
          description: `**Usuários: ${users.join('|')}**
**Pelo Motivo de: **
${reason}

✅ Para confirmar
❎ Para cancelar
🕵️‍♀️ Para confirmar e não avisa na DM do usuário`,
          timestamp: new Date(),
        },
      ],
    });

    await confirmMessage(message, messageAnt).then(async (res) => {
      await messageAnt.delete();
      if (res) {
        const inviteDm = res !== 'anonimo';
        const guildIdDatabase = new client.Database.table(
          `guild_id_${message.guild.id}`
        );

        const channelLog = client.channels.cache.get(
          guildIdDatabase.get('channel_log')
        );

        users.forEach(async (user) => {
          const memberUser = client.guilds.cache
            .get(message.guild.id)
            .members.cache.get(user.id);
          if (!memberUser) {
            return message.channel.send({
              content:
                'não encontrei o usuário no servidor, talvez ele não esteja entre nós',
            });
          }
          if (user.id === message.guild.me.id) {
            return message.channel
              .send({
                content: `${message.author}`,
                embeds: [
                  {
                    thumbnail: Icons.erro,
                    author: {
                      name: message.author.tag,
                      icon_url: message.author.displayAvatarURL({
                        dynamic: true,
                      }),
                    },
                    color: Colors.pink_red,
                    title: `Hey, você não pode avisar eu mesma, isso não é legal :(`,
                    timestamp: new Date(),
                  },
                ],
              })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          }
          if (
            memberUser.roles.highest.position >=
              message.member.roles.highest.position &&
            !(message.member.id === message.guild.ownerId)
          ) {
            return message.channel
              .send({
                content: `${message.author}`,
                embeds: [
                  {
                    color: Colors.pink_red,
                    thumbnail: Icons.erro,
                    author: {
                      name: message.author.tag,
                      icon_url: message.author.displayAvatarURL({
                        dynamic: true,
                      }),
                    },
                    title: `Você não tem permissão para avisar o usuário`,
                    description: `O usuário ${user} está acima ou no mesmo cargo que você, por isso não podes adicionar um aviso a ele`,
                    timestamp: new Date(),
                  },
                ],
              })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          }
          let reasonOfWarn = `${restOfMessage}` || '<Motivo não especificado>';

          if (attachmentsLinks.length > 0) {
            await uploadImage(message).then((linksImages) => {
              reasonOfWarn += `\n**Arquivos anexados**:\n${linksImages.join(
                '\n'
              )}`;
            });
          }
          function messageSucess() {
            return {
              color: Colors.pink_red,
              thumbnail: Icons.sucess,
              author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
              },
              title: `O usuário ${user.tag} foi avisado!`,
              description: `**Pelo Motivo de: **\n${reasonOfWarn}`,
              footer: {
                text: `ID do usuário avisado: ${user.id}`,
              },
              timestamp: new Date(),
            };
          }
          if (channelLog) {
            channelLog
              .send({ content: `${message.author}`, embeds: [messageSucess()] })
              .catch(() => {
                const buffer = Buffer.from(reason);
                const attachment = new Discord.MessageAttachment(
                  buffer,
                  `ban_of_${user.tag}.txt`
                );
                message.channel.send({
                  content: `${user} O usuário possui um motivo muito grande e por esse motivo enviei um arquivo para você ver todo o motivo`,
                  files: [attachment],
                });
              });
          } else {
            message.channel
              .send({ content: `${message.author}`, embeds: [messageSucess()] })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          }
          if (inviteDm) {
            user
              .send({
                embeds: [
                  {
                    color: Colors.pink_red,
                    thumbnail: message.guild.iconURL(),
                    title: `Você recebeu um warn do servidor **${message.guild}**`,
                    description: `**Descrição: **
${reason}
**Para rever seu caso fale com: ${message.author.tag}**`,
                    footer: { text: `ID do usuário: ${user.id}` },
                    timestamp: new Date(),
                  },
                ],
              })
              .catch(() =>
                message.channel
                  .send({
                    content: `${message.author}`,
                    embeds: [
                      {
                        author: {
                          name: message.author.tag,
                          icon_url: message.author.displayAvatarURL({
                            dynamic: true,
                          }),
                        },
                        thumbnail: user.displayAvatarURL({ dynamic: true }),
                        color: Colors.pink_red,
                        title: `Não foi possível avisar na DM do usuário ${user.tag}!`,
                      },
                    ],
                  })
                  .then((msg) => setTimeout(() => msg.delete(), 15000))
              );
          }

          if (guildIdDatabase.has(`user_id_${user.id}`)) {
            guildIdDatabase.push(`user_id_${user.id}.autor`, message.author.id);
            guildIdDatabase.push(`user_id_${user.id}.reasons`, reasonOfWarn);
            guildIdDatabase.push(
              `user_id_${user.id}.dataReasonsWarns`,
              new Date()
            );
          } else {
            guildIdDatabase.set(`user_id_${user.id}`, {
              id: user.id,
              reasons: [reasonOfWarn],
              autor: [message.author.id],
              dataReasonsWarns: [new Date()],
            });
          }
          verifyWarnCountUser(client, message, user.id);
        });
      }
    });
  },
};
