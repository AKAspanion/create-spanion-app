#!/usr/bin/env node

import { execSync } from "child_process";
import prompts from "prompts";
import path from "path";
import fs from "fs";
import minimist from "minimist";
import { blue, green, red, reset } from "kolorist";

import repos from "./repos";

const argv = minimist(process.argv.slice(2));

const defaultProjectName = "my-app";
const CWD = process.cwd();

const commandArg = argv._[0];
const argTemplateKey = argv.template || argv.t;
const argRepoLink = argv.repo || argv.r;
const argRepoHelp = argv.help || argv.h;

function getTemplate(templateKey: string) {
  if (repos[templateKey]) {
    return repos[templateKey];
  } else {
    throw new Error("Given template key is invalid.");
  }
}

function showHelp() {
  if (commandArg === "help") {
    if (argRepoHelp) {
      console.log("Flag to show help");
      return;
    }
    if (argTemplateKey) {
      console.log("Name of the template");
      return;
    }
    if (argRepoLink) {
      console.log("link of the repository");
      return;
    }
  }

  console.log(`Usage: [options] [value]

Options:
  -h, --help          display help for command
  -t, --template      template name to install
  -r, --repo          repo link to install from
  
Commands:
  help  [options]     display help for options
  [arg] [options]     first command is used as repo folder
`);
}

function getGitRepo() {
  if (argTemplateKey) {
    return getTemplate(argTemplateKey);
  }

  if (argRepoLink) {
    return argRepoLink;
  }

  throw new Error("Template key or repo link is required.");
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  );
}

function writeFile(targetPath: string, content: string) {
  fs.writeFileSync(targetPath, content);
}

async function main() {
  if (argRepoHelp || commandArg === "help") {
    return showHelp();
  }

  let targetProjectName: string = commandArg || defaultProjectName || "";

  const resolvedProjectName = () =>
    targetProjectName === "."
      ? path.basename(path.resolve())
      : targetProjectName;

  try {
    await prompts(
      [
        {
          type: commandArg ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultProjectName,
          onState: (state) => {
            targetProjectName = state.value.trim() || defaultProjectName;
          },
        },
      ],
      {
        onCancel: () => {
          throw new Error(red("✖") + " Process cancelled");
        },
      }
    );

    const gitRepo = getGitRepo();
    const projectPath = path.join(CWD, resolvedProjectName());

    if (!isValidPackageName(resolvedProjectName())) {
      throw new Error(
        `Given project name "${resolvedProjectName()}" doesn't match package.json naming convention.`
      );
    }

    if (!fs.existsSync(targetProjectName)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    if (!isEmpty(targetProjectName)) {
      console.log(
        red(
          (targetProjectName === "."
            ? "Current directory"
            : `Target directory "${targetProjectName}"`) + ` is not empty.`
        )
      );
      process.exit(1);
    }

    console.log(blue("Copying files..."));
    execSync(`git clone --depth 1 ${gitRepo} ${projectPath}`);

    process.chdir(projectPath);

    console.log(blue("Parsing files..."));
    const pkgJsonPath = path.join(projectPath, `package.json`);
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    pkgJson.name = targetProjectName;
    writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));

    console.log(blue("Performing cleanup..."));
    execSync(`rm -rf ${path.join(projectPath, ".git")}`);
    execSync(`rm -rf ${path.join(projectPath, "yarn.lock")}`);
    execSync(`rm -rf ${path.join(projectPath, "package-lock.json")}`);

    fs.rm(path.join(projectPath, "bin"), { recursive: true }, (err) => {
      // console.log(err);
    });

    console.log(
      green(`The setup is done in "${resolvedProjectName()}" directory!`)
    );

    const endResult = await prompts([
      {
        type: "confirm",
        name: "openInVscode",
        message: reset("Open in VS Code"),
      },
    ]);

    const { openInVscode } = endResult;

    if (openInVscode) {
      execSync(`code ${projectPath}`);
    }
  } catch (error) {
    console.log(red(error.message));
  }
}

main();
