#!/usr/bin/env node
import Program  = require("commander");

Program
    .version("0.1.0")
    .usage("COMMAND")
    .command("lock", "Lock branches")
    .command("unlock", "Unlock branches")
    .allowUnknownOption(false)
    .parse(process.argv);
