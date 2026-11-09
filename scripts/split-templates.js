const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/app/pages/dynamic-pages/sections/course/course.component.ts',
  'src/app/pages/dynamic-pages/sections/classes/classes.component.ts',
  'src/app/pages/dynamic-pages/sections/banner/banner-section.component.ts',
  'src/app/pages/dynamic-pages/sections/limited-seats/limited-seats.component.ts',
  'src/app/pages/dynamic-pages/sections/parents-say/parents-say.component.ts',
  'src/app/pages/dynamic-pages/sections/academic-results/academic-results.component.ts',
  'src/app/pages/dynamic-pages/sections/right-school/right-school.component.ts',
  'src/app/pages/dynamic-pages/sections/why-us/why-us.ts',
  'src/app/pages/dynamic-pages/sections/facilities/facilities.component.ts',
  'src/app/pages/dynamic-pages/sections/faq/faq-section.component.ts',
  'src/app/components/leads-table/leads-table.component.ts',
  'src/app/pages/cities/city-list/city-list.component.ts',
  'src/app/pages/branches/branch-list/branch-list.component.ts',
  'src/app/pages/classes/class-list/class-list.component.ts',
  'src/app/pages/cities/add-city/add-city.component.ts',
  'src/app/pages/cities/edit-city/edit-city.component.ts',
  'src/app/pages/branches/add-branch/add-branch.component.ts',
  'src/app/pages/branches/edit-branch/edit-branch.component.ts',
  'src/app/pages/classes/add-class/add-class.component.ts',
  'src/app/pages/classes/edit-class/edit-class.component.ts',
];

for (const relPath of targetFiles) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping non-existent: ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  // Match template: ` ... `
  const templateRegex = /template:\s*`([\s\S]*?)`\s*,\s*(?:\n\s*styles:)?/m;
  const match = content.match(templateRegex);

  if (!match) {
    console.log(`No inline template found in: ${relPath}`);
    continue;
  }

  const htmlContent = match[1].trim() + '\n';
  const parsed = path.parse(fullPath);
  // Base name e.g. 'course.component' or 'why-us'
  const htmlFileName = parsed.name.endsWith('.component')
    ? `${parsed.name}.html`
    : `${parsed.name}.component.html`;

  const htmlFullPath = path.join(parsed.dir, htmlFileName);

  fs.writeFileSync(htmlFullPath, htmlContent, 'utf8');

  // Replace template with templateUrl
  const updatedContent = content.replace(
    /template:\s*`[\s\S]*?`\s*,/,
    `templateUrl: './${htmlFileName}',`
  );

  fs.writeFileSync(fullPath, updatedContent, 'utf8');
  console.log(`Extracted: ${htmlFileName} from ${parsed.base}`);
}
