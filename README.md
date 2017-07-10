# BranchManager [![circleci](https://circleci.com/gh/michael-yx-wu/branch-manager.png?circle-token=63c5b956c21d1afba082da217d09a18f7c87f392)](https://circleci.com/gh/michael-yx-wu/branch-manager/tree/master)

`BranchManager` can easily lock and unlock branches in your Github repository.

## Usage

### branch-manager

```
Usage: branch-manager COMMAND


Options:

  -V, --version  output the version number
  -h, --help     output usage information


Commands:

  lock        Lock branches
  unlock      Unlock branches
  help [cmd]  display help for [cmd]
```

### branch-manager lock

```
Usage: branch-manager-lock [options]


Options:

  -r, --repository <repository>  Full name of the repository
  -b, --branch <branch-regex>    Regular expression
  -g, --github-api [url]         Default is 'https://api.github.com'
  -t, --token [token]            Github API token. Uses contents of .bmtoken by default
  --ca-file [ca-file-path]       Path to CA file
  -m, --dry-run                  See what branches would be affected
  -v, --verbose                  Show verbose output
  --debug                        Show debug output
  -h, --help                     output usage informati
```


### branch-manager unlock

```
Usage: branch-manager-unlock [options]


Options:

  -r, --repository <repository>  Full name of the repository
  -b, --branch <branch-regex>    Regular expression
  -g, --github-api [url]         Default is 'https://api.github.com'
  -t, --token [token]            Github API token. Uses contents of .bmtoken by default
  --ca-file [ca-file-path]       Path to CA file
  -m, --dry-run                  See what branches would be affected
  -v, --verbose                  Show verbose output
  --debug                        Show debug output
  -h, --help                     output usage information
```

## Configuration

Set global settings in `~/bmconfig.json`. Local settings will be read from `./bmconfig.json`.


```json
{
  "branchProtectionOptions": <branch protection object>,
  "caFilePath": "<path to CA file>",
  "token": "GITHUB_PERSONAL_ACCESS_TOKEN"
}
```

Check the [Github API
documentation](https://developer.github.com/v3/repos/branches/#update-branch-protection) for more
information on how to format the `branchProtectionOptions`.

