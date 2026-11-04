import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";

type MarkdownProps = {
  /** Markdown from the admin editor (GitHub-flavoured: lists, ~~strike~~, tables…). */
  children: string;
  className?: string;
};

/** Links are kept only for http(s), mailto and site-relative URLs. */
export function safeMarkdownUrl(url: string): string {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("#")) return url;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" || protocol === "mailto:"
      ? url
      : "";
  } catch {
    return "";
  }
}

// react-markdown passes its AST `node` to every component; keep it off the DOM.
function domProps<T extends { node?: unknown }>({ node, ...props }: T) {
  void node;
  return props;
}

const components: Components = {
  h1: (props) => (
    <h2
      {...domProps(props)}
      className="text-[17px] font-semibold leading-snug text-[#1c1c1c] sm:text-[18px]"
    />
  ),
  h2: (props) => (
    <h2
      {...domProps(props)}
      className="text-[17px] font-semibold leading-snug text-[#1c1c1c] sm:text-[18px]"
    />
  ),
  h3: (props) => (
    <h3
      {...domProps(props)}
      className="text-[16px] font-semibold leading-snug text-[#1c1c1c]"
    />
  ),
  h4: (props) => (
    <h4
      {...domProps(props)}
      className="text-[15px] font-semibold leading-snug text-[#1c1c1c]"
    />
  ),
  h5: (props) => (
    <h5
      {...domProps(props)}
      className="text-[15px] font-semibold leading-snug text-[#1c1c1c]"
    />
  ),
  h6: (props) => (
    <h6
      {...domProps(props)}
      className="text-[15px] font-semibold leading-snug text-[#1c1c1c]"
    />
  ),
  strong: (props) => (
    <strong {...domProps(props)} className="font-semibold text-[#1c1c1c]" />
  ),
  ul: (props) => <ul {...domProps(props)} className="list-disc space-y-1.5 pl-5" />,
  ol: (props) => <ol {...domProps(props)} className="list-decimal space-y-1.5 pl-5" />,
  blockquote: (props) => (
    <blockquote
      {...domProps(props)}
      className="border-l-2 border-brand-red/40 pl-4 italic"
    />
  ),
  code: (props) => (
    <code
      {...domProps(props)}
      className="rounded bg-[#f4f6f8] px-1 py-0.5 text-[0.93em]"
    />
  ),
  pre: (props) => (
    <pre
      {...domProps(props)}
      className="overflow-x-auto rounded-[10px] bg-[#f4f6f8] p-4 [&_code]:bg-transparent [&_code]:p-0"
    />
  ),
  hr: () => <hr className="border-[#eef1f4]" />,
  table: (props) => (
    <div className="overflow-x-auto">
      <table {...domProps(props)} className="w-full border-collapse text-left" />
    </div>
  ),
  th: (props) => (
    <th
      {...domProps(props)}
      className="border-b border-[#eef1f4] px-3 py-2 font-semibold text-[#1c1c1c]"
    />
  ),
  td: (props) => (
    <td {...domProps(props)} className="border-b border-[#eef1f4] px-3 py-2" />
  ),
  a: ({ node, href = "", ...props }) => {
    void node;
    const external = /^(https?:|mailto:)/.test(href);
    return (
      <a
        {...props}
        href={href}
        className="text-[#1c1c1c] underline underline-offset-2"
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
      />
    );
  },
  // Admin content has no business embedding images or raw HTML in the body.
  img: () => null,
};

/**
 * Renders admin Markdown in the site's text styles. Raw HTML is not rendered
 * (react-markdown's default), and unsafe link protocols are dropped.
 * Spacing: blocks sit 16px apart, headings open a new 32px section.
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "break-words [&>*+*]:mt-4 [&>:is(h1,h2,h3,h4,h5,h6)+*]:mt-3 [&>:is(h1,h2,h3,h4,h5,h6):not(:first-child)]:mt-8",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        urlTransform={safeMarkdownUrl}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
