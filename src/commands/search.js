const { app } = require("../CliApp");

module.exports = {
  command: "search <query...>",
  describe: "List components of a repository",
  handler: (argv) => {
    const query = [];
    const args = {};

    argv.query.forEach((q) => {
      const [key, val = null] = q.split("=");
      if (val === null) {
        query.push(q);
      } else {
        args[key] = val;
      }
    });

    app.nexus
      .search({ ...args, q: query.join(" ") })
      .on("data", (it) =>
        console.log(
          `${it.name} repository=${it.repository} group=${it.group} version=${it.version}`
        )
      );
  },
};
