import { IBranch, LogLevel } from "./branch-manager";

/**
 * Returns `branches` as a comma-separated string.
 *
 * @internal
 * @param branches A list of `IBranch`.
 * @returns {string}
 */
export function branchesToString(branches: IBranch[]) {
    if (branches.length === 0) {
        return "";
    }
    return branches
        .map((branch) => branch.name)
        .reduce((prev, curr) => prev + ", " + curr);
}

/**
 * Return the default Github API URI if `githubApi` is undefined.
 *
 * @internal
 * @param {string} [githubApi] The custom Github API URI to use
 * @return {string}
 */
export function getGithubApi(githubApi?: string) {
    return githubApi !== undefined ? githubApi : "https://api.github.com";
}

/**
 * Return the appropriate log level depending on the value of `verbose` or `debug`. The default
 * logging level is info.
 *
 * @internal
 * @param {boolean} verbose Whether to show verbose logging. Ignored if `debug` is true.
 * @param {boolean} debug Whether to show debug logging.
 * @return {LogLevel}
 */
export function getLogLevel(verbose: boolean, debug: boolean) {
    if (debug) {
        return LogLevel.DEBUG;
    }
    if (verbose) {
        return LogLevel.VERBOSE;
    }
    return LogLevel.INFO;
}

/**
 * Check that `options` has all of the fields in `requiredOptions`.
 *
 * @internal
 * @param options An options oject
 * @param requiredOptions A list of required fields on `options`.
 * @returns {boolean}
 */
export function validateOptions(options: any, requiredOptions: string[]) {
    return requiredOptions.every((option) => options[option] !== undefined);
}

/**
 * Return a list of options from `requiredOptions` that are missing as fields on `options`.
 *
 * @internal
 * @param options An options object
 * @param requiredOptions A list of required fields on `options`.
 * @returns {string}
 */
export function getMissingOptions(options: any, requiredOptions: string[]) {
    return requiredOptions
        .filter((option) => options[option] === undefined)
        .reduce((prev, curr) => prev + ", " + curr);
}
