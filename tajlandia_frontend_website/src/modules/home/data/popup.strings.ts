import type { Locale } from "@/lib/i18n/locale";

type StepCopy = {
  eyebrow: string;
  /** One or two lines; a second line is split with a line break. */
  title: [string] | [string, string];
  description: string;
};

export type PopupStrings = {
  steps: Record<"intro" | "name" | "email" | "phone" | "message" | "success", StepCopy>;
  imageAlt: string;
  close: string;
  firstName: string;
  firstNamePlaceholder: string;
  lastName: string;
  lastNamePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  phone: string;
  optional: string;
  countryCode: string;
  message: string;
  messagePlaceholder: string;
  back: string;
  sending: string;
  send: string;
  continue: string;
  maybeLater: string;
  submitted: string;
  continueExploring: string;
  errors: { email: string; sendFailed: string; phone: (digits: number) => string };
};

export const popupStrings: Record<Locale, PopupStrings> = {
  en: {
    steps: {
      intro: {
        eyebrow: "LET’S TALK",
        title: ["Have a question about", "Tajlandia?"],
        description:
          "Whether you’re exploring a location, looking for a plot, or simply curious, we’d love to hear from you.",
      },
      name: {
        eyebrow: "NICE TO MEET YOU",
        title: ["What’s your name?"],
        description: "Please introduce yourself so we know who we’re speaking with.",
      },
      email: {
        eyebrow: "STAY IN TOUCH",
        title: ["Where can we reach you?"],
        description: "We’ll use this only to respond to your enquiry.",
      },
      phone: {
        eyebrow: "ONE MORE WAY TO REACH YOU",
        title: ["What’s your contact number?"],
        description: "Useful for time sensitive updates or Whatsapp inquiry.",
      },
      message: {
        eyebrow: "HOW WE CAN HELP",
        title: ["Tell us little about what you’re", "looking for."],
        description: "Specify preferred province, zone, or general questions.",
      },
      success: {
        eyebrow: "MESSAGE SENT",
        title: ["Thanks for reaching out."],
        description:
          "We’ve received your message and our team will get back to you within 24 hours.",
      },
    },
    imageAlt: "Temple spires in Thailand",
    close: "Close Get In Touch popup",
    firstName: "First Name",
    firstNamePlaceholder: "Enter your first name",
    lastName: "Last Name",
    lastNamePlaceholder: "Enter your last name",
    email: "Email Id",
    emailPlaceholder: "Enter your email id",
    phone: "Phone Number",
    optional: "(optional)",
    countryCode: "Country code",
    message: "Write your message",
    messagePlaceholder: "Enter your message...",
    back: "← Back",
    sending: "Sending...",
    send: "Send Message",
    continue: "Continue",
    maybeLater: "Maybe later",
    submitted: "Your enquiry has been submitted successfully.",
    continueExploring: "Continue Exploring",
    errors: {
      email: "Please enter a valid email address.",
      sendFailed: "Unable to send your message right now. Please try again.",
      phone: (digits) => `Enter a ${digits}-digit phone number, or leave it empty.`,
    },
  },
  pl: {
    steps: {
      intro: {
        eyebrow: "POROZMAWIAJMY",
        title: ["Masz pytanie o", "Tajlandię?"],
        description:
          "Czy przeglądasz lokalizacje, szukasz działki, czy po prostu jesteś ciekaw – chętnie Ci odpowiemy.",
      },
      name: {
        eyebrow: "MIŁO CIĘ POZNAĆ",
        title: ["Jak masz na imię?"],
        description: "Przedstaw się, abyśmy wiedzieli, z kim rozmawiamy.",
      },
      email: {
        eyebrow: "BĄDŹMY W KONTAKCIE",
        title: ["Gdzie możemy się z Tobą skontaktować?"],
        description: "Użyjemy tego adresu wyłącznie do odpowiedzi na Twoje zapytanie.",
      },
      phone: {
        eyebrow: "JESZCZE JEDEN SPOSÓB KONTAKTU",
        title: ["Jaki jest Twój numer telefonu?"],
        description: "Przydatny przy pilnych informacjach lub zapytaniu przez WhatsApp.",
      },
      message: {
        eyebrow: "JAK MOŻEMY POMÓC",
        title: ["Napisz nam krótko, czego", "szukasz."],
        description: "Podaj preferowaną prowincję, strefę lub zadaj ogólne pytanie.",
      },
      success: {
        eyebrow: "WIADOMOŚĆ WYSŁANA",
        title: ["Dziękujemy za wiadomość."],
        description:
          "Otrzymaliśmy Twoją wiadomość, a nasz zespół odpowie w ciągu 24 godzin.",
      },
    },
    imageAlt: "Iglice świątyń w Tajlandii",
    close: "Zamknij okno kontaktu",
    firstName: "Imię",
    firstNamePlaceholder: "Wpisz swoje imię",
    lastName: "Nazwisko",
    lastNamePlaceholder: "Wpisz swoje nazwisko",
    email: "Adres e-mail",
    emailPlaceholder: "Wpisz swój adres e-mail",
    phone: "Numer telefonu",
    optional: "(opcjonalnie)",
    countryCode: "Kierunkowy kraju",
    message: "Twoja wiadomość",
    messagePlaceholder: "Wpisz swoją wiadomość...",
    back: "← Wstecz",
    sending: "Wysyłanie...",
    send: "Wyślij wiadomość",
    continue: "Dalej",
    maybeLater: "Może później",
    submitted: "Twoje zapytanie zostało wysłane.",
    continueExploring: "Wróć do przeglądania",
    errors: {
      email: "Wpisz prawidłowy adres e-mail.",
      sendFailed: "Nie udało się teraz wysłać wiadomości. Spróbuj ponownie.",
      phone: (digits) => `Wpisz ${digits}-cyfrowy numer telefonu lub zostaw to pole puste.`,
    },
  },
};
