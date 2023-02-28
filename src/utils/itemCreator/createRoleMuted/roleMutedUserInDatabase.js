import { roleMuted } from './roleMuted.js';
import { parseDateForDiscord } from '../../commandsFunctions/TimeMessageConversor/parseDateForDiscord.js';

export async function muteUserInDatabase(client, event, reason, userMutated) {
  const user = userMutated || event.user;
  const guildIdDatabase = new client.Database.table(
    `guild_id_${event.guild.id}`
  );

  const textMessage = reason || '<Motivo não especificado>';
  const timeValidation = /(\d+d)|(\d+h)|(\d+m)|(\d+s)/gi;
  const timeArray = textMessage.match(timeValidation);
  const reasonMuted =
    `${textMessage.trim().replace(timeValidation, '')}` ||
    '<Motivo não especificado>';

  let timeInMiliSeconds = 0;

  let dateForDatabase = 'indefinido';
  if (timeArray) {
    const stringOfTime = {
      d: 1000 * 60 * 60 * 24,
      h: 1000 * 60 * 60,
      m: 1000 * 60,
      s: 1000,
    };

    timeArray.forEach((element) => {
      timeInMiliSeconds +=
        stringOfTime[element.slice(-1)] * element.slice(0, -1);
    });

    dateForDatabase = new Date().setMilliseconds(
      new Date().getMilliseconds() + timeInMiliSeconds
    );
  }

  const muterole = await roleMuted(event, 'MutedBallebot');
  guildIdDatabase.set('roleMutedId', muterole.id);

  const tableTemporarilyMutated = new client.Database.table(
    `tableTemporarilyMutated`
  );
  const userReasonFullMuted = {
    id: user.id,
    dateMuted: new Date(dateForDatabase),
    guildId: event.guild.id,
    roleId: muterole.id,
    reason: `Punido por ${event.author.tag || client.user.tag} | ${
      event.author.id || client.user.id
    }\n— Motivo: ${reasonMuted}`,
  };

  const guildUndefinedMutated = new client.Database.table(
    `guild_users_mutated_${event.guild.id}`
  );

  if (guildUndefinedMutated.has(`user_id_${user.id}`)) {
    guildUndefinedMutated.delete(`user_id_${user.id}`);
  } else if (
    tableTemporarilyMutated.has(`guild_id_${event.guild.id}_user_id_${user.id}`)
  ) {
    tableTemporarilyMutated.delete(
      `guild_id_${event.guild.id}_user_id_${user.id}`
    );
  }

  if (dateForDatabase === 'indefinido') {
    guildUndefinedMutated.set(`user_id_${user.id}`, userReasonFullMuted);
  } else {
    tableTemporarilyMutated.set(
      `guild_id_${event.guild.id}_user_id_${user.id}`,
      userReasonFullMuted
    );
  }
  const userMember = client.guilds.cache
    .get(event.guild.id)
    .members.cache.get(user.id);

  await userMember.roles.add(muterole.id);
  const inviteMessageDate =
    dateForDatabase !== 'indefinido'
      ? parseDateForDiscord(dateForDatabase)
      : '`indefinido`';
  return { userReasonFullMuted, inviteMessageDate, muterole };
}
