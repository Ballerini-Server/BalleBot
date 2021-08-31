import path from 'path';
import { readdirSync } from 'fs';
import { Collection } from 'discord.js';

const commandFolders = ['everyone', 'padawan', 'mods', 'staff'];

function genCommand(folder, returnCollection) {
  const folderPath = path.resolve(
    path.dirname(''),
    'src',
    'commands',
    folder
  );

  const commandFiles = readdirSync(folderPath, { withFileTypes: true }) //.filter((file) => file.endsWith('.js'));
  commandFiles.forEach(async (file) => {
    if (file.isDirectory()) {
      genCommand(path.join(folder, file.name), returnCollection)
      return;
    }
    if (!file.name.endsWith('command.js')) return;
    const name = `./${path.join('.', folder, file.name).replace(/\\/g, '/')}`;

    try {
      const { default: command } = await import(`${name}`);
      if (command.aliases) {
        command.aliases.map((alias) => {
          returnCollection.set(alias.toLowerCase(), command)
        })
      }
      command.name = command.name.toLowerCase()
      returnCollection.set(command.name, command);
    } catch (e) {
      console.log("error:", name, e)
    }
  });
}

const CommandHandler = () => {
  const returnCollection = new Collection();

  if (commandFolders) {
    commandFolders.forEach((folder) => genCommand(folder, returnCollection));
  }

  return returnCollection;
};

export default CommandHandler;
