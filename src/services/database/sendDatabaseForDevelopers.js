import moment from 'moment';

export function sendDatabaseForDevelopers(client) {
  const now = moment();
  const targetTime = moment().set({ hour: 23, minute: 0, second: 0 });

  const developers = process.env.DEVELOPERS?.split(',');
  console.log(developers);
  let timeToNextLog = targetTime.diff(now);

  if (timeToNextLog < 0) {
    timeToNextLog += 1000 * 60 * 60 * 24;
  }

  setTimeout(() => {
    developers.forEach((user) => {
      client.users.cache.get(user).send({ files: ['./json.sqlite'] });
    });

    setInterval(() => {
      developers.forEach((user) => {
        client.users.cache.get(user).send({ files: ['./json.sqlite'] });
      });
    }, 1000 * 60 * 60 * 24);
  }, timeToNextLog);
}
