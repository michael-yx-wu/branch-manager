#!/usr/bin/env node
import * as Winston from "winston";
import { BranchManager, IBranchProtectionOptions, LogLevel } from "../branch-manager";
import { getGithubApi, getLogLevel, getMissingOptions, validateOptions } from "../utils";
import { getBranchProtectionOptions, getCaFileContents, getToken } from "../utils/configuration";
import { Parser } from "./parser";

interface ILockOptions {
    branch: RegExp;
    branchProtectionOptions: IBranchProtectionOptions | undefined;
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
    const parser = Parser.defaultOptions().parse(process.argv);

    const { branch, caFile: caFilePath, debug, dryRun, githubApi, repository, token, verbose } = parser;
    const lockOptions = {
        branch,
        branchProtectionOptions: getBranchProtectionOptions(),
        caFileContents: getCaFileContents(caFilePath),
        dryRun,
        githubApi: getGithubApi(githubApi),
        logLevel: getLogLevel(verbose, debug),
        repository,
        token: getToken(token),
    };
    const requiredOptions = [ "branch", "githubApi", "repository", "token" ];
    if (!validateOptions(lockOptions, requiredOptions)) {
        logger.log(LogLevel.ERROR, `Missing options - ${getMissingOptions(lockOptions, requiredOptions)}`);
        process.exit(1);
    }

    // Handle any errors thrown by BranchManager because we cannot use the async await pattern on
    // top level functions such as this one
    process.on("unhandledRejection", (error) => {
        logger.error(error);
        process.exit(1);
    });

    run(lockOptions as ILockOptions);
}

function run(unlockOptions: ILockOptions) {
    const {
        branch,
        branchProtectionOptions,
        caFileContents,
        dryRun,
        githubApi,
        logLevel,
        repository,
        token,
    } = unlockOptions;
    const branchManager = new BranchManager(githubApi, token, logLevel, caFileContents);
    branchManager.lockMatchingBranches(repository, branch, branchProtectionOptions, dryRun)
        .then(({ error }) => {
            if (error !== undefined) {
                throw error;
            }
        });
}

main();
