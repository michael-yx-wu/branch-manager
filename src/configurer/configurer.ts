import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { IBranchManagerConfig } from "./types";

/**
 * Read and write local and global settings.
 *
 * @internal
 */
export class Configurer {
    /**
     * Loads local and global configuration files and merges them with local settings taking
     * priority.
     */
    public static loadMergedConfiguration() {
        const globalConfig = Configurer.loadConfiguration(true);
        const localConfig = Configurer.loadConfiguration(false);
        const configurer = new Configurer({
            ...globalConfig,
            ...localConfig,
        });
        const { config } = configurer;
        let { caFilePath } = config;
        if (caFilePath !== undefined && caFilePath.charAt(0) === "~") {
            caFilePath = path.join(os.homedir(), caFilePath.slice(1));
        }
        configurer.config.caFilePath = caFilePath;
        return configurer;
    }

    private static configFileName = "bmconfig.json";

    private static loadConfiguration(global: boolean): IBranchManagerConfig {
        try {
            const config = global
                ? JSON.parse(fs.readFileSync(`${os.homedir()}/${Configurer.configFileName}`, "utf-8"))
                : JSON.parse(fs.readFileSync(path.resolve(process.cwd(), Configurer.configFileName), "utf-8"));
            // 1. remove null fields so that we can use strict equality when checking for undefined
            // 2. resolve `~` to the home directory
            Object.keys(config).forEach((key) => {
                if (config[key] == null) {
                    delete config[key];
                }
            });
            return config;
        } catch (error) {
            return {};
        }
    }

    private config: IBranchManagerConfig;

    constructor(config: IBranchManagerConfig) {
        this.config = config;
    }

    /**
     * Return the entire config object.
     *
     * @returns {IBranchManagerConfig}
     */
    public getConfig() {
        return this.config;
    }

    /**
     * Returns the `branchProtectionOptions` object.
     *
     * @returns {IBranchProtectionOptions | undefined}
     */
    public getBranchProtectionOptions() {
        return this.config.branchProtectionOptions;
    }

    /**
     * Attempt to return the contents of the CA file path. Throws an error if the file could not be
     * read.
     *
     * @returns {string | undefined}
     */
    public getCaFileContents() {
        if (this.config.caFilePath !== undefined) {
            return fs.readFileSync(this.config.caFilePath, "utf-8");
        }
        return undefined;
    }

    /**
     * Return the Github personal access token or undefined if it is not set.
     *
     * @returns {string | undefined}
     */
    public getToken() {
        return this.config.token;
    }
}
