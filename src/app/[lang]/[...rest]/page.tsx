import { notFound } from "next/navigation";

// Qualquer endereço que não existe cai aqui e mostra a 404 na língua da página
// (o layout principal fica em [lang], então a 404 precisa estar dentro dele).
// `instant = false`: a página só existe para responder 404, não tem o que pré-carregar.
export const instant = false;

export default function CatchAll() {
  notFound();
}
