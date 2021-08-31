import JuryRepository from "../../services/database/Models/JuryRepository.js";
import { registeredGithubUser } from "../../services/embedTemplates/championship.templates.js";
import { GithubRequests } from "../../services/githubRequests.js";

export default {
  name: 'registerjury',
  description: 'Vai registrar um jurado ao campeonado, deve passar o username no github dele como primeiro parâmetro, depois o nome',
  permissions: [],
  run: async ({ message }) => {
    const [_, githubUsername, ...name] = message.content.substr(1).split(' ');
    const githubRequests = new GithubRequests();
    const juryRepository = new JuryRepository();
    const { login } = await githubRequests.findUser(githubUsername);
    await juryRepository.insertOne({ name: name.join(' '), github: login, avatar_url: `https://github.com/${login}.png` });
    const embed = registeredGithubUser({ avatar_url: `https://github.com/${login}.png`, github: login, name: name.join(' ') })
    await message.channel.send({ embed })
  }
}
