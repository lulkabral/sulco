import type { ErrorCode } from "@/lib/lastfm/types";
import { RetryButton } from "./RetryButton";
import { UsernameForm } from "./UsernameForm";

type Props = {
  code: ErrorCode;
  username?: string;
  /** Ação de "Tentar de novo" feita no navegador (ex.: mês fechado). Sem ela, recarrega do servidor. */
  onRetry?: () => void;
};

const CONTENT: Record<ErrorCode, { title: string; text: string }> = {
  BAD_REQUEST: {
    title: "Esse username não parece válido",
    text: "Usernames do Last.fm têm de 2 a 15 caracteres: letras, números, _ ou -, começando por letra.",
  },
  USER_NOT_FOUND: {
    title: "Não achamos esse usuário no Last.fm",
    text: "Confira se o username está escrito certo.",
  },
  PRIVATE_PROFILE: {
    title: "Esse perfil deixa o histórico privado",
    text: "Para usar o site, desmarque a opção de esconder as músicas recentes nas configurações de privacidade do Last.fm.",
  },
  RATE_LIMITED: {
    title: "Muitas consultas ao mesmo tempo",
    text: "O Last.fm pediu para irmos com calma. Espere alguns segundos e tente de novo.",
  },
  LASTFM_DOWN: {
    title: "O Last.fm não respondeu",
    text: "Pode ser instabilidade do lado deles. Espere alguns segundos e tente de novo.",
  },
};

/** Mensagem para cada um dos nossos códigos de erro. */
export function ErrorState({ code, username, onRetry }: Props) {
  const { title, text } = CONTENT[code];
  const askUsername = code === "BAD_REQUEST" || code === "USER_NOT_FOUND";
  const canRetry = code === "RATE_LIMITED" || code === "LASTFM_DOWN";

  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{text}</p>
      </div>
      {askUsername && <UsernameForm defaultValue={username} />}
      {canRetry &&
        (onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Tentar de novo
          </button>
        ) : (
          <RetryButton />
        ))}
    </div>
  );
}
