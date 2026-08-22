import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HorariosEditor from "@/components/HorariosEditor";
import ExcecoesEditor from "@/components/ExcecoesEditor";
import BloqueiosEditor from "@/components/BloqueiosEditor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function HorariosBarbeiroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hoje = new Date().toISOString().slice(0, 10);
  const [{ data: barbeiro }, { data: horarios }, { data: excecoes }, { data: bloqueios }] = await Promise.all([
    supabase.from("barbeiros").select("profile_id").eq("profile_id", user.id).single(),
    supabase.from("barbeiro_horarios").select("*").eq("barbeiro_id", user.id).order("dia_semana"),
    supabase.from("barbeiro_excecoes").select("*").eq("barbeiro_id", user.id).gte("data", hoje).order("data"),
    supabase.from("barbeiro_bloqueios").select("*").eq("barbeiro_id", user.id).or(`data.is.null,data.gte.${hoje}`),
  ]);

  if (!barbeiro) redirect("/");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl tracking-wide text-foreground">
        Meus horários
      </h1>

      <Tabs defaultValue="horarios" className="mt-8">
        <TabsList className="w-full max-w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="horarios">Horário semanal</TabsTrigger>
          <TabsTrigger value="excecoes">Folgas e exceções</TabsTrigger>
          <TabsTrigger value="bloqueios">Almoço e compromissos</TabsTrigger>
        </TabsList>

        <TabsContent value="horarios">
          <p className="text-muted-foreground">
            Escolha os dias em que você atende e o horário de início/fim de cada
            um. Os clientes só vão poder agendar dentro dessa janela.
          </p>
          <HorariosEditor barbeiroId={user.id} horariosIniciais={horarios ?? []} />
        </TabsContent>

        <TabsContent value="excecoes">
          <p className="text-muted-foreground">
            Vai tirar uma folga num dia específico (ex: 10/08) ou tem um
            compromisso que muda seu horário só naquele dia (ex: 25/07)? Cadastre
            aqui — isso tem prioridade sobre o horário padrão da semana.
          </p>
          <ExcecoesEditor barbeiroId={user.id} excecoesIniciais={excecoes ?? []} />
        </TabsContent>

        <TabsContent value="bloqueios">
          <p className="text-muted-foreground">
            Bloqueie uma janela de horário toda semana (ex: almoço 12h–13h) ou em
            uma data específica (ex: dentista às 15h). Esses horários somem da
            agenda automaticamente, sem precisar desligar o dia inteiro.
          </p>
          <BloqueiosEditor barbeiroId={user.id} bloqueiosIniciais={bloqueios ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
