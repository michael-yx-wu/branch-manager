import * as Request from "request-promise-native";
import * as Winston from "winston";
import { branchesToString } from "../utils";
import { Info } from "./loggingMessages";
import {
    IBranch,
    IBranchManagerLockResponse,
    IBranchManagerUnlockResponse,
    IBranchProtectionOptions,
    LogLevel,
} from "./types";

/**
 * An object that makes locking and unlocking Github branches easier. It also supports dry runs if
 * you need to validate the branches that would be affected.
 */
export class BranchManager {
    private githubApiUrl: string;
    private token: string;
    private caFile: string | undefined;
    private logger: Winston.LoggerInstance;
    private defaultBranchProtectionOptions: IBranchProtectionOptions;

    /**
     * Create a new branch manager.
     *
     * @param {string} githubApiUrl The Github API url.
     * @param {string} token The Github personal access token. This token must at least have read access to
     * your repositories.
     * @param {LogLevel} [logLevel=LogLevel.ERROR] The log level.
     * @param {string} caFile The contents of a certificate authority file. Set this option if you are behind
     * a corporate firewall.
     */
    constructor(githubApiUrl: string, token: string, logLevel = LogLevel.ERROR, caFile?: string) {
        this.githubApiUrl = githubApiUrl.endsWith("/")
            ? githubApiUrl.substr(0, githubApiUrl.length - 1)
            : githubApiUrl;
        this.token = token;
        this.caFile = caFile;
        this.logger = new (Winston.Logger)({
            level: logLevel,
            transports: [ new (Winston.transports.Console)() ],
        });
        this.defaultBranchProtectionOptions = {
            enforce_admins: false,
            required_pull_request_reviews: null,
            required_status_checks: null,
            restrictions: null,
        };
    }

    /**
     * Locks matching branches and returns a list of branches that were unlocked. If `dryRun` is
     * true, does not lock any branches and returns a list of branches that would be locked.
     *
     * The Github API does not have a bulk lock endpoint so a separate request is sent for each
     * branch that matches the `branchRegex`. If an error occurs, the returned object will contain
     * the error as well as a list of branches that were successfully locked. You can use this info
     * to revert changes if necessary.
     *
     * @param {string} repository The full name of the repository e.g. username/repo
     * @param {RegExp} branchRegex The regular expression used to match on branch names.
     * @param {IBranchProtectionOptions} [branchProtectionOptions]
     * Branch protection options to apply. Defaults to no additional protections beyond basic branch
     * protection.
     * @param {boolean} [dryRun=false] Whether to execute a dry run.
     * @returns {Promise<IBranchManagerLockResponse>}
     */
    public async lockMatchingBranches(
        repository: string,
        branchRegex: RegExp,
        branchProtectionOptions?: IBranchProtectionOptions,
        dryRun = false,
    ): Promise<IBranchManagerLockResponse> {

        const lockedBranches: IBranch[] = [];
        try {
            const branches = await this.getMatchingBranches(repository, branchRegex);
            if (branches.length === 0) {
                this.logger.info(Info.noMatchingBranches);
                return { lockedBranches };
            }
            if (dryRun) {
                this.logger.info(Info.dryRun, () => this.logger.info(branchesToString(branches)));
                return { lockedBranches: branches };
            }
            this.logger.info(Info.lockAttempt, () => this.logger.info(branchesToString(branches)));

            // Github does not have a bulk lock API so we have to make individual unlock requests
            for (const branch of branches) {
                await this.lockBranch(repository, branch, branchProtectionOptions);
                lockedBranches.push(branch);
            }
            this.logger.info(Info.lockSuccess, () => this.logger.info(branchesToString(lockedBranches)));
            return { lockedBranches };
        } catch (error) {
            return { error, lockedBranches };
        }
    }

    /**
     * Unlocks matching branches and returns a list of branches that were unlocked. If `dryRun` is
     * true, does not unlock any branches and returns a list of branches that would be unlocked.
     *
     * The Github API does not have a bulk unlock endpoint so a separate request is sent for each
     * branch that matches the `branchRegex`. If an error occurs, the returned object will contain
     * the error as well as a list of branches that were successfully unlocked. You can use this
     * info to revert changes if necessary.
     *
     * @param {string} repository The full name of the repository e.g. username/repo
     * @param {RegExp} branchRegex The regular expression used to match on branch names.
     * @param {boolean} [dryRun=false] Whether to execute a dry run.
     * @returns {Promise<IBranchManagerUnlockResponse>}
     */
    public async unlockMatchingBranches(
        repository: string,
        branchRegex: RegExp,
        dryRun = false,
    ): Promise<IBranchManagerUnlockResponse> {

        const unlockedBranches: IBranch[] = [];
        try {
            const branches = await this.getMatchingBranches(repository, branchRegex, true);
            if (branches.length === 0) {
                this.logger.info(Info.noMatchingBranches);
                return { unlockedBranches };
            }
            if (dryRun) {
                this.logger.info(Info.dryRun, () => this.logger.info(branchesToString(branches)));
                return { unlockedBranches: branches };
            }
            this.logger.info(Info.unlockAttempt, () => this.logger.info(branchesToString(branches)));

            // Github does not have a bulk unlock API so we have to make individual unlock requests
            for (const branch of branches) {
                await this.unlockBranch(repository, branch);
                unlockedBranches.push(branch);
            }
            this.logger.info(Info.unlockSuccess, () => this.logger.info(branchesToString(unlockedBranches)));
            return { unlockedBranches };
        } catch (error) {
            return { error, unlockedBranches };
        }
    }

