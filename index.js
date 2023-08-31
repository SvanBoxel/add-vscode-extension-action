const fs = require("fs");
const { Octokit } = require("@octokit/rest");

// Create a new Octokit instance with your GitHub app's authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

let repos = [];
if (process.env.INPUT_REPOSITORIES) {
  // If a list of repositories is provided, get the details of those repositories
  const repoNames = process.env.INPUT_REPOSITORIES.split(",");
  for (const repoName of repoNames) {
    const repo = await octokit.repos.get({
      owner: orgName,
      repo: repoName,
    });
    repos.push(repo.data);
  }
} else {
  // If no list of repositories is provided, get the list of all repositories in the organization
  const response = await octokit.repos.listForOrg({
    org: orgName,
  });
  repos = response.data;
}



const addFileToRepo = async (repo) => {
    // Read the contents of the extension file
  let extensionFile = {};
  try {
    extensionFile = JSON.parse(fs.readFileSync(".vscode/extensions.json"));
  } catch (error) {
    // If the file doesn't exist, create an empty object
    if (error.code === "ENOENT") {
      extensionFile = {};
    } else {
      throw error;
    }
  }

  // Add the Copilot extension to the file
  if (!extensionFile.recommendations) {
    extensionFile.recommendations = [];
  }

  const recommendedExtensions = JSON.parse(process.env.INPUT_EXTENSIONS);
  for (const extension of recommendedExtensions) {
    if (!extensionFile.recommendations.includes(extension)) {
      extensionFile.recommendations.push(extension);
    }
  })


  // Write the updated contents back to the file
  fs.writeFileSync(".vscode/extensions.json", JSON.stringify(extensionFile, null, 2));
}

// For each repository, create a new branch and add the file to the branch
for (const repo of repos.data) {
  const branchName = "add-file";
  const fileContent = process.env.INPUT_FILE_CONTENT;
  const filePath = process.env.INPUT_FILE_PATH;

  await octokit.git.createRef({
    owner: orgName,
    repo: repo.name,
    ref: `refs/heads/${branchName}`,
    sha: repo.default_branch,
  });

  await octokit.repos.createOrUpdateFileContents({
    owner: orgName,
    repo: repo.name,
    path: filePath,
    message: "Add file",
    content: Buffer.from(fileContent).toString("base64"),
    branch: branchName,
  });

  // Create a new pull request from the new branch to the default branch of the repository
  await octokit.pulls.create({
    owner: orgName,
    repo: repo.name,
    title: "Add file",
    head: branchName,
    base: repo.default_branch,
  });
}