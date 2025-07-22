#!/usr/bin/env node

import fs from "fs";
import path from "path";

// ============================================================================
// TYPES
// ============================================================================

interface ImageTag {
  file: string;
  line: number | null;
  tag: string;
  src: string | null;
  width: string | null;
  height: string | null;
  loading: string | null;
  alt: string | null;
  class: string | null;
  id: string | null;
}

interface ScanOptions {
  mode?: "simple" | "comprehensive" | "summary";
  generateCSV?: boolean;
  generateJSON?: boolean;
  showPreview?: boolean;
  maxPreview?: number;
}

interface ScanReport {
  summary: {
    totalImages: number;
    filesScanned: number;
    vueFiles: number;
    htmlFiles: number;
    jsFiles: number;
  };
  images: ImageTag[];
  statistics: {
    withSrc: number;
    withWidth: number;
    withHeight: number;
    withLoading: number;
    withAlt: number;
    withClass: number;
    withId: number;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Function to recursively find all files with specific extensions
function findFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== "node_modules" && file !== ".git" && !file.startsWith(".")) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });

  return results;
}

// Function to extract attribute value from img tag
function extractAttribute(tag: string, attribute: string): string | null {
  const regex = new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = tag.match(regex);
  return match ? match[1] : null;
}

// Function to find line number of the match
function findLineNumber(
  content: string,
  match: string,
  matchIndex: number
): number | null {
  const lines = content.split("\n");
  let currentPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = currentPos;
    const lineEnd = currentPos + line.length;

    // Find the position of this specific match
    const matchPos = content.indexOf(match, currentPos);

    if (matchPos >= lineStart && matchPos < lineEnd) {
      return i + 1; // Line numbers are 1-indexed
    }

    currentPos = lineEnd + 1; // +1 for newline
  }

  return null;
}

// ============================================================================
// IMAGE EXTRACTION FUNCTIONS
// ============================================================================

// Function to extract image tags from content
function extractImageTags(content: string, filePath: string): ImageTag[] {
  const images: ImageTag[] = [];

  // Regex to match img tags with various attribute patterns
  const imgRegex = /<img[^>]*>/gi;
  const matches = content.match(imgRegex);

  if (matches) {
    matches.forEach((match, index) => {
      const image: ImageTag = {
        file: path.relative(process.cwd(), filePath),
        line: findLineNumber(content, match, index),
        tag: match,
        src: extractAttribute(match, "src"),
        width: extractAttribute(match, "width"),
        height: extractAttribute(match, "height"),
        loading: extractAttribute(match, "loading"),
        alt: extractAttribute(match, "alt"),
        class: extractAttribute(match, "class"),
        id: extractAttribute(match, "id"),
      };

      images.push(image);
    });
  }

  return images;
}

// Function to process Vue files (extract template content)
function processVueFile(filePath: string): ImageTag[] {
  const content = fs.readFileSync(filePath, "utf8");

  // Extract template content from Vue files
  const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
  if (templateMatch) {
    return extractImageTags(templateMatch[1], filePath);
  }

  return [];
}

// Function to process HTML files
function processHtmlFile(filePath: string): ImageTag[] {
  const content = fs.readFileSync(filePath, "utf8");
  return extractImageTags(content, filePath);
}

// Function to process JavaScript/TypeScript files (React, Angular, etc.)
function processJsFile(filePath: string): ImageTag[] {
  const content = fs.readFileSync(filePath, "utf8");
  const images: ImageTag[] = [];

  // Skip files that are likely to be scanner files themselves
  if (filePath.includes("image-scanner") || filePath.includes("scanner")) {
    return images;
  }

  // Common patterns for JSX/TSX and template literals
  const patterns = [
    // JSX img tags: <img src="..." />
    /<img[^>]*>/gi,
    // Template literals with img tags: `<img src="${...}" />`
    /`[^`]*<img[^>]*>[^`]*`/gi,
    // String literals with img tags: '<img src="..." />'
    /'[^']*<img[^>]*>[^']*'/gi,
    // Double quotes with img tags: "<img src=\"...\" />"
    /"[^"]*<img[^>]*>[^"]*"/gi,
  ];

  patterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        // Extract just the img tag from template literals or strings
        const imgMatch = match.match(/<img[^>]*>/i);
        if (imgMatch) {
          const imgTag = imgMatch[0];

          // Skip if this looks like a regex pattern or comment
          if (
            imgTag.includes("\\") ||
            imgTag.includes("//") ||
            imgTag.includes("/*")
          ) {
            return;
          }

          const image: ImageTag = {
            file: path.relative(process.cwd(), filePath),
            line: findLineNumber(content, match, 0),
            tag: imgTag,
            src: extractAttribute(imgTag, "src"),
            width: extractAttribute(imgTag, "width"),
            height: extractAttribute(imgTag, "height"),
            loading: extractAttribute(imgTag, "loading"),
            alt: extractAttribute(imgTag, "alt"),
            class: extractAttribute(imgTag, "class"),
            id: extractAttribute(imgTag, "id"),
          };
          images.push(image);
        }
      });
    }
  });

  return images;
}

