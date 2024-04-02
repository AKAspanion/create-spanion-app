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

const argProjectName = argv._[0];
const argTemplateKey = argv.template || argv.t;
const argRepoLink = argv.repo || argv.r;

function getTemplate(templateKey: string) {
  if (repos[templateKey]) {
    return repos[templateKey];
  } else {
    throw new Error("Given template key is invalid.");
  }
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
  let targetProjectName: string = argProjectName || defaultProjectName || "";

  const resolvedProjectName = () =>
    targetProjectName === "."
      ? path.basename(path.resolve())
      : targetProjectName;

  try {
    await prompts(
      [
        {
          type: argProjectName ? null : "text",
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
    execSync(`npx rimraf ${path.join(projectPath, ".git")}`);
    execSync(`npx rimraf ${path.join(projectPath, "yarn.lock")}`);
    execSync(`npx rimraf ${path.join(projectPath, "package-lock.json")}`);

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
