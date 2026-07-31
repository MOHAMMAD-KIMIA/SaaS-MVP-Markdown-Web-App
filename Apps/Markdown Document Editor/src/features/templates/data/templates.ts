import { Template } from '../../../types/common.types';
import { generateId } from '../../../lib/utils/ids';

export const templates: Template[] = [
  {
    id: generateId(),
    name: 'Blog Post',
    description: 'A standard blog post template with sections',
    category: 'Writing',
    content: `# Blog Post Title

*Published on [Date]*

## Introduction

Start with a compelling introduction that hooks the reader...

## Main Content

### Section 1

Your main points go here...

### Section 2

Continue developing your ideas...

## Conclusion

Wrap up your post with key takeaways...

---

*Tags: #tag1 #tag2 #tag3*
`,
  },
  {
    id: generateId(),
    name: 'README',
    description: 'Project README template for GitHub repositories',
    category: 'Documentation',
    content: `# Project Name

Brief description of your project

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install project-name
\`\`\`

## Usage

\`\`\`javascript
import { something } from 'project-name';

// Example usage
\`\`\`

## Documentation

[Link to full documentation](https://docs.example.com)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) file for details
`,
  },
  {
    id: generateId(),
    name: 'Documentation',
    description: 'Technical documentation template',
    category: 'Documentation',
    content: `# Documentation

## Overview

Provide a high-level overview of the system or feature.

## Getting Started

### Prerequisites

- Requirement 1
- Requirement 2
- Requirement 3

### Quick Start

Step-by-step guide to get started...

## API Reference

### Function Name

\`\`\`typescript
function example(param: string): void
\`\`\`

**Parameters:**
- \`param\` (string): Description

**Returns:**
- void

## Examples

### Example 1

\`\`\`typescript
// Code example
\`\`\`

## Troubleshooting

### Common Issue 1

Solution...

## FAQ

**Q: Question?**
A: Answer...
`,
  },
  {
    id: generateId(),
    name: 'Meeting Notes',
    description: 'Template for capturing meeting notes',
    category: 'Productivity',
    content: `# Meeting Notes

**Date:** [Date]
**Time:** [Time]
**Attendees:** [Names]

## Agenda

1. Topic 1
2. Topic 2
3. Topic 3

## Discussion

### Topic 1

Key points discussed...

### Topic 2

Key points discussed...

## Action Items

- [ ] Task 1 - @Person - Due: [Date]
- [ ] Task 2 - @Person - Due: [Date]
- [ ] Task 3 - @Person - Due: [Date]

## Decisions Made

1. Decision 1
2. Decision 2

## Next Steps

- Next meeting: [Date]
- Follow up items...
`,
  },
  {
    id: generateId(),
    name: 'Research Notes',
    description: 'Template for research and study notes',
    category: 'Education',
    content: `# Research Notes: [Topic]

**Date:** [Date]
**Source:** [Source/Reference]

## Summary

Brief summary of the key findings or concepts...

## Key Points

1. **Point 1**
   - Detail
   - Detail

2. **Point 2**
   - Detail
   - Detail

3. **Point 3**
   - Detail
   - Detail

## Quotes

> "Important quote"
> — Author Name

## Questions

- [ ] Question 1
- [ ] Question 2

## References

1. [Reference 1](url)
2. [Reference 2](url)

## Related Topics

- [[Related Topic 1]]
- [[Related Topic 2]]
`,
  },
  {
    id: generateId(),
    name: 'Technical Spec',
    description: 'Technical specification document template',
    category: 'Engineering',
    content: `# Technical Specification: [Feature Name]

**Author:** [Name]
**Date:** [Date]
**Status:** Draft

## Overview

Brief description of the feature or system.

## Goals

- Goal 1
- Goal 2
- Goal 3

## Non-Goals

- What this spec does NOT cover

## Background

Context and motivation for this work...

## Proposed Solution

### Architecture

\`\`\`mermaid
graph TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
\`\`\`

### Design Details

Detailed design explanation...

### Data Model

\`\`\`typescript
interface DataModel {
  field1: string;
  field2: number;
}
\`\`\`

## Alternatives Considered

### Alternative 1

Pros and cons...

### Alternative 2

Pros and cons...

## Implementation Plan

1. Phase 1: [Description]
2. Phase 2: [Description]
3. Phase 3: [Description]

## Testing Strategy

- Unit tests
- Integration tests
- E2E tests

## Rollout Plan

How will this be deployed and rolled out?

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High | Mitigation strategy |
| Risk 2 | Medium | Mitigation strategy |

## Open Questions

- [ ] Question 1
- [ ] Question 2
`,
  },
];
