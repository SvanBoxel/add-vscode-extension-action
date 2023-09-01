const { createPr, updateExtensionFile, getRepos } = require('./src');

const main = async () => {
  const stats = {
    repositoriesCount: 0,
    filesUpdated: 0,
    filesCreated: 0,
    failed: 0,
  }

  const octokit = new Octokit({
    auth: core.getInput('github-token')
  });

  const orgName = core.getInput('organization-name');
  let repos = await getRepos(octokit, orgName, core.getInput('repositories'))

  stats.repositoriesCount = repos.length;

  for (const repo of repos) {
    // checkout file to see if it exists
    let fileContent = null;
    let type = null;
    try {
      file = await octokit.repos.getContent({
        owner: orgName,
        repo: repo.name,
        path: FILE_PATH,
        ref: repo.default_branch,
      });

      fileContent = Buffer.from(file.data.content, 'base64').toString()
      type = 'update'
    } catch (error) {
      // If the file doesn't exist, create an empty object
      if (error.code === "ENOENT" || error.status === 404 ) {
        if (core.getInput('only-if-file-exists') === true) {
          continue
        }
        fileContent = "{}";
        type = 'create'
      } else {
        throw error;
      }
    }

    let updatedFileContent;
    try {
      updatedFileContent = updateExtensionFile(fileContent, core.getInput('extensions'), type);

      await createPr(octokit, orgName, repo.name, updatedFileContent);

      if (type === 'create') {
        stats.filesCreated += 1;
      } else {
        stats.filesUpdated += 1;
      }
    } catch (error) {
      console.log(error);
      stats.failed += 1;
      continue;
    }
  }

  console.log(stats);
  core.notice(`Found ${stats.repositoriesCount} repositories, updated ${stats.filesUpdated} files/repositories, created ${stats.filesCreated} files/repositories, failed ${stats.failed} times.`);
}

main();

