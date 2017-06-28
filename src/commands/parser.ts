import * as Program from "commander";

/** @internal */
export class Parser {
    /**
     * Returns the default options.
     *
     * @returns {Command}
     */
    public static defaultOptions() {
        return Program
            .usage("[options]")
            .option("-r, --repository <repository>", "Full name of the repository")
            .option("-b, --branch <branch-regex>", "Regular expression", parseBranch)
            .option("-g, --github-api [url]", "Default is 'https://api.github.com'")
            .option("-t, --token [token]", "Github API token. Uses contents of .bmtoken by default")
            .option("--ca-file [ca-file-path]", "Path to CA file")
            .option("-m, --dry-run", "See what branches would be affected")
            .option("-v, --verbose", "Show verbose output")
            .option("--debug", "Show debug output")
            .allowUnknownOption(false);
    }
}

/**
 * Return `branchRegexString` as a case insensitive `RegExp`.
 *
 * @param branchRegexString The string to convert into a `RegExp`
 * @returns {RegExp}
 */
function parseBranch(branchRegexString: string) {
    return new RegExp(branchRegexString, "i");
}
