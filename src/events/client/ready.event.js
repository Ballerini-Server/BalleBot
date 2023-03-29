import { statusActivity } from '../../assets/statusActivity.js';
import { setIntervalRemoveMute } from '../../services/setTimeoutMute/setTimeOutMute.js';
import { sendDatabaseForDevelopers } from '../../services/database/sendDatabaseForDevelopers.js';

export default {
  name: 'ready',
  once: false,
  run: (client) => {
    setInterval(async () => {
      setIntervalRemoveMute(client);
    }, 1000);

    sendDatabaseForDevelopers(client);

    statusActivity(client);
    console.log(`Logged as ${client.user.tag}`);
  },
};
