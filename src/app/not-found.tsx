import type { Metadata } from "next";
import Link from "next/link";
import { UsernameForm } from "@/components/UsernameForm";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

/** 404: endereço que não existe no site. */
export default function NotFound() {
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-widest text-indigo-700 dark:text-indigo-400">ERRO 404</p>
        <h1 className="text-3xl font-bold tracking-tight">Essa página não existe</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          O endereço pode estar errado ou a página mudou de lugar. Para ver um recap, digite um
          username do Last.fm:
        </p>
      </div>
      <UsernameForm />
      <p>
        <Link href="/" className="font-medium text-indigo-700 underline dark:text-indigo-400">
          Voltar ao início
        </Link>
      </p>
    </main>
  );
}
