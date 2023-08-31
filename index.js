const fs = require("fs");
const { Octokit } = require("@octokit/rest");


const config = {
  orgName: process.env.ORG_NAME,
  branchName: "add-extension-file",
  commitMessage: "Add/edit vscode default extension file",
  filePath: ".vscode/extensions.json",
  input_extensions: process.env.INPUT_EXTENSIONS,
  repositories: process.env.INPUT_REPOSITORIES,
}

const getRepos = async (octokit, orgName, repos) => {
  let resultRepos = [];

  if (repos) {
    // If a list of repositories is provided, get the details of those repositories
    const repoNames = repos.split(",");

    for (const repoName of repoNames) {
      const repo = await octokit.repos.get({
        owner: orgName,
        repo: repoName.trim(),
      });
      resultRepos.push(repo.data);
    }
  } else {
    // If no list of repositories is provided, get the list of all repositories in the organization
    const response = await octokit.repos.listForOrg({
      org: orgName,
    });
    resultRepos = response.data;
  }


  return resultRepos;
}

const updateExtensionFile = (currentExtensionContent, extensions) => {
  if (!currentExtensionContent) return;

  let newExtensionContent; 

  try {
    newExtensionContent = JSON.parse(currentExtensionContent);
  } catch (error) {
    throw new Error("The extensions.json file is not valid JSON");
  }

  // Add the Copilot extension to the file
  if (!newExtensionContent.recommendations) {
    newExtensionContent.recommendations = [];
  }

  const recommendedExtensions = extensions.split(",");
  for (const extension of recommendedExtensions) {
    if (!newExtensionContent.recommendations.includes(extension.trim())) {
      newExtensionContent.recommendations.push(extension.trim());
    }
  }

  return JSON.stringify(newExtensionContent, null, 2);
}

const main = async () => {
  const stats = {
    repositoriesCount: 0,
    filesUpdated: 0,
    filesCreated: 0,
    failed: 0,
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  let repos = await getRepos(octokit, config.orgName, config.repositories)

  stats.repositoriesCount = repos.length;

  for (const repo of repos.data) {
    await octokit.git.createRef({
      owner: config.orgName,
      repo: repo.name,
      ref: `refs/heads/${config.branchName}`,
      sha: repo.default_branch,
    });

    // checkout file to see if it exists
    let fileContent = null;
    let type = null;
    try {
      file = await octokit.repos.getContent({
        owner: config.orgName,
        repo: repo.name,
        path: config.filePath,
        ref: repo.default_branch,
      });

      fileContent = Buffer.from(result.data.content, 'base64').toString()
      type = 'update'
    } catch (error) {
      // If the file doesn't exist, create an empty object
      if (error.code === "ENOENT") {
        fileContent = "{}";
        type = 'create'
      } else {
        throw error;
      }
    }

    let updatedFileContent;
    try {
      updatedFileContent = updateExtensionFile(fileContent, config.input_extensions, type);

      // await octokit.repos.createOrUpdateFileContents({
      //   owner: config.orgName,
      //   repo: repo.name,
      //   path: config.filePath,
      //   message: commitMessage,
      //   content: Buffer.from(updatedFileContent).toString("base64"),
      //   branch: branchName,
      // });
  
      // // Create a new pull request from the new branch to the default branch of the repository
      // await octokit.pulls.create({
      //   owner: config.orgName,
      //   repo: repo.name,
      //   title: "Add file",
      //   head: config.branchName,
      //   base: repo.default_branch,
      // });

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
}

main();

module.exports = {
  updateExtensionFile,
  getRepos,
  main,
}