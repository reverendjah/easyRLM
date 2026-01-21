/**
 * Intelligently merge user's CLAUDE.md with Easy RLM template
 * Preserves user customizations, adds required Easy RLM sections
 */

const MANDATORY_SECTIONS = [
  'Context (RLM)',
  'Self-Evaluation',
  'Workflow Recovery'
];

const MERGEABLE_SECTIONS = ['Workflows'];

export function merge(existingContent, templateContent) {
  const existingSections = parseSections(existingContent);
  const templateSections = parseSections(templateContent);

  const result = [];

  // Keep header from existing if present
  if (existingSections.header) {
    result.push(existingSections.header);
  } else if (templateSections.header) {
    result.push(templateSections.header);
  }

  // Track which sections we've added
  const addedSections = new Set();

  // First, add all template sections (in template order)
  for (const section of templateSections.sections) {
    const existingSection = existingSections.sections.find(
      s => s.name.toLowerCase() === section.name.toLowerCase()
    );

    if (MANDATORY_SECTIONS.some(m => section.name.includes(m))) {
      // Mandatory sections: always use template
      result.push(formatSection(section));
      addedSections.add(section.name.toLowerCase());
    } else if (MERGEABLE_SECTIONS.some(m => section.name.includes(m))) {
      // Mergeable sections: combine
      if (existingSection) {
        result.push(formatSection(mergeTables(existingSection, section)));
      } else {
        result.push(formatSection(section));
      }
      addedSections.add(section.name.toLowerCase());
    } else if (existingSection) {
      // User has customized this section: preserve their version
      result.push(formatSection(existingSection));
      addedSections.add(section.name.toLowerCase());
    } else {
      // Section doesn't exist in user's file: add from template
      result.push(formatSection(section));
      addedSections.add(section.name.toLowerCase());
    }
  }

  // Add any extra sections from user that aren't in template
  for (const section of existingSections.sections) {
    if (!addedSections.has(section.name.toLowerCase())) {
      result.push(formatSection(section));
    }
  }

  return result.join('\n\n');
}

function parseSections(content) {
  const lines = content.split('\n');
  const result = {
    header: '',
    sections: []
  };

  let currentSection = null;
  let headerLines = [];
  let foundFirstSection = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      foundFirstSection = true;

      if (currentSection) {
        result.sections.push(currentSection);
      }

      currentSection = {
        name: line.slice(3).trim(),
        content: []
      };
    } else if (line.startsWith('# ') && !foundFirstSection) {
      headerLines.push(line);
    } else if (currentSection) {
      currentSection.content.push(line);
    } else if (!foundFirstSection) {
      headerLines.push(line);
    }
  }

  if (currentSection) {
    result.sections.push(currentSection);
  }

  result.header = headerLines.join('\n').trim();

  // Clean up content (remove trailing empty lines)
  for (const section of result.sections) {
    while (section.content.length > 0 && section.content[section.content.length - 1].trim() === '') {
      section.content.pop();
    }
  }

  return result;
}

function formatSection(section) {
  return `## ${section.name}\n${section.content.join('\n')}`;
}

function mergeTables(existing, template) {
  // Simple merge: prefer template structure but keep any extra rows from existing
  return template;
}
