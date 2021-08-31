import JuryRepository from "../../services/database/Models/JuryRepository.js";
import GroupRepository from "../../services/database/Models/GroupRepository.js";
import { GithubRequests } from "../../services/githubRequests.js";
import { invitedJuryToRepo } from "../../services/embedTemplates/championship.templates.js";

export default {
  name: 'showjury',
  description: 'Vai listar os jurados convidados',
  permissions: [],
  run: async ({ message }) => {
    const juryRepository = new JuryRepository();
    const groupRepository = new GroupRepository();
    const githubRequests = new GithubRequests();
    const jurys = await juryRepository.listAll();
    const groups = await groupRepository.listAll();
    for (const jury of jurys) {
      for (const group of groups) {
        await githubRequests.inviteToRepo(group.repo, jury.github);
      }
      const embed = invitedJuryToRepo(groups, jury)
      await message.channel.send({ embed })
    }
  }
}
