const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const UI_JS_PATH = path.join(DIST_DIR, 'ui.js');
const UI_HTML_SRC_PATH = path.resolve(__dirname, '../ui.html');
const UI_HTML_DIST_PATH = path.join(DIST_DIR, 'ui.html');

try {
  // Read the HTML file
  let html = fs.readFileSync(UI_HTML_SRC_PATH, 'utf8');

  // Read the compiled JS
  const js = fs.readFileSync(UI_JS_PATH, 'utf8');

  // Replace the script tag with inline JS
  // We look for <script src="dist/ui.js"></script> and replace it
  const SCRIPT_TAG_REGEX = /<script src="dist\/ui\.js"><\/script>/;

  if (SCRIPT_TAG_REGEX.test(html)) {
    html = html.replace(SCRIPT_TAG_REGEX, `<script>\n${js}\n</script>`);
    console.log('Successfully inlined ui.js into ui.html');
  } else {
    // Fallback: append to body if tag not found (though it should be there)
    // Also handle the debug script we added
    console.warn('Could not find <script src="dist/ui.js"></script>, appending script to body.');
    html = html.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
  }

  // Write the new HTML file to dist
  fs.writeFileSync(UI_HTML_DIST_PATH, html);
  console.log(`Wrote bundled HTML to ${UI_HTML_DIST_PATH}`);

} catch (error) {
  console.error('Error bundling UI:', error);
  process.exit(1);
}