    /**
     * Get branches in `repository` whose names match `branchRegex`.
     *
     * @param {string} repository The full name of the repository e.g. username/repo
     * @param {string} branchRegex The regular expression used to match on branch names.
     * @param {boolean} [protected=false] Whether to limit matches to protected branches.
     */
    private async getMatchingBranches(repository: string, branchRegex: RegExp, protectedBranchesOnly = false) {
        this.logger.verbose(`Fetching branches in ${repository} that match the pattern ${branchRegex}`);
        let uri: string | undefined = `${this.githubApiUrl}/repos/${repository}/branches`;
        if (protectedBranchesOnly) {
            uri = uri.concat("?protected=true");
        }
        const requestOptions = this.getDefaultRequestOptions(uri);
        let branches: IBranch[] = [];
        do {
            this.logger.debug(`GET ${uri}`);
            try {
                const response: Request.FullResponse = await Request.get(requestOptions);
                this.logger.debug(response.body);
                branches = branches.concat(response.body as IBranch[]);
                const maybeLinkHeader = response.headers.link;
                if (maybeLinkHeader === undefined) {
                    this.logger.debug(`No link header`);
                    break;
                }
                this.logger.debug(`Got link header: ${maybeLinkHeader}`);
                uri = this.getNextLink(maybeLinkHeader as string);
            } catch (error) {
                throw error;
            }
        } while (uri !== undefined);
        return branches.filter((branch) => branch.name.match(branchRegex));
    }

    /**
     * Parses the `Link` header and returns the url of the `next` link or undefined if it's not
     * found.
     *
     * @param {string} linkHeader The value of the `Link` header
     */
    private getNextLink(linkHeader: string) {
        this.logger.verbose("Parsing link header");
        const links: Map<string, string> = new Map<string, string>();
        linkHeader.split(",").forEach((urlAndLabel) => {
            const section = urlAndLabel.split(";");
            if (section.length !== 2) {
                this.logger.error(`Could not parse link and label from ${urlAndLabel}`);
                return;
            }
            const labelResult = section[1].match(/rel="(.*)"/);
            const urlResult = section[0].match(/<(.*)>/);
            if (labelResult == null || urlResult == null) {
                this.logger.error(`Could not get url or label from ${urlAndLabel}`);
                return;
            }
            links.set(labelResult[1], urlResult[1]);
        });
        return links.get("next");
    }

    /**
     * Lock `branch` in `repository`.
     *
     * @param {string} repository The full name of th erepository e.g. username/repo.
     * @param {string} branch The branch to unlock.
     * @param {IBranchProtectionOptions} [branchProtectionOptions]
     * Branch protection options to apply. Defaults to no additional protections beyond basic branch
     * protection.
     */
    private async lockBranch(repository: string, branch: IBranch, branchProtectionOptions?: IBranchProtectionOptions) {
        this.logger.verbose(`Locking branch '${branch.name} in '${repository}'`);
        const uri = `${this.githubApiUrl}/repos/${repository}/branches/${branch.name}/protection`;
        const requestOptions = this.getDefaultRequestOptions(uri);
        requestOptions.body = branchProtectionOptions !== undefined
            ? branchProtectionOptions
            : this.defaultBranchProtectionOptions;
        this.logger.debug(`PUT ${uri}`);
        try {
            const response: Request.FullResponse = await Request.put(requestOptions);
            this.logger.debug(response.body);
            this.logger.verbose(`Locked branch ${branch} in ${repository}`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Unlock `branch` in `repository`.
     *
     * @param {string} repository The full name of the repository e.g. username/repo
     * @param {string} branch The branch to unlock.
     */
    private async unlockBranch(repository: string, branch: IBranch) {
        this.logger.verbose(`Unlocking branch '${branch.name}' in '${repository}'`);
        const uri = `${this.githubApiUrl}/repos/${repository}/branches/${branch.name}/protection`;
        const requestOptions = this.getDefaultRequestOptions(uri);
        this.logger.debug(`DELETE ${uri}`);
        try {
            const response: Request.FullResponse = await Request.delete(requestOptions);
            this.logger.debug(response.body);
            this.logger.verbose(`Unlocked branch ${branch} in ${repository}`);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Constructs and returns default request options.
     *
     * @param {string} uri The Github API uri.
     */
    private getDefaultRequestOptions(uri: string): Request.Options {
        // Required custom media type to access branch protection API preview
        // https://developer.github.com/v3/previews/#protected-branches
        // TODO: change to v3 when protected branches become part of the V3 API
        const GITHUB_ACCEPT = "application/vnd.github.loki-preview+json";

        // The `User-Agent` header is required: https://developer.github.com/v3/#user-agent-required
        const USER_AGENT = "michael-yx-wu/branch-manager";

        return {
            ca: this.caFile,
            headers: {
                "Accept": GITHUB_ACCEPT,
                "Authorization": `token ${this.token}`,
                "Content-Type": "application/json",
                "User-Agent": USER_AGENT,
            },
            json: true,
            resolveWithFullResponse: true,
            uri,
        };
    }
}
