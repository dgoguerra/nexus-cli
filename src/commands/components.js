const { app } = require("../CliApp");

module.exports = {
  command: "components <repository>",
  describe: "List components of a repository",
  handler: async (argv) => {
    app.nexus.listComponents(argv.repository).on("data", (it) => {
      console.log(`${it.name} group=${it.group} version=${it.version}`);
    });
  },
};
