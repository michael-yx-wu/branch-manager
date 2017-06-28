export type LogLevel =
    "debug" |
    "error" |
    "info" |
    "verbose" |
    "warn";
export const LogLevel = {
    DEBUG: "debug" as LogLevel,
    ERROR: "error" as LogLevel,
    INFO: "info" as LogLevel,
    VERBOSE: "verbose" as LogLevel,
    WARN: "warn" as LogLevel,
};

export interface IBranch {
    commit: ICommit;
    name: string;
    protected: boolean;
    protection_url: boolean;
}

export interface ICommit {
    sha: string;
    url: string;
}

export interface IBranchProtectionOptions {
    enforce_admins: boolean;
    required_pull_request_reviews: IRequiredPullRequestReviews | null;
    required_status_checks: IRequiredStatusChecks | null;
    restrictions: IRestrictions | null;
}

export interface IRequiredStatusChecks {
    strict: boolean;
    context: string[];
}

export interface IRequiredPullRequestReviews {
    dismissal_restrictions: IDismissalRestrictions | undefined;
    dismiss_stale_review: boolean;
    require_code_owner_reviews: boolean;
}

export interface IDismissalRestrictions {
    users: string[];
    teams: string[];
}

export interface IRestrictions {
    users: string[];
    teams: string[];
}

export interface IBranchManagerLockResponse {
    error?: any;
    lockedBranches: IBranch[];
}

export interface IBranchManagerUnlockResponse {
    error?: any;
    unlockedBranches: IBranch[];
}
