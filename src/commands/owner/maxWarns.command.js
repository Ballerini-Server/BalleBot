import Discord from 'discord.js';
import { helpWithASpecificCommand } from '../everyone/comandosCommon/help.command.js';
import Colors from '../../utils/layoutEmbed/colors.js';

export default {
  name: 'maxWarns',
  description: `comando setar uma quantidade de warn para banir um usuário do seu servidor, para isso use <prefix>setCountWarns <quantidade/2/3>`,
  permissions: ['owner'],
  aliases: ['setCountWarns', 'setWarnsCount', 'setCountWarnsToBan'],
  category: 'Owner 🗡️',
  run: ({ message, client, args, prefix }) => {
    function isNumber(n) {
      return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
    }

    if (!args[0] || !isNumber(args[0])) {
      const [command] = message.content.slice(prefix.length).split(/ +/);
      helpWithASpecificCommand(command, client, message);
      return;
    }

    const guildIdDatabase = new client.Database.table(
      `guild_id_${message.guild.id}`
    );

    guildIdDatabase.set('maxWarns', args[0]);
    message.channel.send(
      message.author,
      new Discord.MessageEmbed()
        .setColor(Colors.pink_red)
        .setTitle(
          `Quantidade máxima de warns salva no servidor : **\`${args[0]}\`**`
        )
        .setFooter(
          `${message.author.tag}`,
          `${message.author.displayAvatarURL({ dynamic: true })}`
        )
        .setTimestamp()
    );
  },
};
