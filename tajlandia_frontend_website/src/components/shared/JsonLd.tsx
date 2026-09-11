import { serializeJsonLd } from "@/lib/seo/metadata";

type JsonLdProps = {
  data: unknown;
  nonce?: string;
};

export function JsonLd({ data, nonce }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
