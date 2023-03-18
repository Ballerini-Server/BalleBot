import { verifyBannedWords } from '../../utils/verifications/messageVerify/messageVerifyWords.js';
import { antiSpamAndFlood } from '../../utils/verifications/antiSpamAndFlood/functionSpamAndFlood.js';
import Colors from '../../utils/commandsFunctions/layoutEmbed/colors.js';
import { userHasPermission } from '../../utils/commandsFunctions/userHasPermission/userHasPermission.js';

export default {
  name: 'messageCreate',
  once: false,
  run: (client, message) => {
    if (message.author.bot) return;
    if (message.content === '') return;
    let { PREFIX } = process.env;

    if (message.channel.type !== 'DM') {
      const guildIdDatabase = new client.Database.table(
        `guild_id_${message.guild.id}`
      );
      if (verifyBannedWords(client, message)) return;

      const { userHasPermissionOf } = userHasPermission(client, message);
      if (!message.member.permissions.has('ADMINISTRATOR')) {
        const dic = {
          owner: 4,
          staff: 3,
          mods: 2,
          padawans: 1,
          everyone: 0,
        };
        const positionUser = dic[userHasPermissionOf];

        if (positionUser === 0) {
          const antispam = guildIdDatabase.get('AntiSpam');

          if (antispam) {
            antiSpamAndFlood(client, message);
          }
        }
      }

      if (guildIdDatabase.has(`prefix`)) {
        PREFIX = guildIdDatabase.get(`prefix`);
      }
    }
    if (
      message.mentions.users.first() &&
      message.mentions.users.first().id === message.guild.me.id &&
      (message.content === `<@!${message.guild.me.id}>` ||
        message.content === `<@${message.guild.me.id}>`)
    ) {
      return message.channel.send({
        content: `${message.author}`,
        embeds: [
          {
            color: Colors.pink_red,
            title: `Meu prefixo no servidor é **\`${PREFIX}\`**`,
            footer: {
              text: `${message.author.tag}`,
              icon_url: `${message.author.displayAvatarURL({ dynamic: true })}`,
            },
            timestamp: new Date(),
          },
        ],
      });
    }

    if (!message.content.startsWith(PREFIX)) {
      if (message.channel.type === 'DM') {
        return message.channel.send(
          "Envie tudo começando com o caracter  '=' exemplo: =ping"
        );
      }
      return;
    }
    if (/= /.test(message.content)) return;

    const args = message.content.slice(PREFIX.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    try {
      const commandToBeExecuted = client.Commands.get(commandName);
      if (commandToBeExecuted) {
        const dmTrueOrFalse = commandToBeExecuted.dm;

        if (message.channel.type === 'DM') {
          if (dmTrueOrFalse) {
            return commandToBeExecuted.run({ client, message, args, PREFIX });
          }
          return;
        }

        const { permissionIsTrueOrFalse } = userHasPermission(
          client,
          message,
          commandName,
          false
        );
        const guildIdDatabase = new client.Database.table(
          `guild_id_${message.guild.id}`
        );
        const rolesPermissions = guildIdDatabase.get('admIds') || {};

        if (
          (!permissionIsTrueOrFalse ||
            commandToBeExecuted.name.toLowerCase() !== 'setadm') &&
          !rolesPermissions.staff
        ) {
          return message.channel.send({
            content: `${message.author}`,
            embeds: [
              {
                color: Colors.pink_red,
                thumbnail: client.user.displayAvatarURL({ dynamic: true }),
                title: `${message.author.tag} Olá! Fico muito feliz e agredecida por ter me adicionado!!!!`,
                description: `Primeiramente, nós do servidor Ballerini ficamos honrados por usar nosso bot. Isso é incrível! 🙀 😻
Para começar vamos definir os cargos administrativos:
Eu ofereço 4 cargos de hierarquia, Everyone, Padawan, Moderadores e Staff.
O único que poderá definir os cargos será o dono do servidor ou um administrador real!
Então mande a seguinte mensagem para definir os cargos repectivamente e saiba sobre os comandos com ${PREFIX}help!
${PREFIX}setAdm @cargoPadawan @cargoModeradores @cargoStaff `,
              },
            ],
          });
        }
        if (permissionIsTrueOrFalse) {
          commandToBeExecuted.run({ client, message, args, PREFIX });
        } else {
          message.channel
            .send({
              content: `${message.author}`,
              embeds: [
                {
                  color: Colors.pink_red,
                  title: `Hey, você não tem permissão :(`,
                  description: `**Apenas ${commandToBeExecuted.permissions.join(
                    ' **|** '
                  )} possuem permissão para usar esse comando**`,
                },
              ],
            })
            .then((msg) => setTimeout(() => msg.delete(), 15000));
        }
        message.delete();
      }
    } catch (e) {
      console.error(e);
    }
  },
};
