const _ = require("lodash");
const { app } = require("../CliApp");

module.exports = {
  command: "repositories",
  aliases: ["repos"],
  describe: "List repositories",
  handler: async () => {
    _(await app.nexus.listRepositories().rows())
      .groupBy("format")
      .forEach((items, format) => {
        console.log(format);
        items.forEach((it) => {
          const extras = it.attributes.proxy
            ? `remoteUrl=${it.attributes.proxy.remoteUrl}`
            : "";
          console.log(`  ${it.name} type=${it.type} ${extras}`);
        });
      });
  },
};
