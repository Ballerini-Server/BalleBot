import { messageWarnAndMute } from './messageWarnAndMute.js';

export function verifyBannedWords(client, message) {
  if (message.channel.type === 'dm') return;

  const guildIdDatabase = new client.Database.table(
    `guild_id_${message.guild.id}`
  );

  const rolesUser = [];

  const server = client.guilds.cache.get(message.guild.id);
  const member = server.members.cache.get(message.author.id);

  member.roles.cache.map((role) => rolesUser.push(role.id));

  if (guildIdDatabase.has('admIds')) {
    const rolesPermissions = guildIdDatabase.get('admIds') || {};
    rolesPermissions.owner = message.guild.ownerId;

    const namesOfRoles = Object.keys(rolesPermissions).reverse();

    const userHasPermission = namesOfRoles.some((nameRole) => {
      if (rolesPermissions[nameRole]) {
        if (
          (rolesUser.indexOf(rolesPermissions[nameRole]) > -1 &&
            nameRole !== 'everyone') ||
          message.author.id === rolesPermissions.owner
        ) {
          return true;
        }
      }
      return false;
    });

    if (!userHasPermission && guildIdDatabase.has('listOfWordsBanned')) {
      const listOfWordsBannedGuild = guildIdDatabase.get('listOfWordsBanned');

      const messageLowerCase =
        message.content.split(' ').length === 1
          ? ` ${message.content.toLowerCase()}`
          : message.content.toLowerCase();

      if (
        listOfWordsBannedGuild.length !== 0 &&
        listOfWordsBannedGuild[0] !== null
      ) {
        const wordsRegex = new RegExp(
          listOfWordsBannedGuild.filter((word) => word).join('|')
        );
        if (wordsRegex.test(messageLowerCase) && wordsRegex !== false) {
          let messageMarked = messageLowerCase.replace(
            wordsRegex,
            '--->$&<---',
            'g'
          );
          const anexo = message.attachments.map((anex) => anex.url);

          if (anexo.length > 0) {
            messageMarked += `\n**Arquivo anexado:** ${anexo}`;
          }
          messageWarnAndMute(message, client, messageMarked);
          return true;
        }
      }
    }
  }
  return false;
}
