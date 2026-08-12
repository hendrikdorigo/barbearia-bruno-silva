export default function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink-soft">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="divider-razor mb-8" />
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl text-gold-gradient">BRUNO SILVA</p>
            <p className="mt-2 text-sm text-neutral-400">
              Tradição e estilo em cada corte. Barbearia moderna, atendimento de
              respeito.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Horário
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Todos os dias, 09h00 às 19h30
              <br />
              Slots de atendimento a cada 30 minutos
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Pagamento
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Crédito · Débito · Dinheiro · Pix
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs text-neutral-600">
          © {new Date().getFullYear()} Bruno Silva Barbearia. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
