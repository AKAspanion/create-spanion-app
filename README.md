# create-spanion-app [![Publish](https://github.com/AKAspanion/create-spanion-app/actions/workflows/publish.yml/badge.svg)](https://github.com/AKAspanion/create-spanion-app/actions/workflows/publish.yml) ![NPM Version](https://img.shields.io/npm/v/create-spanion-app)

Generate projects from repos using CLI with additional development tools.  

Using this simple cli tool, you can copy any public repo and use it as a template for your project.  
This also has bunch of my templates baked in, which can be used.

The tool also includes powerful development utilities:

- **Image Scanner**: Analyze image tags in Vue.js, HTML, JavaScript, and TypeScript files
- **Long Files Scanner**: Identify large files that might need refactoring
- **Build Benchmark**: Performance testing for your build process

## Usage

Install globally using `npm i -g create-spanion-app` then use `create-spanion-app <commands>` to run the CLI tool.  
It can also be used without installation `npx create-spanion-app <commands>`.

> The shorthand `csa` can be substituted for `create-spanion-app` for e.g.  is `npx csa -t tanstack`.

### Quick Reference

```bash
# Template creation
npx csa -t <template>                    # Use built-in template
npx csa -r <repo-url>                    # Use custom repo

# Development utilities
npx csa scan-imgs [options]              # Scan for image tags
npx csa scan-long-files [options]        # Scan for large files
npx csa benchmark-build [options]        # Benchmark build performance
```

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

#### Build Benchmark

Run performance benchmarks on your build process to analyze build times and identify performance bottlenecks.

`npx csa benchmark-build [options]`

**Options:**

- `--count <number>` - Number of builds to run (default: 10)
- `--command <string>` - Build command to run (default: "npm run build")

**Examples:**

```bash
npx csa benchmark-build                    # Run 10 builds with npm run build
npx csa benchmark-build --count 5          # Run 5 builds
npx csa benchmark-build --command "yarn build"  # Use yarn build command
npx csa benchmark-build --count 3 --command "pnpm build"  # Custom count and command
```

**Output:**

The benchmark generates comprehensive statistics including:

- Average, minimum, and maximum build times
- Success/failure rates
- Time range analysis
- Detailed results saved to `build-benchmark-results.json`

**Sample Output:**

```
🚀 Starting Build Benchmark
Will run 10 builds and calculate average time

--- Build 1/10 ---
Starting build...
✓ Build completed in 2s 450ms

==================================================
📊 BUILD BENCHMARK RESULTS
==================================================
Total builds: 10
Successful builds: 10
Failed builds: 0
Success rate: 100.0%

Average build time: 2s 450ms
Fastest build: 2s 320ms
Slowest build: 2s 580ms
Time range: 0s 260ms
Total time: 24s 500ms
==================================================

📁 Results saved to: build-benchmark-results.json
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
