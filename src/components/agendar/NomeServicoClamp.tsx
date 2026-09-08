"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Nome do serviço limitado a 2 linhas, com um botão "Ler mais" que só
 * aparece quando o nome realmente não coube (detectado comparando a altura
 * real do texto com a altura visível) - evita cortar nomes longos (ex:
 * "Cabelo Pai/Filho (até 10 anos)") sem poluir os nomes curtos com um botão
 * que não serve pra nada.
 */
export default function NomeServicoClamp({ nome }: { nome: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expandido, setExpandido] = useState(false);
  const [temMais, setTemMais] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expandido) return;
    setTemMais(el.scrollHeight > el.clientHeight + 1);
  }, [nome, expandido]);

  return (
    <div>
      <p
        ref={ref}
        className={expandido ? "font-semibold text-foreground" : "line-clamp-2 font-semibold text-foreground"}
      >
        {nome}
      </p>
      {temMais && !expandido && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpandido(true);
          }}
          className="mt-0.5 text-xs font-medium text-gold hover:underline"
        >
          Ler mais
        </button>
      )}
    </div>
  );
}
