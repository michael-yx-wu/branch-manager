#!/usr/bin/env node
import * as Winston from "winston";
import { BranchManager, LogLevel } from "../branch-manager";
import { getLogLevel, getMissingOptions, validateOptions } from "../utils";
import { getCaFileContents, getGithubAPI, getToken } from "../utils/configuration";
import { Parser } from "./parser";

interface IUnlockOptions {
    branch: RegExp;
    caFileContents: string | undefined;
    dryRun: boolean;
    githubApi: string;
    logLevel: LogLevel;
    repository: string;
    token: string;
}

function main() {
    const logger = new (Winston.Logger)({
        level: LogLevel.INFO,
        transports: [ new (Winston.transports.Console)() ],
    });

    // commander does not currently enforce required arguments to options or commands (denoted by
    // <arg>), so we have to manually check that required options are specified
    const command = Parser.defaultOptions().parse(process.argv);

    const { branch, caFile: caFilePath, debug, dryRun, githubApi, repository, token, verbose } = command;
    const unlockOptions = {
        branch,
        caFileContents: getCaFileContents(caFilePath),
        dryRun,
        githubApi: getGithubAPI(githubApi),
        logLevel: getLogLevel(verbose, debug),
        repository,
        token: getToken(token),
    };
    const requiredOptions = [ "branch", "githubApi", "repository", "token" ];
    if (!validateOptions(unlockOptions, requiredOptions)) {
        logger.log(LogLevel.ERROR, `Missing options - ${getMissingOptions(unlockOptions, requiredOptions)}`);
        process.exit(1);
    }

    // Handle any errors thrown by BranchManager because we cannot use the async await pattern on
    // top level functions such as this one
    process.on("unhandledRejection", (error) => {
        logger.error(error);
        process.exit(1);
    });

    run(unlockOptions as IUnlockOptions);
}

function run(unlockOptions: IUnlockOptions) {
    const { branch, caFileContents, dryRun, githubApi, logLevel, repository, token } = unlockOptions;
    const branchManager = new BranchManager(githubApi, token, logLevel, caFileContents);
    branchManager.unlockMatchingBranches(repository, branch, dryRun)
        .then(({ error }) => {
            if (error !== undefined) {
                throw error;
            }
        });
}

main();
