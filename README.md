# create-spanion-app [![Publish](https://github.com/AKAspanion/create-spanion-app/actions/workflows/publish.yml/badge.svg)](https://github.com/AKAspanion/create-spanion-app/actions/workflows/publish.yml) ![NPM Version](https://img.shields.io/npm/v/create-spanion-app)

Generate projects from repos using CLI.  

Using this simple cli tool, you can copy any public repo and use it as a template for your project.  
This also has bunch of my templates baked in, which can be used.

## Usage

Install globally using `npm i -g create-spanion-app` then use `create-spanion-app <commands>` to run the CLI tool.  
It can also be used without installation `npx create-spanion-app <commands>`.

> The shorthand `csa` can be substituted for `create-spanion-app` for e.g.  is `npx csa -t tanstack`.

### Commands

#### Template Creation

This tool takes these two arguments:

##### Template *`-t`*

Specifies to use the inbuilt template.  
`npx csa -t frontend`  
`npx csa -t svelte`  

##### Repo *`-r`*

Specifies to use any public repo.  
`npx csa -r https://github.com/AKAspanion/nextjs-template.git`

#### Image Scanner

Scan for image tags in Vue.js, HTML, JavaScript, and TypeScript files to analyze performance and accessibility.

`npx csa scan-imgs [options]`

**Options:**

- `--mode <mode>` - Scan mode: `simple`, `comprehensive`, `summary` (default: comprehensive)
- `--csv` - Generate CSV file
- `--no-json` - Don't generate JSON files  
- `--no-preview` - Don't show image preview

**Examples:**

```bash
npx csa scan-imgs                    # Comprehensive scan with JSON output
npx csa scan-imgs --mode simple     # Simple scan with basic output
npx csa scan-imgs --mode summary    # Summary report with recommendations
npx csa scan-imgs --csv             # Generate CSV file
npx csa scan-imgs --no-preview      # Skip preview display
```

#### Long Files Scanner

Scan for files exceeding a specified number of lines (default: 500). Useful for identifying large files in your project.

`npx csa scan-long-files [options]`

**Options:**

- `--threshold <number>` - Line count threshold (default: 500)
- `--dir <directory>` - Root directory to scan (default: current directory)

**Examples:**

```bash
npx csa scan-long-files                    # Scan for files >500 lines in current directory
npx csa scan-long-files --threshold 1000   # Scan for files >1000 lines
npx csa scan-long-files --dir src          # Scan only in the src directory
npx csa scan-long-files --threshold 200 --dir .  # Custom threshold and directory
```

## Other Examples

To use current folder.  
`npx csa . -t frontend`  

To use specified project folder.  
`npx csa my-app -t frontend`

## Available Templates

- mfe-react
- tanstack
- frontend
- backend
- svelte
- nextjs

## License

MIT © [AKAspanion](https://github.com/AKAspanion)
