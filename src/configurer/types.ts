import { IBranchProtectionOptions } from "../branch-manager/types";

/** @internal */
export interface IBranchManagerConfig {
    branchProtectionOptions?: IBranchProtectionOptions;
    caFilePath?: string;
    githubAPI?: string;
    token?: string;
}
