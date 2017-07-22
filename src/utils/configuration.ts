import * as fs from "fs";
import * as path from "path";
import { Configurer } from "../configurer/configurer";

/**
 * Returns the branch protection options.
 *
 * @internal
 * @returns {IBranchProtectionOptions | undefined}
 */
export function getBranchProtectionOptions() {
    return Configurer.loadMergedConfiguration().getBranchProtectionOptions();
}

/**
 * Returns `caFilePath` as an absolute path.
 *
 * @internal
 * @param {string} [caFilePath] A (possibly relative) path to a CA file.
 * @returns {string | undefined}
 */
export function getCaFileContents(caFilePath?: string) {
    if (caFilePath != null) {
        return fs.readFileSync(path.resolve(caFilePath), "utf-8");
    }
    return Configurer.loadMergedConfiguration().getCaFileContents();
}

/**
 * Returns `githubAPI` if it is not null or undefined. Otherwise returns the `githubAPI` from a
 * `bmconfig.json` or the public Github API URI if that is also null.
 *
 * @internal
 * @param {string} [githubAPI] The Github API
 * @returns {string}
 */
export function getGithubAPI(githubAPI?: string) {
    if (githubAPI != null) {
        return githubAPI;
    }
    const configuredGithubAPI = Configurer.loadMergedConfiguration().getGithubAPI();
    if (configuredGithubAPI !== undefined) {
        return configuredGithubAPI;
    }
    return "https://api.github.com";
}

/**
 * Returns `token` if it is not null or undefined. Otherwise returns the value of the token in the
 * configuration.
 *
 * @internal
 * @param {string} [token] The Github API token to use. This parameter takes precedence over tokens
 * found in local or global configs.
 * @return {string}
 */
export function getToken(token?: string) {
    if (token != null) {
        return token;
    }
    const configToken = Configurer.loadMergedConfiguration().getToken();
    if (configToken !== undefined) {
        return configToken;
    }
}
