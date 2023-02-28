import { getUserOfCommand } from '../../../utils/commandsFunctions/getUserMention/getUserOfCommand.js';
import { confirmMessage } from '../../../utils/commandsFunctions/confirmMessage/confirmMessage.js';
import { helpWithASpecificCommand } from '../../everyone/commandsCommon/help.command.js';
import Icons from '../../../utils/commandsFunctions/layoutEmbed/iconsMessage.js';
import Colors from '../../../utils/commandsFunctions/layoutEmbed/colors.js';
import { muteUserInDatabase } from '../../../utils/itemCreator/createRoleMuted/roleMutedUserInDatabase.js';
import { createChannelRevision } from '../../../utils/itemCreator/createChannelRevision/createChannelRevision.js';
import { uploadImage } from '../../../services/APIs/uploadImageImgur/uploadImage.js';

export default {
  name: 'mute',
  description: `<prefix>mute @Usuários/TAGs/Nomes/IDs/Citações <motivo> <tempo/2d 5h 30m 12s> para mutar usuários`,
  permissions: ['padawans'],
  aliases: ['mutar', 'silenciar'],
  category: 'Moderação ⚔️',
  dm: false,
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

    if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
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
              description: `Ative a permissão de manusear cargos para mim, para que você possa usar o comando mute`,
              title: `Eu não tenho permissão para mutar usuários`,
              footer: {
                text: `A permissão pode ser ativada no cargo do bot em configurações`,
              },
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }

    if (
      !client.guilds.cache
        .get(message.guild.id)
        .members.cache.get(message.author.id)
        .permissions.has('MANAGE_ROLES')
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
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
              },
              description: `Peça a um administrador ver o seu caso, você precisa de permissão para manusear cargos`,
              title: `Você não tem permissão para mutar usuários`,
              footer: {
                text: `A permissão pode ser ativada no seu cargo em configurações`,
              },
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }

    if (users === undefined) {
      return message.channel
        .send({
          contet: `${message.author}`,
          embeds: [
            {
              color: Colors.pink_red,
              thumbnail: Icons.erro,
              author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
              },
              title: `Não encontrei o usuário!`,
              description: `**Tente usar**\n\`\`${prefix}mute @Usuários/TAGs/Nomes/IDs/Citações <motivo> <tempo/2d 5h 30m 12s>\`\``,
              timestamp: new Date(),
            },
          ],
        })
        .then((msg) => setTimeout(() => msg.delete(), 15000));
    }
    const textMessage = restOfMessage || '<Motivo não especificado>';
    const timeValidation = /(\d+d)|(\d+h)|(\d+m)|(\d+s)/gi;
    let reasonMuted =
      `${textMessage.replace(timeValidation, '').trim()}` ||
      '<Motivo não especificado>';

    const attachmentsLinks = message.attachments.map((anex) => anex.url);

    if (attachmentsLinks.length > 0) {
      if (attachmentsLinks.length > 3) {
        return message.channel.send({
          content: `${message.author} Você pode enviar no máximo 3 imagens como prova`,
        });
      }
      reasonMuted += `\n**Arquivos anexados**: ${attachmentsLinks.join('\n')}`;
    }

    const messageAnt = await message.channel.send({
      embeds: [
        {
          color: Colors.red,
          thumbnail: Icons.mute,
          author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL({ dynamic: true }),
          },
          title: `Você está prestes a Mutar os usuários:`,
          description: `**Usuários: ${users.join('|')}**
**Pelo Motivo de: **
${reasonMuted}

✅ Para confirmar
❎ Para cancelar
🕵️‍♀️ Para confirmar e não avisar que foi você que aplicou`,
          timestamp: new Date(),
        },
      ],
    });

    await confirmMessage(message, messageAnt).then(async (res) => {
      await messageAnt.delete();

      if (res) {
        users.forEach(async (user) => {
          const memberUser = client.guilds.cache
            .get(message.guild.id)
            .members.cache.get(user.id);

          if (user.id === message.guild.me.id) {
            return message.channel
              .send({
                content: `${message.author}`,
                embeds: [
                  {
                    thumbnail: Icons.erro,
                    color: Colors.pink_red,
                    author: {
                      name: message.author.tag,
                      icon_url: message.author.displayAvatarURL({
                        dynamic: true,
                      }),
                    },
                    title: `Hey, você não pode me mutar e isso não é legal :(`,
                    timestamp: new Date(),
                  },
                ],
              })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          }
          if (
            memberUser.roles.highest.position >=
            message.guild.me.roles.highest.position
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
                    title: `Eu não tenho permissão para mutar o usuário ${user.tag}`,
                    description: `O usuário ${user} tem um cargo acima ou igual a mim, eleve meu cargo acima do dele`,
                    timestamp: new Date(),
                  },
                ],
              })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          }
          if (memberUser.permissions.has('ADMINISTRATOR')) {
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
                    title: `O usuário ${user.tag} é administrador`,
                    description: `O usuário ${user} tem um cargo de administrador, o comando mute não funcionará com ele`,
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
            message.channel
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
                    title: `Você não tem permissão para mutar o usuário`,
                    description: `O usuário ${user} está acima ou no mesmo cargo que você, peça a um administrador elevar seu cargo`,
                    timestamp: new Date(),
                  },
                ],
              })
              .then((msg) => setTimeout(() => msg.delete(), 15000));
          } else {
            let messageReasonMuted =
              restOfMessage || '<Motivo não especificado>';
            if (attachmentsLinks.length > 0) {
              await uploadImage(message).then((linksImages) => {
                messageReasonMuted += `\n**Arquivos anexados**:\n${linksImages.join(
                  '\n'
                )}`;
              });
            }

            const { userReasonFullMuted, inviteMessageDate, muterole } =
              await muteUserInDatabase(
                client,
                message,
                messageReasonMuted,
                user
              );
            createChannelRevision(message, muterole);
            const description = userReasonFullMuted.reason.replace(
              /((Punido por )(.*)\n)|(— Motivo: )/g,
              ''
            );
            message.channel.send({
              content: `${message.author}`,
              embeds: [
                {
                  color: Colors.pink_red,
                  thumbnail: user.displayAvatarURL({ dynamic: true }),
                  author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL({
                      dynamic: true,
                    }),
                  },
                  title: `Usuário mutado com sucesso: ${user.tag}`,
                  description: `**Data final do Mute: ${inviteMessageDate}**
**Punido por:** ${message.author}
**Descrição**: ${description}`,
                  footer: { text: `ID do usuário: ${userReasonFullMuted.id}` },
                  timestamp: new Date(),
                },
              ],
            });
            const inviteDmAutor =
              res === 'anonimo' ? 'a administração' : message.author;
            user
              .send({
                embeds: [
                  {
                    color: Colors.pink_red,
                    thumbnail: message.guild.iconURL(),
                    title: `Você foi mutado no servidor ** ${message.guild.name}** `,
                    description: `**Data final do Mute: ${inviteMessageDate}**
**Motivo:**
${reasonMuted}
Caso ache que o mute foi injusto, **fale com ${inviteDmAutor.tag}**`,
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
                        color: Colors.pink_red,
                        thumbnail: user.displayAvatarURL({ dynamic: true }),
                        author: {
                          name: message.author.tag,
                          icon_url: message.author.displayAvatarURL({
                            dynamic: true,
                          }),
                        },
                        title: `Não foi possível avisar na DM do usuário mutado ${user.tag}!`,
                        footer: { text: `ID do usuário: ${user.id}` },
                        timestamp: new Date(),
                      },
                    ],
                  })
                  .then((msg) => setTimeout(() => msg.delete(), 15000))
              );
          }
        });
      }
    });
  },
};
