const { app } = require("../CliApp");

module.exports = {
  command: "component <repository> <name>",
  describe: "List component versions",
  handler: (argv) => {
    app.nexus
      .search({ repository: argv.repository, name: argv.name })
      ._transform(sortByVersion())
      .on("data", (it) => {
        console.log(`${it.name} group=${it.group} version=${it.version}`);
      });
  },
};
