import GroupRepository from "../../services/database/Models/GroupRepository.js";
import { GithubRequests } from "../../services/githubRequests.js";
import { repoCreatedTemplate } from "../../services/embedTemplates/championship.templates.js";

export default {
  name: 'inviteallgroups',
  description: 'Vai criar todos os repositórios e convidar os lideres para os repositórios.',
  permissions: [],
  run: async ({ message }) => {
    console.log("start")
    const githubRequests = new GithubRequests();
    const groupRepository = new GroupRepository();
    const groups = await groupRepository.listAll();
    console.log("loaded groups", groups.length)
    for (const group of groups) {
      const groupResponse = await githubRequests.tryCreateRepo(group);
      if (groupResponse.group.repo) {
        await groupRepository.updateRepo(groupResponse.group);
      }
      const embed = repoCreatedTemplate(groupResponse)
      await message.channel.send({ embed })
    }
  }
}