// ============================================================================
// REPORT GENERATION FUNCTIONS
// ============================================================================

// Function to generate CSV file
function generateCSVFile(images: ImageTag[]): void {
  const csvHeader = "File,Line,Tag,Src,Width,Height,Loading,Alt,Class,Id\n";
  const csvRows = images
    .map((img) => {
      return [
        img.file,
        img.line,
        `"${img.tag.replace(/"/g, '""')}"`,
        img.src || "",
        img.width || "",
        img.height || "",
        img.loading || "",
        img.alt || "",
        img.class || "",
        img.id || "",
      ].join(",");
    })
    .join("\n");

  const csvContent = csvHeader + csvRows;
  fs.writeFileSync("image-scan-report.csv", csvContent);
  console.log("📊 CSV report saved to: image-scan-report.csv");
}

// Function to generate summary report
function generateSummaryReport(report: ScanReport): void {
  console.log("📊 IMAGE TAG ANALYSIS SUMMARY\n");

  console.log("🔢 OVERALL STATISTICS:");
  console.log(`Total image tags found: ${report.summary.totalImages}`);
  console.log(
    `Files scanned: ${report.summary.filesScanned} (${report.summary.vueFiles} Vue + ${report.summary.htmlFiles} HTML + ${report.summary.jsFiles} JS/TS)\n`
  );

  console.log("📈 ATTRIBUTE USAGE:");
  console.log(
    `✅ Images with src: ${report.statistics.withSrc} (${Math.round(
      (report.statistics.withSrc / report.summary.totalImages) * 100
    )}%)`
  );
  console.log(
    `⚠️  Images with width: ${report.statistics.withWidth} (${Math.round(
      (report.statistics.withWidth / report.summary.totalImages) * 100
    )}%)`
  );
  console.log(
    `⚠️  Images with height: ${report.statistics.withHeight} (${Math.round(
      (report.statistics.withHeight / report.summary.totalImages) * 100
    )}%)`
  );
  console.log(
    `⚠️  Images with loading: ${report.statistics.withLoading} (${Math.round(
      (report.statistics.withLoading / report.summary.totalImages) * 100
    )}%)`
  );
  console.log(
    `✅ Images with alt: ${report.statistics.withAlt} (${Math.round(
      (report.statistics.withAlt / report.summary.totalImages) * 100
    )}%)`
  );
  console.log(
    `✅ Images with class: ${report.statistics.withClass} (${Math.round(
      (report.statistics.withClass / report.summary.totalImages) * 100
    )}%)`
  );
  console.log(
    `ℹ️  Images with id: ${report.statistics.withId} (${Math.round(
      (report.statistics.withId / report.summary.totalImages) * 100
    )}%)\n`
  );

  // Find images with loading attribute
  const imagesWithLoading = report.images.filter((img) => img.loading);
  console.log("🚀 IMAGES WITH LOADING ATTRIBUTE:");
  imagesWithLoading.forEach((img, index) => {
    console.log(
      `${index + 1}. ${img.file}:${img.line} - loading="${img.loading}"`
    );
  });
  console.log("");

  // Find images with width/height
  const imagesWithDimensions = report.images.filter(
    (img) => img.width || img.height
  );
  console.log("📏 IMAGES WITH DIMENSIONS:");
  imagesWithDimensions.forEach((img, index) => {
    console.log(`${index + 1}. ${img.file}:${img.line}`);
    console.log(
      `   width: ${img.width || "N/A"}, height: ${img.height || "N/A"}`
    );
  });
  console.log("");

  // Find images without alt text
  const imagesWithoutAlt = report.images.filter((img) => !img.alt);
  console.log(`⚠️  IMAGES WITHOUT ALT TEXT (${imagesWithoutAlt.length}):`);
  imagesWithoutAlt.slice(0, 10).forEach((img, index) => {
    console.log(`${index + 1}. ${img.file}:${img.line}`);
  });
  if (imagesWithoutAlt.length > 10) {
    console.log(`... and ${imagesWithoutAlt.length - 10} more`);
  }
  console.log("");

  // Recommendations
  console.log("💡 RECOMMENDATIONS:");
  console.log("1. Add width/height attributes to prevent layout shifts (CLS)");
  console.log(
    '2. Add loading="lazy" to images below the fold for better performance'
  );
  console.log("3. Add alt text to all images for accessibility");
  console.log(
    "4. Consider using next-gen formats (WebP, AVIF) for better compression"
  );
  console.log(
    "5. Implement responsive images with srcset for different screen sizes"
  );
  console.log("6. Use proper image optimization and compression");

  console.log("\n📁 Generated files:");
  console.log("- image-scan-report.json (detailed data)");
  console.log("- image-scan-report.csv (spreadsheet format)");
  console.log("- images.json (simple format)");
}

