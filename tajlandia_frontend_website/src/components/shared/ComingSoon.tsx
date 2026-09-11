import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/constants/routes";

type ComingSoonProps = {
  title: string;
  description: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="flex flex-1 items-center py-24">
      <Container className="max-w-2xl text-center">
        <SectionHeading>{title}</SectionHeading>
        <p className="mb-8 text-lg text-muted">{description}</p>
        <Button href={routes.home}>Back to Home</Button>
      </Container>
    </section>
  );
}
