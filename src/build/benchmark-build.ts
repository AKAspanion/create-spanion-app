#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Types and interfaces
interface BuildResult {
  buildNumber: number;
  duration: number | null;
  success: boolean;
  error?: string;
  timestamp: string;
}

interface BenchmarkResults {
  timestamp: string;
  buildCount: number;
  builds: BuildResult[];
  summary: BenchmarkSummary;
}

interface BenchmarkSummary {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  successRate: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  timeRange: number;
}

interface Colors {
  reset: string;
  bright: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
}

// Configuration
let BUILD_COUNT = 10;
let BUILD_COMMAND = "npm run build";
const RESULTS_FILE = "build-benchmark-results.json";

// Colors for console output
const colors: Colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof Colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}s ${milliseconds}ms`;
}

function runBuild(): Promise<number> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    log(`Starting build...`, "cyan");

    const buildProcess = spawn(BUILD_COMMAND, [], {
      shell: true,
      stdio: "inherit",
    });

    buildProcess.on("close", (code: number | null) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (code === 0) {
        log(`✓ Build completed in ${formatTime(duration)}`, "green");
        resolve(duration);
      } else {
        log(`✗ Build failed with code ${code}`, "red");
        reject(new Error(`Build failed with exit code ${code}`));
      }
    });

    buildProcess.on("error", (error: Error) => {
      log(`✗ Build process error: ${error.message}`, "red");
      reject(error);
    });
  });
}

async function runBenchmark(): Promise<void> {
  log("🚀 Starting Build Benchmark", "bright");
  log(`Will run ${BUILD_COUNT} builds and calculate average time`, "blue");
  log("", "reset");

  const results: BenchmarkResults = {
    timestamp: new Date().toISOString(),
    buildCount: BUILD_COUNT,
    builds: [],
    summary: {} as BenchmarkSummary,
  };

  let totalTime = 0;
  let successfulBuilds = 0;

  for (let i = 1; i <= BUILD_COUNT; i++) {
    log(`\n--- Build ${i}/${BUILD_COUNT} ---`, "magenta");

    try {
      const duration = await runBuild();
      results.builds.push({
        buildNumber: i,
        duration: duration,
        success: true,
        timestamp: new Date().toISOString(),
      });

      totalTime += duration;
      successfulBuilds++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log(`Build ${i} failed: ${errorMessage}`, "red");
      results.builds.push({
        buildNumber: i,
        duration: null,
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Calculate statistics
  if (successfulBuilds > 0) {
    const averageTime = totalTime / successfulBuilds;
    const successfulBuildDurations = results.builds
      .filter((b) => b.success && b.duration !== null)
      .map((b) => b.duration as number);

    const minTime = Math.min(...successfulBuildDurations);
    const maxTime = Math.max(...successfulBuildDurations);

    results.summary = {
      totalBuilds: BUILD_COUNT,
      successfulBuilds: successfulBuilds,
      failedBuilds: BUILD_COUNT - successfulBuilds,
      successRate: (successfulBuilds / BUILD_COUNT) * 100,
      totalTime: totalTime,
      averageTime: averageTime,
      minTime: minTime,
      maxTime: maxTime,
      timeRange: maxTime - minTime,
    };

    // Display results
    log("\n" + "=".repeat(50), "bright");
    log("📊 BUILD BENCHMARK RESULTS", "bright");
    log("=".repeat(50), "bright");
    log(`Total builds: ${BUILD_COUNT}`, "blue");
    log(`Successful builds: ${successfulBuilds}`, "green");
    log(`Failed builds: ${BUILD_COUNT - successfulBuilds}`, "red");
    log(`Success rate: ${results.summary.successRate.toFixed(1)}%`, "yellow");
    log("", "reset");
    log(`Average build time: ${formatTime(averageTime)}`, "bright");
    log(`Fastest build: ${formatTime(minTime)}`, "green");
    log(`Slowest build: ${formatTime(maxTime)}`, "red");
    log(`Time range: ${formatTime(maxTime - minTime)}`, "yellow");
    log(`Total time: ${formatTime(totalTime)}`, "blue");
    log("=".repeat(50), "bright");

    // Save results to file
    try {
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      log(`\n📁 Results saved to: ${RESULTS_FILE}`, "cyan");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log(`\n⚠️  Could not save results to file: ${errorMessage}`, "yellow");
    }
  } else {
    log("\n❌ No successful builds to analyze", "red");
  }
}

export function runBuildBenchmark(options?: {
  count?: number;
  command?: string;
}): Promise<void> {
  // Apply options
  if (options?.count) {
    BUILD_COUNT = options.count;
  }
  if (options?.command) {
    BUILD_COMMAND = options.command;
  }

  return runBenchmark();
}

// Note: This module is designed to be imported and used by the main CLI
// The command line argument handling is done in the main index.ts file
