import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
export const editorExtensions = () => [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    link: false,
    underline: false,
    trailingNode: false,
  }),
  Placeholder.configure({ placeholder: 'Start writing your post...' }),
];
