// src/features/preview/utils/calloutParser.tsx
import React from 'react';

export interface ParsedCallout {
  isCallout: boolean;
  type: string;
  title: string;
  isFoldable: boolean;
  defaultFolded: boolean;
  cleanedChildren: React.ReactNode;
}

const CALLOUT_REGEX = /^\[!([a-zA-Z]+)\]([+-]?)(?:[ \t]+([^\n\r]*))?/;

export function parseCalloutFromBlockquote(children: React.ReactNode): ParsedCallout {
  const notCallout: ParsedCallout = {
    isCallout: false,
    type: 'note',
    title: '',
    isFoldable: false,
    defaultFolded: false,
    cleanedChildren: children,
  };

  const childArray = React.Children.toArray(children);
  const meaningfulChildren = childArray.filter(
    (child) => !(typeof child === 'string' && child.trim() === '')
  );
  if (meaningfulChildren.length === 0) return notCallout;

  const firstChild = meaningfulChildren[0];
  if (!React.isValidElement(firstChild)) return notCallout;

  // ReactMarkdown blockquote typically wraps first block in a <p> (or DirectedComponent wrapping <p>)
  const firstChildProps = (firstChild.props as Record<string, any>) || {};
  const innerChildren = React.Children.toArray(firstChildProps.children);
  if (innerChildren.length === 0) return notCallout;

  const firstTextIndex = innerChildren.findIndex(
    (child) => !(typeof child === 'string' && child.trim() === '')
  );
  if (firstTextIndex === -1) return notCallout;

  const firstTextItem = innerChildren[firstTextIndex];
  if (typeof firstTextItem !== 'string') return notCallout;

  const match = firstTextItem.trimStart().match(CALLOUT_REGEX);
  if (!match) return notCallout;

  const type = match[1].toLowerCase();
  const foldMarker = match[2];
  const isFoldable = foldMarker === '-' || foldMarker === '+';
  const defaultFolded = foldMarker === '-';
  const title = (match[3] || '').trim();

  // Strip the [!TYPE] marker line from the text
  const matchFullLength = match[0].length;
  const leadingWhitespaceMatch = firstTextItem.match(/^\s*/);
  const leadingOffset = leadingWhitespaceMatch ? leadingWhitespaceMatch[0].length : 0;
  const totalPrefixLength = leadingOffset + matchFullLength;

  const remainingFirstText = firstTextItem.slice(totalPrefixLength).replace(/^\r?\n/, '');

  let newInnerChildren: React.ReactNode[];
  if (remainingFirstText.trim().length > 0) {
    newInnerChildren = [remainingFirstText, ...innerChildren.slice(firstTextIndex + 1)];
  } else {
    // If the next child is a <br />, skip it as well
    let startIndex = firstTextIndex + 1;
    const maybeBr = innerChildren[startIndex];
    if (startIndex < innerChildren.length && React.isValidElement(maybeBr) && maybeBr.type === 'br') {
      startIndex += 1;
    }
    newInnerChildren = innerChildren.slice(startIndex);
    if (newInnerChildren.length > 0 && typeof newInnerChildren[0] === 'string') {
      const trimmedLeading = newInnerChildren[0].replace(/^\r?\n/, '');
      newInnerChildren =
        trimmedLeading.length > 0
          ? [trimmedLeading, ...newInnerChildren.slice(1)]
          : newInnerChildren.slice(1);
    }
  }

  let newFirstChild: React.ReactNode = null;
  if (newInnerChildren.length > 0) {
    newFirstChild = React.cloneElement(
      firstChild as React.ReactElement<Record<string, unknown>>,
      {
        ...firstChildProps,
        children: newInnerChildren,
      }
    );
  }

  const cleanedChildren = [
    ...(newFirstChild ? [newFirstChild] : []),
    ...meaningfulChildren.slice(1),
  ];

  return {
    isCallout: true,
    type,
    title,
    isFoldable,
    defaultFolded,
    cleanedChildren,
  };
}
