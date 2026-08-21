export const metadata = {
  title: "Política de Privacidade — Barbearia Bruno Silva",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold">Legal</p>
      <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
        Política de Privacidade
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Última atualização: agosto de 2026.</p>

      <div className="mt-10 space-y-8 text-muted-foreground [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <section>
          <h2>1. Quem somos</h2>
          <p>
            Este site é operado pela Barbearia Bruno Silva (Rua 25 de Março, 351 — Limeira/SP)
            para permitir que clientes agendem horários, comprem produtos e acompanhem seus
            atendimentos, e para que os barbeiros parceiros gerenciem sua agenda.
          </p>
        </section>

        <section>
          <h2>2. Quais dados coletamos</h2>
          <p>Dependendo de como você usa o site, podemos coletar:</p>
          <ul>
            <li>Nome, telefone e CPF (para clientes) usados no cadastro e login.</li>
            <li>E-mail e senha (para barbeiros e administradores).</li>
            <li>Dados de agendamento: serviço escolhido, data, horário, valor e forma de pagamento.</li>
            <li>Dados de pagamento processados pelo Mercado Pago (nós não armazenamos número de cartão).</li>
            <li>Fotos e comentários publicados voluntariamente na área de Comunidade e em avaliações.</li>
            <li>Foto de perfil, se você optar por enviar uma.</li>
          </ul>
        </section>

        <section>
          <h2>3. Como usamos seus dados</h2>
          <ul>
            <li>Criar e gerenciar seus agendamentos e sua conta.</li>
            <li>Processar pagamentos via Pix (Mercado Pago).</li>
            <li>Enviar lembretes e avisos sobre seus agendamentos por WhatsApp.</li>
            <li>Mostrar seu nome e foto em avaliações e posts que você mesmo publicar.</li>
            <li>Calcular repasses e comissões entre a barbearia e os barbeiros parceiros.</li>
          </ul>
        </section>

        <section>
          <h2>4. Integração com o Google Calendar</h2>
          <p>
            Barbeiros podem, de forma opcional, conectar sua conta do Google em Painel do
            barbeiro → Horários. Ao autorizar, criamos e removemos automaticamente eventos na
            agenda do Google Calendar do barbeiro correspondentes aos agendamentos feitos pelos
            clientes — só para manter a agenda pessoal do barbeiro atualizada. Não lemos outros
            eventos da agenda do barbeiro, não acessamos e-mails, e não compartilhamos esses dados
            com terceiros. O barbeiro pode desconectar essa integração a qualquer momento na
            própria tela de Horários ou revogando o acesso diretamente em
            myaccount.google.com/permissions.
          </p>
        </section>

        <section>
          <h2>5. Com quem compartilhamos dados</h2>
          <ul>
            <li>Mercado Pago, para processar pagamentos via Pix.</li>
            <li>Meta/WhatsApp Business, para envio de lembretes e notificações.</li>
            <li>Google, apenas para a sincronização de agenda descrita acima, e apenas para barbeiros que optarem por conectar.</li>
            <li>Supabase, nosso provedor de banco de dados e autenticação, que armazena os dados descritos acima.</li>
          </ul>
          <p>Não vendemos nem compartilhamos seus dados para fins de publicidade de terceiros.</p>
        </section>

        <section>
          <h2>6. Seus direitos</h2>
          <p>
            Você pode pedir a correção ou exclusão dos seus dados a qualquer momento entrando em
            contato pelos canais abaixo. Clientes e barbeiros também podem editar telefone, e-mail
            e foto de perfil diretamente em "Minha conta" dentro do site.
          </p>
        </section>

        <section>
          <h2>7. Contato</h2>
          <p>
            Dúvidas sobre esta política ou sobre seus dados? Fale com a gente pelo WhatsApp{" "}
            <a href="https://wa.me/5519998936840" className="text-gold hover:underline">
              (19) 99893-6840
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
