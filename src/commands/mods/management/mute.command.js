import Discord from 'discord.js';
import { getUserOfCommand } from '../../../utils/getUserMention/getUserOfCommand.js';
import { confirmMessage } from './confirmMessage.js';
import { helpWithASpecificCommand } from '../../everyone/comandosCommon/help.command.js';
import Icons from '../../../utils/layoutEmbed/iconsMessage.js';
import Colors from '../../../utils/layoutEmbed/colors.js';
import { muteUserInDatabase } from '../../../utils/createRoleMuted/roleMutedUserInDatabase.js';

export default {
  name: 'mute',
  description: `<prefix>mute @Usuários/TAGs/Nomes/IDs/Citações <motivo> <tempo/2d 5h 30m 12s> para mutar usuários`,
  permissions: ['mods'],
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

    if (!message.guild.me.hasPermission('MANAGE_ROLES')) {
      message.channel
        .send(
          message.author,
          new Discord.MessageEmbed()
            .setColor(Colors.pink_red)
            .setThumbnail(Icons.erro)
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setDescription(
              `Ative a permissão de manusear cargos para mim, para que você possa usar o comando mute`
            )
            .setTitle(`Eu não tenho permissão para mutar usuários`)
            .setFooter(
              `A permissão pode ser ativada no cargo do bot em configurações`
            )
            .setTimestamp()
        )
        .then((msg) => msg.delete({ timeout: 15000 }));
      return;
    }

    if (
      !client.guilds.cache
        .get(message.guild.id)
        .members.cache.get(message.author.id)
        .hasPermission('MANAGE_ROLES')
    ) {
      message.channel
        .send(
          message.author,
          new Discord.MessageEmbed()
            .setColor(Colors.pink_red)
            .setThumbnail(Icons.erro)
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setDescription(
              `Peça a um administrador ver o seu caso, você precisa de permissão para manusear cargos`
            )
            .setTitle(`Você não tem permissão para mutar usuários`)
            .setFooter(
              `A permissão pode ser ativada no seu cargo em configurações`
            )
            .setTimestamp()
        )
        .then((msg) => msg.delete({ timeout: 15000 }));
      return;
    }

    if (users === undefined) {
      message.channel
        .send(
          message.author,
          new Discord.MessageEmbed()
            .setColor(Colors.pink_red)
            .setThumbnail(Icons.erro)
            .setAuthor(
              message.author.tag,
              message.author.displayAvatarURL({ dynamic: true })
            )
            .setTitle(`Não encontrei o usuário!`)
            .setDescription(
              `**Tente usar**\n\`\`${prefix}mute @Usuários/TAGs/Nomes/IDs/Citações <motivo> <tempo/2d 5h 30m 12s>\`\``
            )
            .setTimestamp()
        )
        .then((msg) => msg.delete({ timeout: 15000 }));
      return;
    }
    const textMessage = restOfMessage || '<Motivo não especificado>';
    const timeValidation = /(\d+d)|(\d+h)|(\d+m)|(\d+s)/gi;
    const reasonMuted =
      `${textMessage.replace(timeValidation, '').trim()}` || '<invalido>';

    const messageAnt = await message.channel.send(
      new Discord.MessageEmbed()
        .setColor(Colors.red)
        .setThumbnail(Icons.mute)
        .setAuthor(
          message.author.tag,
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setTitle(`Você está prestes a Mutar os usuários:`)
        .setDescription(
          `**Usuários: ${users.join('|')}**
**Pelo Motivo de: **
${reasonMuted}

✅ Para confirmar
❎ Para cancelar
🕵️‍♀️ Para confirmar e não avisar que foi você que aplicou`
        )
        .setTimestamp()
    );

    await confirmMessage(message, messageAnt).then(async (res) => {
      await messageAnt.delete();

      if (res) {
        users.forEach(async (user) => {
          const memberUser = client.guilds.cache
            .get(message.guild.id)
            .members.cache.get(user.id);

          if (user.id === message.guild.me.id) {
            message.channel
              .send(
                message.author,
                new Discord.MessageEmbed()
                  .setThumbnail(Icons.erro)
                  .setColor(Colors.pink_red)
                  .setAuthor(
                    message.author.tag,
                    message.author.displayAvatarURL({ dynamic: true })
                  )
                  .setTitle(`Hey, você não pode me mutar e isso não é legal :(`)
                  .setTimestamp()
              )
              .then((msg) => msg.delete({ timeout: 15000 }));
            return;
          }
          if (
            memberUser.roles.highest.position >=
            message.guild.me.roles.highest.position
          ) {
            message.channel
              .send(
                message.author,
                new Discord.MessageEmbed()
                  .setColor(Colors.pink_red)
                  .setThumbnail(Icons.erro)
                  .setAuthor(
                    message.author.tag,
                    message.author.displayAvatarURL({ dynamic: true })
                  )
                  .setTitle(
                    `Eu não tenho permissão para mutar o usuário ${user.tag}`
                  )
                  .setDescription(
                    `O usuário ${user} tem um cargo acima ou igual a mim, eleve meu cargo acima do dele`
                  )
                  .setTimestamp()
              )
              .then((msg) => msg.delete({ timeout: 15000 }));
            return;
          }
          if (memberUser.hasPermission('ADMINISTRATOR')) {
            message.channel
              .send(
                message.author,
                new Discord.MessageEmbed()
                  .setColor(Colors.pink_red)
                  .setThumbnail(Icons.erro)
                  .setAuthor(
                    message.author.tag,
                    message.author.displayAvatarURL({ dynamic: true })
                  )
                  .setTitle(`O usuário ${user.tag} é administrador`)
                  .setDescription(
                    `O usuário ${user} tem um cargo de administrador, o comando mute não funcionará com ele`
                  )
                  .setTimestamp()
              )
              .then((msg) => msg.delete({ timeout: 15000 }));
            return;
          }

          if (
            memberUser.roles.highest.position >=
            message.member.roles.highest.position
          ) {
            message.channel
              .send(
                message.author,
                new Discord.MessageEmbed()
                  .setColor(Colors.pink_red)
                  .setThumbnail(Icons.erro)
                  .setAuthor(
                    message.author.tag,
                    message.author.displayAvatarURL({ dynamic: true })
                  )
                  .setTitle(`Você não tem permissão para mutar o usuário`)
                  .setDescription(
                    `O usuário ${user} está acima ou no mesmo cargo que você, peça a um administrador elevar seu cargo`
                  )
                  .setTimestamp()
              )
              .then((msg) => msg.delete({ timeout: 15000 }));
          } else {
            const { userReasonFullMuted, inviteMessageDate } =
              await muteUserInDatabase(client, message, restOfMessage, user);

            message.channel.send(
              message.author,
              new Discord.MessageEmbed()
                .setColor(Colors.pink_red)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setAuthor(
                  message.author.tag,
                  message.author.displayAvatarURL({ dynamic: true })
                )
                .setTitle(`Usuário mutado com sucesso: ${user.tag}`)
                .setDescription(
                  `**Data final do Mute: ${inviteMessageDate}**
**Descrição:**
${userReasonFullMuted.reason}`
                )
                .setFooter(`ID do usuário: ${userReasonFullMuted.id}`)
                .setTimestamp()
            );
            const inviteDmAutor =
              res === 'anonimo' ? 'a administração' : message.author;
            user
              .send(
                new Discord.MessageEmbed()
                  .setColor(Colors.pink_red)
                  .setThumbnail(message.guild.iconURL())
                  .setTitle(
                    `Você foi mutado no servidor ** ${message.guild.name}** `
                  )
                  .setDescription(
                    `**Data final do Mute: ${inviteMessageDate}**
**Motivo:**
${reasonMuted}
Caso ache que o mute foi injusto, **fale com ${inviteDmAutor}**`
                  )
                  .setFooter(`ID do usuário: ${user.id}`)
                  .setTimestamp()
              )
              .catch(() =>
                message.channel
                  .send(
                    message.author,
                    new Discord.MessageEmbed()
                      .setColor(Colors.pink_red)
                      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                      .setAuthor(
                        message.author.tag,
                        message.author.displayAvatarURL({ dynamic: true })
                      )
                      .setTitle(
                        `Não foi possível avisar na DM do usuário mutado ${user.tag}!`
                      )
                      .setFooter(`ID do usuário: ${user.id}`)
                      .setTimestamp()
                  )
                  .then((msg) => msg.delete({ timeout: 15000 }))
              );
          }
        });
      }
    });
  },
};
