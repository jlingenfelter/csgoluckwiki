const fs = require('fs');
const path = require('path');

// Helper function to extract const values from frontmatter
function extractConstValue(content, constName) {
  // Match const declarations with either single or double quotes
  // Handle escaped quotes within strings
  // Pattern: const name = 'string with \'escaped quotes\'' or "string with \"escaped quotes\""

  // Try single quoted strings first (allows escaped single quotes inside)
  let match = content.match(new RegExp(`const\\s+${constName}\\s*=\\s*'((?:[^'\\\\]|\\\\.)*)'`, 's'));
  if (match) {
    // Unescape the single quotes
    return match[1].replace(/\\'/g, "'");
  }

  // Try double quoted strings (allows escaped double quotes inside)
  match = content.match(new RegExp(`const\\s+${constName}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's'));
  if (match) {
    // Unescape the double quotes
    return match[1].replace(/\\"/g, '"');
  }

  return null;
}

// Helper function to extract FAQ array from frontmatter
function extractFaqArray(content) {
  const startIdx = content.indexOf('const faqs = [');
  if (startIdx === -1) return null;

  let bracketCount = 0;
  let endIdx = startIdx + 'const faqs = '.length;

  for (let i = endIdx; i < content.length; i++) {
    const char = content[i];
    if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const faqContent = content.substring(startIdx, endIdx);

  try {
    // Extract array content between [ and ]
    const arrayMatch = faqContent.match(/\[([\s\S]*)\]/);
    if (!arrayMatch) return null;

    const arrayContentStr = arrayMatch[1];
    const faqs = [];

    // Parse each FAQ object - handle both single and double quotes, with escaped quotes inside
    // Pattern: { question: 'text with \'escaped\' quotes', answer: 'text with \'escaped\' quotes', }
    const objectRegex = /\{\s*question:\s*['"](.+?)['"]\s*,\s*answer:\s*['"](.+?)['"]\s*,?\s*\}/gs;
    let match;

    while ((match = objectRegex.exec(arrayContentStr)) !== null) {
      let question = match[1];
      let answer = match[2];

      // Unescape single quotes
      question = question.replace(/\\'/g, "'");
      answer = answer.replace(/\\'/g, "'");

      faqs.push({
        question,
        answer
      });
    }

    return faqs.length > 0 ? faqs : null;
  } catch (e) {
    // If parsing fails, return null
    return null;
  }
}

// Helper function to extract h1 text from content
function extractH1(content) {
  const h1Match = content.match(/<h1>([^<]+)<\/h1>/);
  return h1Match ? h1Match[1] : null;
}

// Helper function to extract first paragraph after h1
function extractIntro(content) {
  // Find the first p tag after intro-section opening
  let introMatch = content.match(/<section class="intro-section">\s*<p>([\s\S]*?)<\/p>/);
  if (introMatch) {
    return introMatch[1].trim();
  }

  // If no intro-section, look for first p tag after h1
  const h1Match = content.match(/<h1>[^<]+<\/h1>\s*<p>([\s\S]*?)<\/p>/);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return null;
}

// Main extraction function
function extractGuideMetadata(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Split frontmatter from rest
    const parts = content.split('---');
    const frontmatter = parts[1];
    const htmlContent = parts[2] || '';

    const slug = filename.replace('.astro', '');
    const title = extractConstValue(frontmatter, 'title');
    const description = extractConstValue(frontmatter, 'description');
    const heading = extractH1(htmlContent);
    const intro = extractIntro(htmlContent);
    const faqs = extractFaqArray(frontmatter);

    return {
      slug,
      title,
      description,
      heading,
      intro,
      ...(faqs && { faqs })
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

// Main execution
const guidesDir = path.join(__dirname, 'src', 'pages', 'guides');
const outputDir = path.join(__dirname, 'src', 'data', 'guides');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all .astro files
const files = fs.readdirSync(guidesDir)
  .filter(f => f.endsWith('.astro'))
  .sort();

console.log(`Found ${files.length} guide files\n`);

let successCount = 0;
files.forEach(filename => {
  const filePath = path.join(guidesDir, filename);
  const metadata = extractGuideMetadata(filePath, filename);

  if (metadata) {
    const outputPath = path.join(outputDir, `${metadata.slug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`✓ ${metadata.slug}.json`);
    successCount++;
  } else {
    console.log(`✗ Failed to process ${filename}`);
  }
});

console.log(`\nSuccessfully processed ${successCount}/${files.length} files`);