// ============================================================================
// MAIN SCANNING FUNCTION
// ============================================================================

function scanImages(options: ScanOptions = {}): ScanReport {
  const {
    mode = "comprehensive", // 'simple', 'comprehensive', 'summary'
    generateCSV = false,
    generateJSON = true,
    showPreview = true,
    maxPreview = 10,
  } = options;

  console.log("🔍 Scanning for image tags...\n");

  const projectRoot = process.cwd();
  const vueFiles = findFiles(projectRoot, [".vue"]);
  const htmlFiles = findFiles(projectRoot, [".html"]);
  const jsFiles = findFiles(projectRoot, [".js", ".jsx", ".ts", ".tsx"]);

  console.log(
    `Found ${vueFiles.length} Vue files, ${htmlFiles.length} HTML files, and ${jsFiles.length} JavaScript/TypeScript files\n`
  );

  let allImages: ImageTag[] = [];

  // Process Vue files
  vueFiles.forEach((file) => {
    const images = processVueFile(file);
    allImages = allImages.concat(images);
  });

  // Process HTML files
  htmlFiles.forEach((file) => {
    const images = processHtmlFile(file);
    allImages = allImages.concat(images);
  });

  // Process JavaScript/TypeScript files
  jsFiles.forEach((file) => {
    const images = processJsFile(file);
    allImages = allImages.concat(images);
  });

  console.log(`📊 Found ${allImages.length} image tags total\n`);

  // Generate report
  const report: ScanReport = {
    summary: {
      totalImages: allImages.length,
      filesScanned: vueFiles.length + htmlFiles.length + jsFiles.length,
      vueFiles: vueFiles.length,
      htmlFiles: htmlFiles.length,
      jsFiles: jsFiles.length,
    },
    images: allImages,
    statistics: {
      withSrc: allImages.filter((img) => img.src).length,
      withWidth: allImages.filter((img) => img.width).length,
      withHeight: allImages.filter((img) => img.height).length,
      withLoading: allImages.filter((img) => img.loading).length,
      withAlt: allImages.filter((img) => img.alt).length,
      withClass: allImages.filter((img) => img.class).length,
      withId: allImages.filter((img) => img.id).length,
    },
  };

  // Save files based on mode
  if (generateJSON) {
    if (mode === "simple") {
      // Simple format with only core attributes
      const simpleImages = allImages.map((img) => ({
        file: img.file,
        src: img.src,
        width: img.width,
        height: img.height,
        loading: img.loading,
        tag: img.tag,
      }));
      fs.writeFileSync("images.json", JSON.stringify(simpleImages, null, 2));
      console.log("✅ Simple results saved to: images.json");
    } else {
      // Comprehensive format
      fs.writeFileSync(
        "image-scan-report.json",
        JSON.stringify(report, null, 2)
      );
      console.log("✅ Detailed report saved to: image-scan-report.json");
    }
  }

  // Generate CSV if requested
  if (generateCSV) {
    generateCSVFile(allImages);
  }

  // Display results based on mode
  if (mode === "simple") {
    // Simple display
    allImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.file}`);
      console.log(`   src: ${img.src || "N/A"}`);
      console.log(`   width: ${img.width || "N/A"}`);
      console.log(`   height: ${img.height || "N/A"}`);
      console.log(`   loading: ${img.loading || "N/A"}`);
      console.log(`   tag: ${img.tag}`);
      console.log("");
    });

    // Simple statistics
    const stats = {
      total: allImages.length,
      withSrc: allImages.filter((img) => img.src).length,
      withWidth: allImages.filter((img) => img.width).length,
      withHeight: allImages.filter((img) => img.height).length,
      withLoading: allImages.filter((img) => img.loading).length,
    };

    console.log("📈 STATISTICS:");
    console.log(`Total images: ${stats.total}`);
    console.log(`With src: ${stats.withSrc}`);
    console.log(`With width: ${stats.withWidth}`);
    console.log(`With height: ${stats.withHeight}`);
    console.log(`With loading: ${stats.withLoading}`);
  } else if (mode === "comprehensive") {
    // Comprehensive display
    console.log("📈 SUMMARY:");
    console.log(`Total images found: ${report.summary.totalImages}`);
    console.log(`Files scanned: ${report.summary.filesScanned}`);
    console.log(`Vue files: ${report.summary.vueFiles}`);
    console.log(`HTML files: ${report.summary.htmlFiles}`);
    console.log(`JavaScript/TypeScript files: ${report.summary.jsFiles}\n`);

    console.log("📊 ATTRIBUTE STATISTICS:");
    console.log(`Images with src: ${report.statistics.withSrc}`);
    console.log(`Images with width: ${report.statistics.withWidth}`);
    console.log(`Images with height: ${report.statistics.withHeight}`);
    console.log(`Images with loading: ${report.statistics.withLoading}`);
    console.log(`Images with alt: ${report.statistics.withAlt}`);
    console.log(`Images with class: ${report.statistics.withClass}`);
    console.log(`Images with id: ${report.statistics.withId}\n`);

    // Show preview
    if (showPreview) {
      console.log(`👀 PREVIEW (first ${maxPreview} images):`);
      allImages.slice(0, maxPreview).forEach((img, index) => {
        console.log(`${index + 1}. File: ${img.file}:${img.line}`);
        console.log(`   Tag: ${img.tag}`);
        console.log(`   Src: ${img.src || "N/A"}`);
        console.log(`   Width: ${img.width || "N/A"}`);
        console.log(`   Height: ${img.height || "N/A"}`);
        console.log(`   Loading: ${img.loading || "N/A"}`);
        console.log("");
      });

      if (allImages.length > maxPreview) {
        console.log(`... and ${allImages.length - maxPreview} more images`);
      }
    }
  } else if (mode === "summary") {
    // Summary mode
    generateSummaryReport(report);
  }

  return report;
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

function showHelp(): void {
  console.log(`
🔍 Image Tag Scanner for Web Projects

USAGE:
  node image-scanner.js [options]

OPTIONS:
  --mode <mode>           Scan mode: simple, comprehensive, summary (default: comprehensive)
  --csv                   Generate CSV file
  --no-json              Don't generate JSON files
  --no-preview           Don't show image preview
  --help                 Show this help message

EXAMPLES:
  node image-scanner.js                    # Comprehensive scan with JSON output
  node image-scanner.js --mode simple      # Simple scan with basic output
  node image-scanner.js --mode summary     # Summary report with recommendations
  node image-scanner.js --csv              # Generate CSV file
  node image-scanner.js --no-preview       # Skip preview display

SUPPORTED FILE TYPES:
  - Vue.js (.vue)
  - HTML (.html)
  - JavaScript (.js, .jsx)
  - TypeScript (.ts, .tsx)

MODES:
  simple        - Quick scan focusing on core attributes (src, width, height, loading)
  comprehensive - Detailed analysis with all attributes and statistics
  summary       - Summary report with recommendations and insights
`);
}

function parseArgs(): ScanOptions {
  const args = process.argv.slice(2);
  const options: ScanOptions = {
    mode: "comprehensive",
    generateCSV: false,
    generateJSON: true,
    showPreview: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--help":
        showHelp();
        process.exit(0);
        break;
      case "--mode":
        options.mode =
          (args[++i] as "simple" | "comprehensive" | "summary") ||
          "comprehensive";
        break;
      case "--csv":
        options.generateCSV = true;
        break;
      case "--no-json":
        options.generateJSON = false;
        break;
      case "--no-preview":
        options.showPreview = false;
        break;
    }
  }

  return options;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Note: This file is designed to be imported as a module
// The main execution is handled by the CSA CLI

// Export for use as module
export {
  scanImages,
  findFiles,
  extractImageTags,
  processVueFile,
  processHtmlFile,
  processJsFile,
  generateCSVFile,
  generateSummaryReport,
  type ImageTag,
  type ScanOptions,
  type ScanReport,
};
