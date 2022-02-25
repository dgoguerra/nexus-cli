#!/usr/bin/env node

const { app } = require("./CliApp");

app.runYargs();

// When piping the process output to another process, we may receive SIGPIPE
// to terminate early. For example, piping to "head".
process.on("SIGPIPE", () => process.exit(0));
