"use client";

import { ArrowRight, CircleCheck, Mail, MessageCircle, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { strings } from "@/i18n";
import { isEmail } from "@/lib/validation";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

/** Contact form (sits inside the page card). No contact endpoint exists yet, so submission is acknowledged client-side (see ASSUMPTIONS.md). */
export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const c = strings.contactPage;

  const validate = (): Errors => ({
    name: values.name.trim().length < 2 ? strings.validation.required(strings.fields.name) : undefined,
    email: !isEmail(values.email) ? strings.validation.email : undefined,
    message:
      values.message.trim().length < 10 ? strings.validation.minLength(strings.fields.message, 10) : undefined,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start justify-center gap-2 p-2" role="status">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck size={18} aria-hidden />
        </span>
        <h2 className="text-lg">{c.sentTitle}</h2>
        <p className="text-sm text-muted">{c.sentBody}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-1"
          onClick={() => {
            setValues({ name: "", email: "", message: "" });
            setSent(false);
          }}
        >
          {c.sendAnother}
        </Button>
      </div>
    );
  }

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-4 md:p-2">
      <div>
        <h2 className="text-2xl">{c.formTitle}</h2>
        <p className="mt-1 text-sm text-muted">{c.formLead}</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <Input
          label={strings.fields.name}
          hideLabel
          placeholder={c.namePlaceholder}
          icon={<UserRound size={16} strokeWidth={1.6} />}
          value={values.name}
          onChange={set("name")}
          error={errors.name}
          autoComplete="name"
          className="h-11"
        />
        <Input
          label={strings.fields.email}
          hideLabel
          placeholder={c.emailPlaceholder}
          icon={<Mail size={16} strokeWidth={1.6} />}
          type="email"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          className="h-11"
        />
        <Textarea
          label={strings.fields.message}
          hideLabel
          placeholder={c.messagePlaceholder}
          icon={<MessageCircle size={16} strokeWidth={1.6} />}
          value={values.message}
          onChange={set("message")}
          error={errors.message}
          rows={5}
          className="pt-2.5"
        />
        <Button type="submit" size="lg" className="mt-1 self-start" rightIcon={<ArrowRight size={16} aria-hidden />}>
          {c.send}
        </Button>
      </form>
    </div>
  );
}
