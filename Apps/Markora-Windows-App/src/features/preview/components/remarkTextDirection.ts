import { visit } from 'unist-util-visit';

type DirectiveNode = {
  type: string;
  name?: string;
  data?: {
hName?: string;
hProperties?: Record<string, unknown>;
  };
};

export function remarkTextDirection() {
  return function transformer(tree: unknown) {
visit(tree as any, (node: DirectiveNode) => {
const isDirective =
node.type === 'containerDirective' ||
node.type === 'leafDirective' ||
node.type === 'textDirective';

if (!isDirective) return;
if (node.name !== 'rtl' && node.name !== 'ltr') return;

const direction = node.name;

node.data = node.data || {};
node.data.hName = 'div';
node.data.hProperties = {
dir: direction,
className: ['markdown-direction', `markdown-direction-${direction}`],
'data-manual-direction': direction,
};
});
  };
}
